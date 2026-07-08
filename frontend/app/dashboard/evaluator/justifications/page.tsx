"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle, XCircle, Mail, ChevronDown, ChevronUp,
  Clock, Eye, ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { justificationService, JustificationWithClaimDto } from "@/lib/justificationService";
import api from "@/lib/api";

interface UserInfo { fullName: string; email: string; }

const statusColor: Record<string, string> = {
  PENDING: "#f59e0b", UNDER_REVIEW: "#3b82f6", APPROVED: "#22c55e",
  REJECTED: "#ef4444", REFUND_INITIATED: "#6366f1", REFUNDED: "#0ea5e9",
};
const jColor: Record<string, string> = {
  SUBMITTED: "#f59e0b", VALIDATED: "#22c55e", REJECTED: "#ef4444",
};

export default function EvaluatorJustificationsPage() {
  const [items, setItems]           = useState<JustificationWithClaimDto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [userMap, setUserMap]       = useState<Record<string, UserInfo>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // notes modal state
  const [notesModal, setNotesModal] = useState<{ claimId: string; type: "validate" | "reject" } | null>(null);
  const [notesText, setNotesText]   = useState("");

  // email modal state
  const [emailModal, setEmailModal] = useState<JustificationWithClaimDto | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await justificationService.getAllJustifications();
      setItems(data);
    } catch {
      toast.error("Failed to load justifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Resolve user names using the public GET /api/users/{id} endpoint —
  // avoids the admin-only /api/admin/users which would 401 an evaluator.
  useEffect(() => {
    if (items.length === 0) return;
    const uniqueIds = [...new Set(items.flatMap(i => [i.workerId, i.providerId].filter(Boolean)))];
    Promise.allSettled(
      uniqueIds.map((id) =>
        api.get<{ id: string; fullName: string; email: string }>(`/api/users/${id}`)
          .then((r) => ({ id, fullName: r.data.fullName, email: r.data.email }))
      )
    ).then((results) => {
      const m: Record<string, UserInfo> = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          m[r.value.id] = { fullName: r.value.fullName, email: r.value.email };
        }
      });
      setUserMap(m);
    });
  }, [items]);

  const handleSendEmail = async (item: JustificationWithClaimDto) => {
    const worker = userMap[item.workerId];
    if (!worker?.email) {
      toast.error("Worker email not found.");
      return;
    }
    setActionLoading(p => ({ ...p, [item.claimId + "_email"]: true }));
    try {
      await justificationService.requestJustificationEmail(
        item.claimId, worker.email, worker.fullName
      );
      toast.success("Justification request email sent to " + worker.fullName);
      setEmailModal(null);
    } catch {
      toast.error("Failed to send email.");
    } finally {
      setActionLoading(p => ({ ...p, [item.claimId + "_email"]: false }));
    }
  };

  const openNotes = (claimId: string, type: "validate" | "reject") => {
    setNotesText("");
    setNotesModal({ claimId, type });
  };

  const confirmAction = async () => {
    if (!notesModal) return;
    const { claimId, type } = notesModal;
    setActionLoading(p => ({ ...p, [claimId]: true }));
    try {
      let updated: JustificationWithClaimDto;
      if (type === "validate") {
        updated = await justificationService.validateJustification(claimId, notesText);
        toast.success("Justification validated. Worker notified.");
      } else {
        updated = await justificationService.rejectJustification(claimId, notesText);
        toast.success("Justification rejected. Worker notified.");
      }
      setItems(prev => prev.map(i => i.claimId === claimId ? updated : i));
      setNotesModal(null);
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setActionLoading(p => ({ ...p, [claimId]: false }));
    }
  };

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
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--color-neutral-100)" }}>
          <ShieldCheck className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
        </div>
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>Worker Justifications</h3>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
            Review justifications, send email requests, and validate or reject submissions.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border py-12 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>No claims found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedId === item.claimId;
            const worker = userMap[item.workerId];
            const hasJustification = !!item.justificationId;

            return (
              <motion.div key={item.claimId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>

                {/* Row header */}
                <button className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : item.claimId)}>
                  <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                    {/* Claim status */}
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                      style={{ backgroundColor: statusColor[item.claimStatus] || "#6b7280" }}>
                      {item.claimStatus.replace(/_/g, " ")}
                    </span>

                    {/* Justification status */}
                    {hasJustification ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: (jColor[item.justificationStatus!] || "#6b7280") + "20",
                          color: jColor[item.justificationStatus!] || "#6b7280",
                        }}>
                        Justification: {item.justificationStatus}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-neutral-500)" }}>
                        No Justification Yet
                      </span>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>
                        Claim #{item.claimId.slice(0, 8)} · Worker: {worker?.fullName || item.workerId.slice(0, 8) + "…"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                        Filed {new Date(item.claimCreatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-muted-foreground)" }} />
                    : <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-muted-foreground)" }} />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden">
                      <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid var(--color-border)" }}>

                        {/* Claim details */}
                        <div className="pt-4 space-y-1">
                          <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>CLAIM DESCRIPTION</p>
                          <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{item.claimDescription}</p>
                        </div>

                        {/* Worker info */}
                        <div className="grid grid-cols-2 gap-3 text-xs rounded-lg p-3"
                          style={{ backgroundColor: "var(--color-neutral-50)" }}>
                          <div>
                            <p className="font-medium" style={{ color: "var(--color-muted-foreground)" }}>Worker</p>
                            <p style={{ color: "var(--color-foreground)" }}>{worker?.fullName || "Unknown"}</p>
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: "var(--color-muted-foreground)" }}>Email</p>
                            <p style={{ color: "var(--color-foreground)" }}>{worker?.email || "—"}</p>
                          </div>
                        </div>

                        {/* Justification content */}
                        {hasJustification ? (
                          <div className="rounded-xl border p-4 space-y-3"
                            style={{
                              borderColor: jColor[item.justificationStatus!] || "var(--color-border)",
                              backgroundColor: "var(--color-background)",
                            }}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" style={{ color: jColor[item.justificationStatus!] || "#6b7280" }} />
                              <p className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>
                                Worker Justification · {item.justificationStatus}
                              </p>
                              <span className="text-xs ml-auto" style={{ color: "var(--color-muted-foreground)" }}>
                                {item.justificationCreatedAt
                                  ? new Date(item.justificationCreatedAt).toLocaleString()
                                  : ""}
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: "var(--color-foreground)" }}>
                              {item.justificationDescription}
                            </p>
                            {item.evaluatorNotes && (
                              <div className="text-xs rounded p-2"
                                style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-muted-foreground)" }}>
                                <span className="font-medium">Notes: </span>{item.evaluatorNotes}
                              </div>
                            )}
                            {item.evidenceUrls.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {item.evidenceUrls.map((url, idx) => (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs rounded-lg border px-2 py-1"
                                    style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}>
                                    <Eye className="h-3 w-3" /> Evidence {idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Validate / Reject buttons */}
                            {item.justificationStatus === "SUBMITTED" && (
                              <div className="flex gap-3 pt-2">
                                <button onClick={() => openNotes(item.claimId, "validate")}
                                  disabled={!!actionLoading[item.claimId]}
                                  className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white transition disabled:opacity-50"
                                  style={{ backgroundColor: "#22c55e" }}>
                                  <CheckCircle className="h-4 w-4" /> Validate Justification
                                </button>
                                <button onClick={() => openNotes(item.claimId, "reject")}
                                  disabled={!!actionLoading[item.claimId]}
                                  className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white transition disabled:opacity-50"
                                  style={{ backgroundColor: "#ef4444" }}>
                                  <XCircle className="h-4 w-4" /> Reject Justification
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* No justification yet — send request email */
                          <div className="rounded-xl border border-dashed p-4 text-center space-y-3"
                            style={{ borderColor: "var(--color-border)" }}>
                            <Clock className="mx-auto h-8 w-8" style={{ color: "var(--color-neutral-300)" }} />
                            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                              The worker has not submitted a justification yet.
                            </p>
                            <button
                              onClick={() => setEmailModal(item)}
                              disabled={!!actionLoading[item.claimId + "_email"]}
                              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition mx-auto disabled:opacity-50"
                              style={{ backgroundColor: "#6366f1" }}>
                              <Mail className="h-4 w-4" />
                              Send Justification Request Email
                            </button>
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

      {/* Notes modal */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl border p-6 space-y-4 mx-4"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>
              {notesModal.type === "validate" ? "Validate Justification" : "Reject Justification"}
            </h5>
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              Add an optional note to the worker explaining your decision.
            </p>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={3}
              placeholder="Optional evaluator notes..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-foreground)",
              }}
            />
            <div className="flex gap-3">
              <button onClick={confirmAction}
                disabled={!!actionLoading[notesModal.claimId]}
                className="flex-1 rounded-lg py-2 text-sm font-medium text-white transition"
                style={{ backgroundColor: notesModal.type === "validate" ? "#22c55e" : "#ef4444" }}>
                {actionLoading[notesModal.claimId] ? "Processing…" : notesModal.type === "validate" ? "Confirm Validate" : "Confirm Reject"}
              </button>
              <button onClick={() => setNotesModal(null)}
                className="flex-1 rounded-lg border py-2 text-sm transition"
                style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Email confirmation modal */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl border p-6 space-y-4 mx-4"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>Send Justification Request</h5>
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              An email will be sent to <strong>{userMap[emailModal.workerId]?.fullName || "the worker"}</strong> (
              {userMap[emailModal.workerId]?.email || "unknown email"}) informing them of the pending claim
              and requesting their justification.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleSendEmail(emailModal)}
                disabled={!!actionLoading[emailModal.claimId + "_email"]}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white transition"
                style={{ backgroundColor: "#6366f1" }}>
                <Mail className="h-4 w-4" />
                {actionLoading[emailModal.claimId + "_email"] ? "Sending…" : "Send Email"}
              </button>
              <button onClick={() => setEmailModal(null)}
                className="flex-1 rounded-lg border py-2 text-sm transition"
                style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
