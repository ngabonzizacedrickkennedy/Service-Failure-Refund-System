"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, Star, CheckCircle, XCircle, Search,
  Briefcase, Mail, Loader2, Video, User, MessageSquare, X, RefreshCw, Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { workerCvService, type WorkerCvResponse } from "@/lib/workerCvService";
import { interviewService, type InterviewResponse } from "@/lib/interviewService";
import { userService } from "@/lib/userService";

function toAdminReasoning(reasoning: string, workerName: string): string {
  const first = workerName.split(" ")[0];
  return reasoning
    .replace(/\bYour\b/g, `${first}'s`)
    .replace(/\byour\b/g, "their")
    .replace(/\bYou\b/g, "They")
    .replace(/\byou\b/g, "they")
    .replace(/\byourself\b/g, "themselves")
    .replace(/\bit's essential to add their\b/g, "it's essential for them to add their")
    .replace(/\bit's essential that they\b/g, "it's essential that they");
}

interface AlumniWorker extends WorkerCvResponse {
  interviewScore?: number;
  scoringReason?: string | null;
  interviewStatus?: "pending" | "submitted" | "not_started";
  interviewId?: string;
  profileImageUrl?: string | null;
}

export default function AdminAlumniPage() {
  const [workers, setWorkers] = useState<AlumniWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "rejected" | "pending">("all");
  const [reasoningWorker, setReasoningWorker] = useState<AlumniWorker | null>(null);
  const [interviewReasoningWorker, setInterviewReasoningWorker] = useState<AlumniWorker | null>(null);
  const [aiScoringId, setAiScoringId] = useState<string | null>(null);

  const loadWorkers = (isInitial = false) => {
    if (!isInitial) setRefreshing(true);
    return Promise.allSettled([
      workerCvService.getAllCvs(),
      interviewService.getAllInterviews(),
    ]).then(([cvsRes, interviewsRes]) => {
      const cvs = cvsRes.status === "fulfilled" ? cvsRes.value : [];
      const interviews: InterviewResponse[] = interviewsRes.status === "fulfilled" ? interviewsRes.value : [];
      const interviewMap = new Map(interviews.map((i) => [i.workerId, i]));
      const baseWorkers = cvs.map((cv) => {
        const interview = interviewMap.get(cv.workerId);
        return {
          ...cv,
          interviewScore: interview?.interviewScore,
          scoringReason: interview?.scoringReason ?? null,
          interviewStatus: (interview ? (interview.status === "SCORED" ? "submitted" : "pending") : "not_started") as "pending" | "submitted" | "not_started",
          interviewId: interview?.id,
          profileImageUrl: null as string | null,
        };
      });
      setWorkers(baseWorkers);

      baseWorkers.forEach((w) => {
        userService.getUser(w.workerId)
          .then((u) => {
            if (u.profileImageUrl) {
              setWorkers((prev) =>
                prev.map((x) => x.workerId === w.workerId ? { ...x, profileImageUrl: u.profileImageUrl } : x)
              );
            }
          })
          .catch(() => {});
      });
    }).finally(() => {
      if (isInitial) setLoading(false);
      else setRefreshing(false);
    });
  };

  useEffect(() => {
    loadWorkers(true);
    const interval = setInterval(() => loadWorkers(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAiScore = async (worker: AlumniWorker) => {
    if (!worker.interviewId) return;
    setAiScoringId(worker.interviewId);
    try {
      const result = await interviewService.aiScoreInterview(worker.interviewId);
      setWorkers((prev) =>
        prev.map((w) =>
          w.workerId === worker.workerId
            ? { ...w, interviewScore: result.interviewScore, scoringReason: result.scoringReason, interviewStatus: "submitted" }
            : w
        )
      );
      toast.success(`AI scored this interview: ${result.interviewScore} / 100`);
    } catch {
      toast.error("AI scoring failed. Please try again.");
    } finally {
      setAiScoringId(null);
    }
  };

  const setApproval = async (worker: AlumniWorker, status: "APPROVED" | "REJECTED" | "PENDING") => {
    setActioning(worker.workerId);
    try {
      await workerCvService.setApprovalStatus(worker.workerId, status);
      setWorkers((prev) =>
        prev.map((w) => w.workerId === worker.workerId ? { ...w, approvalStatus: status } : w)
      );
      const label = status === "APPROVED" ? "approved" : status === "REJECTED" ? "rejected" : "reset to pending";
      toast.success(`${worker.workerName} has been ${label}.`);
    } catch {
      toast.error("Failed to update approval status.");
    } finally {
      setActioning(null);
    }
  };

  const filtered = workers.filter((w) => {
    const matchSearch =
      w.workerName.toLowerCase().includes(search.toLowerCase()) ||
      w.specialization.toLowerCase().includes(search.toLowerCase()) ||
      w.workerEmail.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "approved") return w.approvalStatus === "APPROVED";
    if (filter === "rejected") return w.approvalStatus === "REJECTED";
    if (filter === "pending")  return w.approvalStatus === "PENDING";
    return true;
  });

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const avatarColor = (id: string) => {
    const colors = ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % colors.length;
    return colors[h];
  };

  const ratingBar = (score: number, max = 10) => {
    const pct = Math.min(100, (score / max) * 100);
    const color = score >= max * 0.7 ? "#22c55e" : score >= max * 0.4 ? "#f59e0b" : "#ef4444";
    return { pct, color };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>System Alumni</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            View all workers with their AI rating and interview scores. Approve or reject their profiles.
            Only <strong>Approved</strong> workers appear as candidates in project matching.
          </p>
        </div>
        <button
          onClick={() => loadWorkers(false)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition hover:opacity-80 disabled:opacity-50"
          style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", backgroundColor: "var(--color-card)" }}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total",    count: workers.length,                                          color: "var(--color-primary)" },
          { label: "Approved", count: workers.filter((w) => w.approvalStatus === "APPROVED").length, color: "#22c55e" },
          { label: "Rejected", count: workers.filter((w) => w.approvalStatus === "REJECTED").length, color: "#ef4444" },
          { label: "Pending",  count: workers.filter((w) => w.approvalStatus === "PENDING").length,  color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4 text-center"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
          <input type="text" placeholder="Search workers…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border pl-9 pr-4 py-2.5 text-sm focus:outline-none"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }} />
        </div>
        <div className="flex gap-1 rounded-lg border p-1"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          {(["all", "approved", "pending", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition capitalize"
              style={{
                backgroundColor: filter === f ? "var(--color-primary)" : "transparent",
                color: filter === f ? "white" : "var(--color-muted-foreground)",
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <User className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>No workers found</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Workers will appear here once they submit their CVs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((w, i) => {
              const isApproved = w.approvalStatus === "APPROVED";
              const isRejected = w.approvalStatus === "REJECTED";
              const aiBar  = ratingBar(w.ratingScore, 10);
              const intBar = w.interviewScore !== undefined ? ratingBar(w.interviewScore, 100) : null;

              return (
                <motion.div key={w.workerId}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-xl border overflow-hidden"
                  style={{
                    backgroundColor: "var(--color-card)",
                    borderColor: isApproved ? "#22c55e60" : isRejected ? "#ef444460" : "var(--color-border)",
                  }}>
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center text-white text-base font-bold flex-shrink-0"
                          style={{ backgroundColor: avatarColor(w.workerId) }}>
                          {w.profileImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={w.profileImageUrl} alt={w.workerName} className="h-full w-full object-cover" />
                          ) : (
                            initials(w.workerName)
                          )}
                        </div>
                        {isApproved && <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-green-500 bg-white rounded-full" />}
                        {isRejected && <XCircle    className="absolute -bottom-1 -right-1 h-5 w-5 text-red-500  bg-white rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold" style={{ color: "var(--color-foreground)" }}>{w.workerName}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: isApproved ? "#22c55e20" : isRejected ? "#ef444420" : "#f59e0b20",
                              color:           isApproved ? "#22c55e"   : isRejected ? "#ef4444"   : "#f59e0b",
                            }}>
                            {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="h-3.5 w-3.5" style={{ color: "var(--color-neutral-400)" }} />
                          <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{w.workerEmail}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Briefcase className="h-3.5 w-3.5" style={{ color: "var(--color-neutral-400)" }} />
                          <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                            {w.specialization} · {w.yearsOfExperience} yrs exp
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="h-5 w-5" style={{ color: "#f59e0b" }} />
                        <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
                          {w.ratingScore.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {/* Rating bars */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1.5" style={{ color: "var(--color-muted-foreground)" }}>
                            <Award className="h-3.5 w-3.5" />
                            AI Rating
                            <button onClick={() => setReasoningWorker(w)}
                              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 border transition hover:opacity-80"
                              style={{ borderColor: "var(--color-border)", color: "var(--color-primary)", fontSize: "10px" }}>
                              <MessageSquare className="h-2.5 w-2.5" /> Reason
                            </button>
                          </span>
                          <span style={{ color: aiBar.color }}>{w.ratingScore.toFixed(1)} / 10</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                          <div className="h-2 rounded-full" style={{ width: `${aiBar.pct}%`, backgroundColor: aiBar.color }} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
                            <Video className="h-3.5 w-3.5" /> Interview Score
                            {w.interviewStatus === "submitted" && w.scoringReason && (
                              <button onClick={() => setInterviewReasoningWorker(w)}
                                className="flex items-center gap-0.5 rounded px-1.5 py-0.5 border transition hover:opacity-80"
                                style={{ borderColor: "var(--color-border)", color: "var(--color-primary)", fontSize: "10px" }}>
                                <MessageSquare className="h-2.5 w-2.5" /> Reason
                              </button>
                            )}
                          </span>
                          <span style={{ color: intBar ? intBar.color : "var(--color-muted-foreground)" }}>
                            {w.interviewStatus === "submitted" && w.interviewScore !== undefined
                              ? `${w.interviewScore} / 100`
                              : w.interviewStatus === "pending" ? "In Review" : "Not Started"}
                          </span>
                        </div>
                        <div className="h-2 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                          {intBar && <div className="h-2 rounded-full" style={{ width: `${intBar.pct}%`, backgroundColor: intBar.color }} />}
                        </div>
                        {w.interviewStatus === "pending" && w.interviewId && (
                          <div className="pt-1">
                            <button
                              onClick={() => handleAiScore(w)}
                              disabled={aiScoringId === w.interviewId}
                              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition disabled:opacity-50"
                              style={{ backgroundColor: "#7c3aed" }}>
                              {aiScoringId === w.interviewId
                                ? <><Loader2 className="h-3 w-3 animate-spin" /> Scoring with AI…</>
                                : <><Sparkles className="h-3 w-3" /> Score with AI</>}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isApproved && !isRejected && (
                      <div className="flex gap-3 pt-1">
                        <button onClick={() => setApproval(w, "APPROVED")} disabled={actioning === w.workerId}
                          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                          style={{ backgroundColor: "#22c55e" }}>
                          {actioning === w.workerId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Approve
                        </button>
                        <button onClick={() => setApproval(w, "REJECTED")} disabled={actioning === w.workerId}
                          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                          style={{ backgroundColor: "#ef4444" }}>
                          {actioning === w.workerId ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Reject
                        </button>
                      </div>
                    )}

                    {isApproved && (
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#22c55e" }}>
                          <CheckCircle className="h-4 w-4" /> Profile Approved — eligible for project matching
                        </p>
                        <button onClick={() => setApproval(w, "REJECTED")} disabled={actioning === w.workerId}
                          className="text-xs border rounded-lg px-3 py-1.5 transition"
                          style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                          Revoke & Reject
                        </button>
                      </div>
                    )}

                    {isRejected && (
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#ef4444" }}>
                          <XCircle className="h-4 w-4" /> Profile Rejected — hidden from all project matching
                        </p>
                        <button onClick={() => setApproval(w, "APPROVED")} disabled={actioning === w.workerId}
                          className="text-xs border rounded-lg px-3 py-1.5 transition"
                          style={{ borderColor: "#22c55e", color: "#22c55e" }}>
                          Re-approve
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Interview AI reasoning modal */}
      <AnimatePresence>
        {interviewReasoningWorker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setInterviewReasoningWorker(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-lg rounded-2xl border shadow-xl"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
                <div>
                  <p className="font-semibold" style={{ color: "var(--color-foreground)" }}>AI Interview Evaluation</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                    {interviewReasoningWorker.workerName} · {interviewReasoningWorker.specialization} · {interviewReasoningWorker.interviewScore} / 100
                  </p>
                </div>
                <button onClick={() => setInterviewReasoningWorker(null)}
                  className="rounded-lg p-1.5 transition hover:opacity-70"
                  style={{ color: "var(--color-muted-foreground)" }}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">
                <div className="rounded-xl p-4 border"
                  style={{ backgroundColor: "var(--color-background)", borderColor: "var(--color-border)" }}>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>
                    {interviewReasoningWorker.scoringReason || "No AI reasoning available."}
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setInterviewReasoningWorker(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
                    style={{ backgroundColor: "#7c3aed" }}>
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reasoning modal */}
      <AnimatePresence>
        {reasoningWorker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setReasoningWorker(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-lg rounded-2xl border shadow-xl"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
                <div>
                  <p className="font-semibold" style={{ color: "var(--color-foreground)" }}>AI Rating Analysis</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                    {reasoningWorker.workerName} · {reasoningWorker.specialization} · {reasoningWorker.ratingScore.toFixed(1)} / 10
                  </p>
                </div>
                <button onClick={() => setReasoningWorker(null)}
                  className="rounded-lg p-1.5 transition hover:opacity-70"
                  style={{ color: "var(--color-muted-foreground)" }}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">
                <div className="rounded-xl p-4 border"
                  style={{ backgroundColor: "var(--color-background)", borderColor: "var(--color-border)" }}>
                  {reasoningWorker.ratingReasoning ? (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>
                      {toAdminReasoning(reasoningWorker.ratingReasoning, reasoningWorker.workerName)}
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                      No analysis available yet.
                    </p>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setReasoningWorker(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
                    style={{ backgroundColor: "var(--color-primary)" }}>
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
