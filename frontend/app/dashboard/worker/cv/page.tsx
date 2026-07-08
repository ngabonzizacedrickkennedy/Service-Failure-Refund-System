"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, Star, ChevronDown, MessageSquare, ChevronUp, Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { workerCvService, WorkerCvResponse } from "@/lib/workerCvService";

const FIELD_OPTIONS = [
  "Full-Stack Development",
  "Frontend Development",
  "Backend Development",
  "Mobile Development (iOS/Android)",
  "UI/UX Design",
  "Data Science & Analytics",
  "Machine Learning / AI",
  "DevOps & Cloud Engineering",
  "Cybersecurity",
  "Database Administration",
  "Quality Assurance & Testing",
  "Project Management",
  "Product Management",
  "Business Analysis",
  "Network Engineering",
  "Embedded Systems",
  "Blockchain Development",
  "Game Development",
  "Civil Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Architecture & Design",
  "Interior Design",
  "Construction & Building",
  "Plumbing & HVAC",
  "Marketing & Digital Marketing",
  "Content Creation & Copywriting",
  "Finance & Accounting",
  "Human Resources",
  "Legal & Compliance",
  "Healthcare Services",
  "Education & Training",
  "Logistics & Supply Chain",
  "Other (type below)",
];

const schema = z.object({
  yearsOfExperience: z.number({ error: "Must be a number" }).min(0).max(50),
  additionalCredentials: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function WorkerCvPage() {
  const [existing, setExisting] = useState<WorkerCvResponse | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ratingProcessing, setRatingProcessing] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const [fieldDropdown, setFieldDropdown] = useState("");
  const [customField, setCustomField] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    workerCvService.getMyCv()
      .then((cv) => {
        setExisting(cv);
        reset({
          yearsOfExperience: cv.yearsOfExperience,
          additionalCredentials: cv.additionalCredentials ?? "",
        });
        const spec = cv.specialization || "";
        if (FIELD_OPTIONS.includes(spec)) {
          setFieldDropdown(spec);
          setShowCustom(false);
        } else if (spec) {
          setFieldDropdown("Other (type below)");
          setCustomField(spec);
          setShowCustom(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [reset]);

  // Polls until the score OR reasoning differs from the snapshot taken right after CV submission.
  // previousScore and previousReasoning come from the submit response (not the pre-existing state),
  // so they already reflect the saved CV — any subsequent change means the AI finished re-rating.
  const pollForRating = (previousScore: number, previousReasoning: string | null) => {
    setRatingProcessing(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const fresh = await workerCvService.getMyCv();
        const scoreChanged    = fresh.ratingScore     !== previousScore;
        const reasoningChanged = fresh.ratingReasoning !== previousReasoning;
        if (scoreChanged || reasoningChanged || attempts >= 25) {
          setExisting(fresh);
          setRatingProcessing(false);
          if (pollRef.current) clearInterval(pollRef.current);
          if (scoreChanged || reasoningChanged) {
            toast.success("AI rating updated!");
          }
        }
      } catch {
        setRatingProcessing(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 4000);
  };

  const onSubmit = async (data: FormData) => {
    const finalSpec = showCustom
      ? customField.trim()
      : fieldDropdown === "Other (type below)" ? customField.trim() : fieldDropdown;
    if (!finalSpec) {
      toast.error("Please select or enter your field of expertise.");
      return;
    }
    setSaving(true);
    console.log("[CV Submit] credentials being sent:", JSON.stringify(data.additionalCredentials));
    console.log("[CV Submit] yearsOfExperience:", data.yearsOfExperience);
    console.log("[CV Submit] specialization:", finalSpec);
    try {
      const updated = await workerCvService.submitOrUpdateCv(
        finalSpec,
        data.yearsOfExperience,
        data.additionalCredentials ?? "",
        cvFile ?? undefined
      );
      setExisting(updated);
      setCvFile(null);
      toast.success(existing ? "CV updated! The AI is re-rating your profile…" : "CV submitted! The AI is generating your score…");
      // Baseline from the save response — AI hasn't run yet at this point,
      // so both values still reflect the old rating. Poll until either changes.
      pollForRating(updated.ratingScore, updated.ratingReasoning ?? null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to save CV.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-background)",
    color: "var(--color-foreground)",
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--color-primary)" }} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>{existing ? "My CV" : "Submit Your CV"}</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          {existing
            ? "Update your CV to improve your ranking for new projects."
            : "Submit your CV to be matched with projects. The AI Engine will analyze it and generate your score."}
        </p>
      </div>

      {existing && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>

          <div className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary-50, #f5f5f5)" }}>
              {ratingProcessing
                ? <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
                : <Star className="h-6 w-6" style={{ color: "#f59e0b" }} />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                AI Rating Score
              </p>
              {ratingProcessing ? (
                <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  AI is processing your profile…
                </p>
              ) : (
                <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                  {existing.ratingScore.toFixed(1)}
                  <span className="text-sm font-normal ml-1" style={{ color: "var(--color-muted-foreground)" }}>/10</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {existing.cvFileUrl && (
                <a href={existing.cvFileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm"
                  style={{ color: "var(--color-primary)" }}>
                  <FileText className="h-4 w-4" />
                  View CV
                </a>
              )}
              <button
                onClick={() => setShowReasoning((v) => !v)}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", backgroundColor: "transparent" }}>
                <MessageSquare className="h-3.5 w-3.5" />
                {showReasoning ? "Hide" : "Reason"}
                {showReasoning ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {showReasoning && (
            <div className="border-t px-4 pb-4 pt-3"
              style={{ borderColor: "var(--color-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "var(--color-muted-foreground)" }}>
                AI Feedback — What to improve
              </p>
              {existing.ratingReasoning ? (
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>
                  {existing.ratingReasoning}
                </p>
              ) : ratingProcessing ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" style={{ color: "var(--color-muted-foreground)" }} />
                  <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                    Generating feedback…
                  </p>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  No feedback yet. Make sure your CV file is uploaded and your profile is complete — the AI will generate
                  personalized feedback once your rating is processed. Try updating your CV to trigger a new rating.
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {ratingProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-primary)", borderStyle: "dashed" }}>
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" style={{ color: "var(--color-primary)" }} />
            <p className="text-sm" style={{ color: "var(--color-foreground)" }}>
              The AI is analyzing your profile and generating your new rating score and feedback. This usually takes a few seconds…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-6"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Field of Expertise <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div className="relative">
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none appearance-none pr-8"
                style={inputStyle}
                value={fieldDropdown}
                onChange={(e) => {
                  setFieldDropdown(e.target.value);
                  setShowCustom(e.target.value === "Other (type below)");
                }}>
                <option value="">— Select your field —</option>
                {FIELD_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: "var(--color-muted-foreground)" }} />
            </div>
            {showCustom && (
              <input type="text" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={inputStyle}
                placeholder="Type your specific field of expertise"
                value={customField}
                onChange={(e) => setCustomField(e.target.value)} />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Years of Experience
            </label>
            <input {...register("yearsOfExperience", { valueAsNumber: true })} type="number"
              min={0} max={50} placeholder="5"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{ ...inputStyle, borderColor: errors.yearsOfExperience ? "#ef4444" : "var(--color-border)" }} />
            {errors.yearsOfExperience && (
              <p className="text-xs" style={{ color: "#ef4444" }}>{errors.yearsOfExperience.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Additional Credentials
              <span className="ml-1 text-xs font-normal" style={{ color: "#f59e0b" }}>
                ⭐ fills this to improve your AI rating
              </span>
            </label>
            <textarea {...register("additionalCredentials")} rows={4}
              placeholder="e.g. Licensed General Contractor, OSHA Certified, Diploma in Civil Engineering, 5-star rating on previous platform…"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
              style={{ ...inputStyle }} />
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              List your certifications, licenses, diplomas, or notable achievements. The AI uses this to raise your score.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              CV File <span style={{ color: "var(--color-muted-foreground)" }}>(PDF, DOC — {existing ? "optional to replace" : "optional"})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed p-4 transition"
              style={{ borderColor: "var(--color-border)" }}>
              <Upload className="h-5 w-5" style={{ color: "var(--color-neutral-400)" }} />
              <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                {cvFile ? cvFile.name : "Click to upload CV"}
              </span>
              <input type="file" accept=".pdf,.doc,.docx"
                onChange={e => setCvFile(e.target.files?.[0] ?? null)} className="hidden" />
            </label>
          </div>

          <button type="submit" disabled={saving || ratingProcessing}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)" }}>
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving…
              </span>
            ) : existing ? "Update CV" : "Submit CV"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
