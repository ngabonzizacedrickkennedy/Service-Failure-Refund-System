"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, ShieldCheck, ChevronDown, ChevronUp,
  RefreshCw, AlertTriangle, CheckCircle, XCircle,
  Briefcase, Star,
} from "lucide-react";
import { toast } from "react-toastify";
import { workerCvService, type WorkerMonitorEntry } from "@/lib/workerCvService";

const claimStatusColor: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:          { bg: "#f59e0b20", color: "#f59e0b", label: "Pending" },
  APPROVED:         { bg: "#22c55e20", color: "#22c55e", label: "Approved" },
  REJECTED:         { bg: "#6b728020", color: "#6b7280", label: "Rejected" },
  REFUND_INITIATED: { bg: "#6366f120", color: "#6366f1", label: "Refund Initiated" },
  REFUNDED:         { bg: "#0ea5e920", color: "#0ea5e9", label: "Refunded" },
};

export default function WorkersMonitorPage() {
  const [workers, setWorkers] = useState<WorkerMonitorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [banLoading, setBanLoading] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await workerCvService.getWorkersForMonitor();
      setWorkers(data);
    } catch {
      toast.error("Failed to load worker monitor data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBanToggle = async (worker: WorkerMonitorEntry) => {
    setBanLoading(prev => ({ ...prev, [worker.workerId]: true }));
    const newBanned = !worker.banned;
    try {
      await workerCvService.setBanStatus(worker.workerId, newBanned);
      setWorkers(prev =>
        prev.map(w => w.workerId === worker.workerId ? { ...w, banned: newBanned } : w)
      );
      toast.success(
        newBanned
          ? `${worker.workerName} has been banned from candidacy.`
          : `${worker.workerName} has been restored to candidacy.`
      );
    } catch {
      toast.error("Failed to update ban status.");
    } finally {
      setBanLoading(prev => ({ ...prev, [worker.workerId]: false }));
    }
  };

  const bannedCount = workers.filter(w => w.banned).length;
  const activeCount  = workers.filter(w => !w.banned).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>Workers Monitor</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Workers who have been reported in project failures. You can ban them from appearing as candidates.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm border transition hover:opacity-80"
          style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-4 w-4" style={{ color: "#f59e0b" }} />
            <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Total Flagged</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>{workers.length}</p>
        </div>
        <div className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldAlert className="h-4 w-4" style={{ color: "#ef4444" }} />
            <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Banned</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>{bannedCount}</p>
        </div>
        <div className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle className="h-4 w-4" style={{ color: "#22c55e" }} />
            <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Still Active</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#22c55e" }}>{activeCount}</p>
        </div>
      </div>

      {/* Worker list */}
      {workers.length === 0 ? (
        <div className="rounded-xl border py-16 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <ShieldCheck className="h-8 w-8 mx-auto mb-3" style={{ color: "#22c55e" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            No flagged workers
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Workers involved in project failures will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workers.map((worker, i) => {
            const isExpanded = expandedId === worker.workerId;

            return (
              <motion.div key={worker.workerId}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border overflow-hidden"
                style={{
                  backgroundColor: "var(--color-card)",
                  borderColor: worker.banned ? "#ef444440" : "var(--color-border)",
                }}>

                {/* Row header */}
                <div className="flex items-center gap-3 px-5 py-4">
                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : worker.workerId)}
                    className="flex-1 flex items-start gap-3 text-left min-w-0"
                  >
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                      style={{ backgroundColor: worker.banned ? "#ef4444" : "var(--color-primary)" }}>
                      {worker.workerName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate"
                          style={{ color: "var(--color-foreground)" }}>
                          {worker.workerName}
                        </p>
                        {worker.banned && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: "#ef444420", color: "#ef4444" }}>
                            Banned
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: worker.approvalStatus === "APPROVED" ? "#22c55e20" : "#6b728020",
                            color: worker.approvalStatus === "APPROVED" ? "#22c55e" : "#6b7280",
                          }}>
                          {worker.approvalStatus}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)" }}>
                        {worker.workerEmail} · {worker.specialization}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-xs"
                          style={{ color: "#ef4444" }}>
                          <AlertTriangle className="h-3 w-3" />
                          {worker.pastFailures} failure{worker.pastFailures !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1 text-xs"
                          style={{ color: "#22c55e" }}>
                          <CheckCircle className="h-3 w-3" />
                          {worker.completedProjects} completed
                        </span>
                        <span className="flex items-center gap-1 text-xs"
                          style={{ color: "#f59e0b" }}>
                          <Star className="h-3 w-3" />
                          {worker.ratingScore.toFixed(1)} / 10
                        </span>
                      </div>
                    </div>

                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: "var(--color-muted-foreground)" }} />
                      : <ChevronDown className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: "var(--color-muted-foreground)" }} />}
                  </button>

                  {/* Ban / Restore button */}
                  <button
                    onClick={() => handleBanToggle(worker)}
                    disabled={!!banLoading[worker.workerId]}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition disabled:opacity-50 flex-shrink-0"
                    style={{ backgroundColor: worker.banned ? "#22c55e" : "#ef4444" }}>
                    {banLoading[worker.workerId] ? (
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : worker.banned ? (
                      <><ShieldCheck className="h-3.5 w-3.5" /> Restore</>
                    ) : (
                      <><ShieldAlert className="h-3.5 w-3.5" /> Ban</>
                    )}
                  </button>
                </div>

                {/* Expanded: failed projects */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-3"
                        style={{ borderTop: "1px solid var(--color-border)" }}>
                        <p className="text-xs font-semibold pt-4"
                          style={{ color: "var(--color-foreground)" }}>
                          Project Failures ({worker.failedProjects.length})
                        </p>

                        {worker.failedProjects.length === 0 ? (
                          <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                            No claim records found.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {worker.failedProjects.map((fp) => {
                              const statusStyle = claimStatusColor[fp.claimStatus] ?? { bg: "#6b728020", color: "#6b7280", label: fp.claimStatus };
                              return (
                                <div key={fp.claimId}
                                  className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Briefcase className="h-4 w-4 flex-shrink-0"
                                      style={{ color: "var(--color-muted-foreground)" }} />
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium truncate"
                                        style={{ color: "var(--color-foreground)" }}>
                                        {fp.projectTitle}
                                      </p>
                                      <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                                        {fp.projectBudget != null
                                          ? `$${Number(fp.projectBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                          : "Budget unknown"
                                        }
                                        {" · "}
                                        {new Date(fp.claimCreatedAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                                    {statusStyle.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Ban/restore note */}
                        {worker.banned ? (
                          <div className="flex items-start gap-2 rounded-lg p-3"
                            style={{ backgroundColor: "#ef444410", border: "1px solid #ef444430" }}>
                            <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                            <p className="text-xs" style={{ color: "#ef4444" }}>
                              This worker is banned from candidacy. They will not appear in AI-ranked candidate lists for any project.
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 rounded-lg p-3"
                            style={{ backgroundColor: "#f59e0b10", border: "1px solid #f59e0b30" }}>
                            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                            <p className="text-xs" style={{ color: "#b45309" }}>
                              This worker is still visible as a candidate. Click <strong>Ban</strong> to remove them from all future project candidate lists.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
