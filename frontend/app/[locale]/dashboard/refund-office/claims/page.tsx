"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, ChevronDown, ChevronUp, MessageSquare, Eye,
  Sparkles, RefreshCw, AlertTriangle, Download, Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { refundService, type RefundClaimResponse } from "@/lib/refundService";
import { aiService, type ApologyValidationResult } from "@/lib/aiService";
import { authService } from "@/lib/authService";
import { generateClaimReportPdf } from "@/lib/pdfReport";

interface MessageEvidenceItem {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  sentAt: string;
}

function parseMessages(json: string | null): MessageEvidenceItem[] {
  if (!json) return [];
  try { return JSON.parse(json) as MessageEvidenceItem[]; } catch { return []; }
}

export default function RefundOfficeClaimsPage() {
  const [claims, setClaims] = useState<RefundClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [msgExpanded, setMsgExpanded] = useState<Record<string, boolean>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiResults, setAiResults] = useState<Record<string, ApologyValidationResult>>({});
  const [refundLoading, setRefundLoading] = useState<Record<string, boolean>>({});
  const [boomClaim, setBoomClaim] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({});

  const loadClaims = useCallback(async () => {
    try {
      const data = await refundService.getRefundPendingClaims();
      setClaims(data);
    } catch {
      toast.error("Failed to load refund-pending claims.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  const handleAiValidate = async (claim: RefundClaimResponse) => {
    setAiLoading(prev => ({ ...prev, [claim.id]: true }));
    try {
      const result = await aiService.validateApology(claim.id, claim.messageEvidence);
      setAiResults(prev => ({ ...prev, [claim.id]: result }));
      if (result.has_apology) {
        setBoomClaim(claim.id);
        setTimeout(() => setBoomClaim(null), 4000);
      }
    } catch {
      toast.error("AI validation failed. Try again.");
    } finally {
      setAiLoading(prev => ({ ...prev, [claim.id]: false }));
    }
  };

  const handleDownloadPdf = async (claim: RefundClaimResponse) => {
    setPdfLoading(prev => ({ ...prev, [claim.id]: true }));
    try {
      const session = authService.getSession();
      await generateClaimReportPdf(claim, {
        fullName: session?.fullName ?? "Unknown User",
        role: session?.role ?? "USER",
      });
    } catch {
      toast.error("Failed to generate PDF report.");
    } finally {
      setPdfLoading(prev => ({ ...prev, [claim.id]: false }));
    }
  };

  const handleProcessRefund = async (id: string) => {
    setRefundLoading(prev => ({ ...prev, [id]: true }));
    try {
      const updated = await refundService.processRefund(id);
      setClaims(prev => prev.filter(c => c.id !== id));
      toast.success(`Refund of ${updated.projectBudget ?? "the project budget"} processed. Provider notified.`);
    } catch {
      toast.error("Failed to process refund.");
    } finally {
      setRefundLoading(prev => ({ ...prev, [id]: false }));
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
      {/* Boom animation overlay */}
      <AnimatePresence>
        {boomClaim && (
          <motion.div
            initial={{ y: "100%", opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-8 left-1/2 z-50 flex items-center gap-4 rounded-2xl px-8 py-5 shadow-2xl"
            style={{
              transform: "translateX(-50%)",
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              minWidth: 340,
              maxWidth: 520,
            }}
          >
            <motion.div
              animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1.3, 1.1, 1.1, 1] }}
              transition={{ duration: 0.6 }}
            >
              <CheckCircle className="h-10 w-10 text-white flex-shrink-0" />
            </motion.div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Confirmed!</p>
              <p className="text-green-100 text-sm mt-0.5">
                This claim has to be refunded. The worker sent an apology.
              </p>
            </div>
            <motion.div
              className="absolute -top-3 -right-3 text-2xl"
              animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.4, 1.4, 1] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              ✅
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Refund Requests</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Claims approved for refund. Validate the apology, then process the refund.
        </p>
      </div>

      {claims.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <CheckCircle className="h-8 w-8 mx-auto mb-3" style={{ color: "#22c55e" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            No pending refund requests
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            All refunds have been processed or none are pending.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const isExpanded = expandedId === claim.id;
            const messages = parseMessages(claim.messageEvidence);
            const aiResult = aiResults[claim.id];

            return (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                {/* Header */}
                <button
                  className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:opacity-80 transition"
                  onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                        style={{ backgroundColor: "#5B4FE5" }}>
                        Refund Pending
                      </span>
                      {claim.projectBudget && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-foreground)" }}>
                          Refund: {claim.projectBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                      Project: {claim.projectId.slice(0, 8)}…
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      Filed {new Date(claim.createdAt).toLocaleDateString()} · Provider: {claim.providerId.slice(0, 8)}…
                    </p>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: "var(--color-muted-foreground)" }} />
                    : <ChevronDown className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: "var(--color-muted-foreground)" }} />}
                </button>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4"
                        style={{ borderTop: "1px solid var(--color-border)" }}>

                        {/* Description */}
                        <div className="pt-4 space-y-1">
                          <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>Claim Description</p>
                          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{claim.description}</p>
                        </div>

                        {/* Worker response */}
                        {claim.workerResponse && (
                          <div className="rounded-lg border p-3 space-y-1"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
                            <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>Worker Response</p>
                            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{claim.workerResponse}</p>
                          </div>
                        )}

                        {/* Proof documents */}
                        {claim.proofDocumentUrls.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                              Proof Documents ({claim.proofDocumentUrls.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {claim.proofDocumentUrls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition hover:opacity-80"
                                  style={{ borderColor: "var(--color-border)", color: "#5B4FE5" }}>
                                  <Eye className="h-3 w-3" /> Document {i + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Message evidence */}
                        {messages.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" style={{ color: "#5B4FE5" }} />
                              <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                                Message Evidence ({messages.length} messages)
                              </p>
                              <button
                                onClick={() => setMsgExpanded(prev => ({ ...prev, [claim.id]: !prev[claim.id] }))}
                                className="text-xs"
                                style={{ color: "#5B4FE5" }}>
                                {msgExpanded[claim.id] ? "Hide" : "View"}
                              </button>
                            </div>
                            <AnimatePresence>
                              {msgExpanded[claim.id] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="max-h-52 overflow-y-auto rounded-lg border p-3 space-y-3"
                                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
                                    {messages.map((m) => (
                                      <div key={m.id}>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{m.senderName}</span>
                                          <span className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
                                            {new Date(m.sentAt).toLocaleString()}
                                          </span>
                                        </div>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{m.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* AI Mediation Report */}
                        {claim.aiMediationReport && (
                          <div className="rounded-lg border p-3 space-y-1"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
                            <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>AI Mediation Report</p>
                            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{claim.aiMediationReport}</p>
                          </div>
                        )}

                        {/* AI Validate Apology section */}
                        <div className="rounded-2xl border p-4 space-y-3"
                          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>
                                AI Apology Validation
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                                AI analyses the message conversation to detect if the worker sent an apology acknowledging project failure.
                              </p>
                            </div>
                            <button
                              onClick={() => handleAiValidate(claim)}
                              disabled={aiLoading[claim.id]}
                              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white flex-shrink-0 transition disabled:opacity-50"
                              style={{ backgroundColor: "#5B4FE5" }}>
                              {aiLoading[claim.id] ? (
                                <><span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> Analysing…</>
                              ) : (
                                <><Sparkles className="h-3 w-3" /> {aiResult ? "Re-validate" : "AI Validate"}</>
                              )}
                            </button>
                          </div>

                          {/* AI result */}
                          {aiResult && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-lg border p-3 space-y-2"
                              style={{
                                borderColor: aiResult.has_apology ? "#22c55e" : "#f59e0b",
                                backgroundColor: aiResult.has_apology
                                  ? "color-mix(in srgb, #22c55e 8%, transparent)"
                                  : "color-mix(in srgb, #f59e0b 8%, transparent)",
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {aiResult.has_apology ? (
                                  <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#22c55e" }} />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: "#f59e0b" }} />
                                )}
                                <p className="text-sm font-bold"
                                  style={{ color: aiResult.has_apology ? "#16a34a" : "#b45309" }}>
                                  {aiResult.has_apology
                                    ? "Apology Detected — Refund Validated"
                                    : "No Clear Apology Found"}
                                </p>
                                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-muted-foreground)" }}>
                                  Confidence: {aiResult.confidence}
                                </span>
                              </div>
                              <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{aiResult.reasoning}</p>
                              {aiResult.apology_excerpt && (
                                <div className="rounded-md p-2 text-xs italic"
                                  style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-foreground)" }}>
                                  &ldquo;{aiResult.apology_excerpt}&rdquo;
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>

                        {/* Refund budget summary */}
                        {claim.projectBudget && (
                          <div className="rounded-lg border p-3 flex items-center justify-between"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
                            <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                              Refund Amount
                            </p>
                            <p className="text-sm font-bold" style={{ color: "#16a34a" }}>
                              {claim.projectBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}

                        {/* Download PDF Report + Process Refund buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadPdf(claim)}
                            disabled={!!pdfLoading[claim.id]}
                            className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                            style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                            {pdfLoading[claim.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <><Download className="h-4 w-4" /> PDF Report</>
                            )}
                          </button>
                          <button
                            onClick={() => handleProcessRefund(claim.id)}
                            disabled={!!refundLoading[claim.id]}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
                            style={{ backgroundColor: "#22c55e" }}>
                            {refundLoading[claim.id] ? (
                              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            ) : (
                              <><RefreshCw className="h-4 w-4" /> Process Refund</>
                            )}
                          </button>
                        </div>
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
