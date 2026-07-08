"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, VideoOff, Mic, MicOff, Camera, CheckCircle,
  AlertTriangle, Play, StopCircle, ChevronRight, Clock,
  Send, Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { workerCvService } from "@/lib/workerCvService";
import { authService } from "@/lib/authService";
import { interviewService, type InterviewResponse } from "@/lib/interviewService";

type Stage = "gate" | "setup" | "ready" | "question" | "reviewing" | "done";

interface Answer {
  questionIndex: number;
  question: string;
  transcript: string;
  durationSec: number;
}

const QUESTIONS = [
  "Tell me about yourself and your professional background. What are the key skills and experiences that make you stand out?",
  "Describe a challenging project you worked on. What was the problem, your approach, and the outcome?",
  "How do you handle tight deadlines and multiple competing priorities? Give a specific example.",
  "Where do you see yourself professionally in the next three years, and how does this role fit into that vision?",
];

const TIME_LIMIT = 60;

export default function WorkerInterviewPage() {
  const [stage, setStage] = useState<Stage>("gate");
  const [cvSubmitted, setCvSubmitted] = useState(false);
  const [checkingCv, setCheckingCv] = useState(true);
  const [profilePct, setProfilePct] = useState(0);

  /* camera & mic */
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* Callback ref: fires the moment any video element mounts, attaches the stream immediately */
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
    }
  }, []);
  const [cameraOk, setCameraOk] = useState(false);
  const [cameraErr, setCameraErr] = useState("");
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  /* recording */
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* speech */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported] = useState(() =>
    typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );

  /* interview state */
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [transcript, setTranscript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refining, setRefining] = useState(false);
  const [existingInterview, setExistingInterview] = useState<InterviewResponse | null>(null);

  /* Check CV eligibility and whether interview was already submitted */
  useEffect(() => {
    const s = authService.getSession();
    if (!s) { setCheckingCv(false); return; }

    (async () => {
      try {
        const cv = await workerCvService.getMyCv();
        setCvSubmitted(!!cv.specialization);
        setProfilePct(cv.ratingScore > 0 ? 85 : 75);
        const interview = await interviewService.getMyInterview().catch(() => null);
        if (interview) {
          setExistingInterview(interview);
          setStage("done");
        }
      } catch {
        setCvSubmitted(false);
      } finally {
        setCheckingCv(false);
      }
    })();
  }, []);

  /* Start camera */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOk(true);
    } catch {
      setCameraErr("Cannot access camera or microphone. Please allow permissions and try again.");
    }
  }, []);

  const startSpeechRecognition = useCallback(() => {
    if (!speechSupported) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += text + " ";
        else interimText += text;
      }
      if (finalText) setTranscript((prev) => prev + finalText);
      setInterimTranscript(interimText);
    };
    recognition.onend = () => {
      setInterimTranscript("");
      // Auto-restart if we were not explicitly stopped (recognitionRef still set)
      if (recognitionRef.current) {
        try { recognition.start(); } catch { /* already starting */ }
      }
    };
    recognition.start();
    recognitionRef.current = recognition;
  }, [speechSupported]);

  const stopSpeechRecognition = useCallback(() => {
    // Null the ref FIRST so onend does not auto-restart after we stop
    const r = recognitionRef.current;
    recognitionRef.current = null;
    r?.stop();
    setInterimTranscript("");
  }, []);

  /* Speak question only on ready stage — never while mic is recording */
  useEffect(() => {
    if (stage === "ready") {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(QUESTIONS[currentQ]);
      utterance.rate = 0.92;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
    return () => { window.speechSynthesis.cancel(); };
  }, [stage, currentQ]);

  /* Stop camera when done */
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleMute = () => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((t) => { t.enabled = muted; });
    setMuted((m) => !m);
  };

  const toggleVideo = () => {
    if (!streamRef.current) return;
    streamRef.current.getVideoTracks().forEach((t) => { t.enabled = videoOff; });
    setVideoOff((v) => !v);
  };

  /* Start recording for current question */
  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setTranscript("");
    setTimeLeft(TIME_LIMIT);

    const recorder = new MediaRecorder(streamRef.current);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.start(250);
    setRecording(true);
    startSpeechRecognition();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    recorderRef.current?.stop();
    setRecording(false);
    stopSpeechRecognition();
  }, [stopSpeechRecognition]);

  const saveAnswer = () => {
    const elapsed = TIME_LIMIT - timeLeft;
    const ans: Answer = {
      questionIndex: currentQ,
      question: QUESTIONS[currentQ],
      transcript: transcript.trim() || "(No text entered — audio recorded)",
      durationSec: elapsed,
    };
    setAnswers((prev) => [...prev, ans]);

    if (currentQ + 1 < QUESTIONS.length) {
      setCurrentQ((q) => q + 1);
      setTranscript("");
      setTimeLeft(TIME_LIMIT);
      setStage("ready");
    } else {
      setStage("reviewing");
    }
  };

  const submitInterview = async () => {
    setSubmitting(true);
    try {
      const result = await interviewService.submitInterview(answers);
      setExistingInterview(result);
      toast.success("Interview submitted successfully! The admin will review your results.");
      setStage("done");
    } catch {
      toast.error("Failed to submit interview. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Gate check ─── */
  if (checkingCv) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!cvSubmitted) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: "#ef444420" }}>
          <AlertTriangle className="h-8 w-8" style={{ color: "#ef4444" }} />
        </div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Interview Not Available</h3>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          You have not yet submitted your CV. Please go to the <strong>My CV</strong> section,
          fill in your specialization and experience, then return here to start your interview.
        </p>
        <a href="/dashboard/worker/cv"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white mt-2"
          style={{ backgroundColor: "var(--color-primary)" }}>
          Go to My CV
        </a>
      </div>
    );
  }

  if (profilePct < 80 && profilePct > 0) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: "#f59e0b20" }}>
          <AlertTriangle className="h-8 w-8" style={{ color: "#f59e0b" }} />
        </div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Profile Incomplete</h3>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Your profile completion is below 80%. Complete your profile first to unlock the AI interview.
        </p>
        <a href="/dashboard/worker/profile"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-primary)" }}>
          Complete Profile
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>AI Interview</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Answer 4 questions (1 minute each). Your responses are submitted to the admin for evaluation.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* ─── Stage: setup ─── */}
        {stage === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-5">
            <div className="rounded-xl border p-5 space-y-4"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>Camera & Microphone Setup</h5>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                Make sure your face is clearly visible in the preview below before starting.
              </p>

              {/* Video preview */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <video ref={videoCallbackRef} autoPlay muted playsInline
                  className="w-full h-full object-cover" style={{ display: cameraOk ? "block" : "none" }} />
                {!cameraOk && (
                  <div className="text-center space-y-3 p-8">
                    <VideoOff className="h-12 w-12 mx-auto text-white/40" />
                    <p className="text-white/60 text-sm">{cameraErr || "Camera not started"}</p>
                    {cameraErr && (
                      <p className="text-xs text-white/40">Allow camera & microphone access in your browser settings.</p>
                    )}
                  </div>
                )}
                {/* Controls overlay */}
                {cameraOk && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    <button onClick={toggleMute}
                      className="h-9 w-9 rounded-full flex items-center justify-center transition"
                      style={{ backgroundColor: muted ? "#ef4444" : "rgba(255,255,255,0.2)" }}>
                      {muted ? <MicOff className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4 text-white" />}
                    </button>
                    <button onClick={toggleVideo}
                      className="h-9 w-9 rounded-full flex items-center justify-center transition"
                      style={{ backgroundColor: videoOff ? "#ef4444" : "rgba(255,255,255,0.2)" }}>
                      {videoOff ? <VideoOff className="h-4 w-4 text-white" /> : <Video className="h-4 w-4 text-white" />}
                    </button>
                  </div>
                )}
              </div>

              {!cameraOk && !cameraErr && (
                <button onClick={startCamera}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  <Camera className="h-4 w-4" />
                  Enable Camera & Microphone
                </button>
              )}
              {cameraErr && (
                <button onClick={startCamera}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white"
                  style={{ backgroundColor: "#ef4444" }}>
                  Retry
                </button>
              )}

              {/* Checklist */}
              <div className="space-y-2 pt-2">
                {[
                  { label: "Camera is on and face is clearly visible", ok: cameraOk && !videoOff },
                  { label: "Microphone is enabled", ok: cameraOk && !muted },
                  { label: "You are in a quiet, well-lit environment", ok: cameraOk },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: c.ok ? "#22c55e" : "var(--color-border)" }}>
                      {c.ok && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm" style={{ color: c.ok ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStage("ready")}
              disabled={!cameraOk}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition disabled:opacity-40"
              style={{ backgroundColor: "var(--color-primary)" }}>
              I&apos;m Ready — Begin Interview
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Stage: gate (start screen) ─── */}
        {stage === "gate" && (
          <motion.div key="gate" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="rounded-xl border p-8 space-y-5 text-center"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: "#7c3aed20" }}>
                <Video className="h-8 w-8" style={{ color: "#7c3aed" }} />
              </div>
              <h4 className="font-bold" style={{ color: "var(--color-foreground)" }}>AI Video Interview</h4>
              <p className="text-sm max-w-md mx-auto" style={{ color: "var(--color-muted-foreground)" }}>
                You will be asked <strong>4 questions</strong> based on your CV and field of expertise.
                Each question allows <strong>1 minute</strong> to respond verbally and optionally in writing.
                Your answers are submitted to the admin for scoring.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-sm">
                {[
                  { icon: <Video className="h-4 w-4" />, text: "Video required" },
                  { icon: <Mic className="h-4 w-4" />, text: "Mic required" },
                  { icon: <Clock className="h-4 w-4" />, text: "1 min per question" },
                  { icon: <CheckCircle className="h-4 w-4" />, text: "4 questions total" },
                ].map((it) => (
                  <div key={it.text} className="flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{ backgroundColor: "var(--color-neutral-50)" }}>
                    <span style={{ color: "var(--color-primary)" }}>{it.icon}</span>
                    <span style={{ color: "var(--color-foreground)" }}>{it.text}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setStage("setup"); startCamera(); }}
                className="inline-flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: "#7c3aed" }}>
                <Camera className="h-4 w-4" />
                Set Up Camera
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Stage: ready ─── */}
        {stage === "ready" && (
          <motion.div key="ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-5">
            <div className="rounded-xl border p-5"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <div className="flex gap-2 mb-4">
                {QUESTIONS.map((_, i) => (
                  <div key={i} className="flex-1 h-1.5 rounded-full"
                    style={{ backgroundColor: "var(--color-border)" }} />
                ))}
              </div>
              <p className="text-sm font-medium mb-4" style={{ color: "var(--color-muted-foreground)" }}>
                Question {currentQ + 1} of {QUESTIONS.length}
              </p>
              <p className="text-base font-semibold leading-relaxed mb-5" style={{ color: "var(--color-foreground)" }}>
                {QUESTIONS[currentQ]}
              </p>
              <button
                onClick={() => { window.speechSynthesis.cancel(); setStage("question"); startRecording(); }}
                className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white"
                style={{ backgroundColor: "#22c55e" }}>
                <Play className="h-4 w-4" />
                Start Answering
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Stage: question (recording) ─── */}
        {stage === "question" && (
          <motion.div key="question" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            {/* Timer + question */}
            <div className="rounded-xl border p-5 space-y-3"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase" style={{ color: "var(--color-muted-foreground)" }}>
                  Question {currentQ + 1} / {QUESTIONS.length}
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-bold tabular-nums"
                    style={{ color: timeLeft < 15 ? "#ef4444" : "var(--color-foreground)" }}>
                    {timeLeft}s
                  </span>
                </div>
              </div>
              {/* Progress */}
              <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                <motion.div className="h-1.5 rounded-full"
                  style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%`, backgroundColor: timeLeft < 15 ? "#ef4444" : "#22c55e" }}
                  transition={{ duration: 0.5 }} />
              </div>
              <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--color-foreground)" }}>
                {QUESTIONS[currentQ]}
              </p>
            </div>

            {/* Video + answer input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden bg-black aspect-video">
                <video ref={videoCallbackRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--color-muted-foreground)" }}>
                  {speechSupported
                    ? <><span className="h-2 w-2 rounded-full bg-red-500 animate-pulse inline-block" /> Live transcript (auto-filled from your voice)</>
                    : "Your answer in writing (speech not supported in this browser)"}
                </label>
                <textarea
                  className="w-full h-32 rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }}
                  placeholder={speechSupported ? "Your spoken words will appear here automatically…" : "Type key points of your answer here…"}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)} />
                {interimTranscript && (
                  <p className="text-xs px-1 italic" style={{ color: "var(--color-muted-foreground)" }}>
                    {interimTranscript}
                  </p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                disabled={refining}
                onClick={async () => {
                  stopRecording();
                  const raw = transcript.trim();
                  if (raw && speechSupported) {
                    setRefining(true);
                    try {
                      const res = await fetch("http://localhost:8083/api/ai/interview/refine-transcript", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ raw_transcript: raw, question: QUESTIONS[currentQ] }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.refined_transcript) setTranscript(data.refined_transcript);
                      }
                    } catch { /* keep raw transcript on failure */ }
                    setRefining(false);
                  }
                  saveAnswer();
                }}
                className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "#ef4444" }}>
                {refining ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="h-4 w-4" />}
                {refining ? "Cleaning up…" : "Stop & Save Answer"}
              </button>
              <button onClick={toggleMute}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border transition"
                style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {muted ? "Unmute" : "Mute"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Stage: reviewing ─── */}
        {stage === "reviewing" && (
          <motion.div key="reviewing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-5">
            <div className="rounded-xl border p-5"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <h5 className="font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
                Review Your Answers
              </h5>
              <div className="space-y-4">
                {answers.map((a, i) => (
                  <div key={i} className="rounded-lg border p-4 space-y-2"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-neutral-50)" }}>
                    <p className="text-xs font-bold uppercase" style={{ color: "var(--color-muted-foreground)" }}>
                      Q{i + 1} — {a.durationSec}s answered
                    </p>
                    <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{a.question}</p>
                    <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{a.transcript}</p>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={submitInterview} disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Submitting…" : "Submit Interview to Admin"}
            </button>
          </motion.div>
        )}

        {/* ─── Stage: done ─── */}
        {stage === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 py-8">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: "#22c55e20" }}>
              <CheckCircle className="h-8 w-8" style={{ color: "#22c55e" }} />
            </div>
            <h4 className="font-bold" style={{ color: "var(--color-foreground)" }}>Interview Submitted!</h4>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--color-muted-foreground)" }}>
              Your answers have been sent to the admin for evaluation.
            </p>

            {existingInterview && (
              <div className="max-w-sm mx-auto rounded-xl border p-4 text-left space-y-3"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--color-muted-foreground)" }}>Status</span>
                  <span className="font-medium px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: existingInterview.status === "SCORED" ? "#22c55e20" : "#f59e0b20",
                      color: existingInterview.status === "SCORED" ? "#22c55e" : "#f59e0b",
                    }}>
                    {existingInterview.status === "SCORED" ? "Scored" : existingInterview.status === "UNDER_REVIEW" ? "Under Review" : "In Review"}
                  </span>
                </div>
                {existingInterview.status === "SCORED" && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "var(--color-muted-foreground)" }}>Your Score</span>
                      <span className="font-bold text-base" style={{ color: "#22c55e" }}>
                        {existingInterview.interviewScore} / 100
                      </span>
                    </div>
                    {existingInterview.scoringReason && (
                      <div className="rounded-lg p-3 text-left text-xs leading-relaxed"
                        style={{ backgroundColor: "var(--color-neutral-50)", color: "var(--color-muted-foreground)" }}>
                        {existingInterview.scoringReason}
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--color-muted-foreground)" }}>Submitted</span>
                  <span style={{ color: "var(--color-foreground)" }}>
                    {new Date(existingInterview.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            <a href="/dashboard/worker"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}>
              Back to Dashboard
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
