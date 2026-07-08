"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, MessageSquare, MapPin, FileText, Upload, X, CheckCircle, Clock } from "lucide-react";
import { toast } from "react-toastify";
import { claimService, ClaimResponse } from "@/lib/claimService";
import { justificationService, JustificationResponse } from "@/lib/justificationService";

const statusColor: Record<string, string> = {
  PENDING: "#f59e0b",
  UNDER_REVIEW: "#3b82f6",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
  REFUND_INITIATED: "#6366f1",
  REFUNDED: "#0ea5e9",
};

export default function WorkerClaimsPage() {
  const [claims, setClaims]               = useState<ClaimResponse[]>([]);
  const [loading, setLoading]             = useState(true);
  const [justifications, setJustifications] = useState<Record<string, JustificationResponse | null>>({});

  // justify form state
  const [justifyingId, setJustifyingId]   = useState<string | null>(null);
  const [justifyText, setJustifyText]     = useState("");
  const [justifyFiles, setJustifyFiles]   = useState<File[]>([]);
  const [submittingJustify, setSubmittingJustify] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // respond form state (for REFUNDED claims)
  const [respondingTo, setRespondingTo]   = useState<string | null>(null);
  const [responseText, setResponseText]   = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    claimService.getClaimsAgainstMe()
      .then(async (data) => {
        setClaims(data);
        // load justifications for each claim
        const map: Record<string, JustificationResponse | null> = {};
        await Promise.all(data.map(async (c) => {
          map[c.id] = await justificationService.getJustification(c.id);
        }));
        setJustifications(map);
      })
      .catch(() => toast.error("Failed to load claims."))
      .finally(() => setLoading(false));
  }, []);

  const submitJustification = async (claimId: string) => {
    if (!justifyText.trim() || justifyText.length < 10) {
      toast.error("Please provide at least 10 characters in your justification.");
      return;
    }
    setSubmittingJustify(true);
    try {
      const result = await justificationService.submitJustification(claimId, justifyText, justifyFiles);
      setJustifications(prev => ({ ...prev, [claimId]: result }));
      setJustifyingId(null);
      setJustifyText("");
      setJustifyFiles([]);
      toast.success("Justification submitted successfully.");
    } catch {
      toast.error("Failed to submit justification.");
    } finally {
      setSubmittingJustify(false);
    }
  };

  const submitResponse = async (claimId: string) => {
    if (!responseText.trim() || responseText.length < 10) {
      toast.error("Please provide at least 10 characters.");
      return;
    }
    setSubmittingResponse(true);
    try {
      const updated = await claimService.respondToClaim(claimId, responseText);
      setClaims(prev => prev.map(c => c.id === claimId ? updated : c));
      setRespondingTo(null);
      setResponseText("");
      toast.success("Response submitted.");
    } catch {
      toast.error("Failed to submit response.");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setJustifyFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Claims Against Me</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Review claims filed against you, submit your justification, or respond after refund.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-primary)" }} />
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <AlertCircle className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>No claims against you</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((c, i) => {
            const j = justifications[c.id];
            const isJustifying = justifyingId === c.id;
            const isResponding = respondingTo === c.id;

            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border p-5 space-y-4"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                      Claim #{c.id.slice(0, 8)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                      Filed {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: (statusColor[c.status] || "#6b7280") + "20",
                      color: statusColor[c.status] || "#6b7280",
                    }}>
                    {c.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--color-muted-foreground)" }}>
                    CLAIM DESCRIPTION
                  </p>
                  <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{c.description}</p>
                </div>

                {/* GPS info */}
                {(c.extractedLat || c.extractedLon) && (
                  <div className="flex items-center gap-2 rounded-lg p-2"
                    style={{ backgroundColor: "var(--color-neutral-50)" }}>
                    <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: "#3b82f6" }} />
                    <span className="text-xs" style={{ color: "var(--color-foreground)" }}>
                      GPS verified photo: {c.extractedLat?.toFixed(4)}, {c.extractedLon?.toFixed(4)}
                      {c.extractedPhotoTimestamp && ` · ${c.extractedPhotoTimestamp}`}
                    </span>
                  </div>
                )}

                {/* ── JUSTIFY section (PENDING status) ── */}
                {c.status === "PENDING" && (
                  <div className="space-y-3">
                    {j ? (
                      // Justification already submitted
                      <div className="rounded-xl border p-4 space-y-2"
                        style={{
                          borderColor: j.status === "VALIDATED" ? "#22c55e"
                                     : j.status === "REJECTED"  ? "#ef4444"
                                     : "var(--color-border)",
                          backgroundColor: j.status === "VALIDATED" ? "#f0fdf4"
                                         : j.status === "REJECTED"  ? "#fef2f2"
                                         : "var(--color-neutral-50)",
                        }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {j.status === "VALIDATED" && <CheckCircle className="h-4 w-4" style={{ color: "#22c55e" }} />}
                            {j.status === "REJECTED"  && <X className="h-4 w-4" style={{ color: "#ef4444" }} />}
                            {j.status === "SUBMITTED" && <Clock className="h-4 w-4" style={{ color: "#f59e0b" }} />}
                            <p className="text-xs font-semibold"
                              style={{
                                color: j.status === "VALIDATED" ? "#16a34a"
                                     : j.status === "REJECTED"  ? "#dc2626"
                                     : "#92400e",
                              }}>
                              Justification {j.status === "VALIDATED" ? "Validated" : j.status === "REJECTED" ? "Rejected" : "Under Review"}
                            </p>
                          </div>
                          <button
                            onClick={() => { setJustifyingId(c.id); setJustifyText(j.description); setJustifyFiles([]); }}
                            className="text-xs underline"
                            style={{ color: "var(--color-muted-foreground)" }}>
                            Update
                          </button>
                        </div>
                        <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{j.description}</p>
                        {j.evaluatorNotes && (
                          <div className="text-xs rounded p-2"
                            style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-foreground)" }}>
                            <span className="font-medium">Evaluator note: </span>{j.evaluatorNotes}
                          </div>
                        )}
                        {j.evidenceUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {j.evidenceUrls.map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs rounded-lg border px-2 py-1 transition hover:opacity-70"
                                style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}>
                                <FileText className="h-3 w-3" /> Evidence {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : isJustifying ? (
                      // Justify form
                      <div className="rounded-xl border p-4 space-y-3"
                        style={{ borderColor: "#f59e0b", backgroundColor: "#fffbeb" }}>
                        <p className="text-xs font-semibold" style={{ color: "#92400e" }}>
                          Submit Your Justification
                        </p>
                        <textarea
                          value={justifyText}
                          onChange={(e) => setJustifyText(e.target.value)}
                          rows={5}
                          placeholder="Explain what happened, why the service was not delivered as expected, any mitigating circumstances, or why you believe the claim is unjust..."
                          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
                          style={{
                            borderColor: "var(--color-border)",
                            backgroundColor: "var(--color-background)",
                            color: "var(--color-foreground)",
                          }}
                        />

                        {/* File upload */}
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx"
                            className="hidden"
                            onChange={handleFiles}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-2 text-sm transition hover:opacity-70"
                            style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>
                            <Upload className="h-4 w-4" />
                            Upload supporting files (photos, documents)
                          </button>
                          {justifyFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {justifyFiles.map((f, idx) => (
                                <div key={idx} className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                  style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                                  <FileText className="h-3 w-3" />
                                  {f.name.length > 20 ? f.name.slice(0, 20) + "…" : f.name}
                                  <button type="button"
                                    onClick={() => setJustifyFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="ml-1">
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => submitJustification(c.id)}
                            disabled={submittingJustify}
                            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
                            style={{ backgroundColor: "#f59e0b" }}>
                            {submittingJustify
                              ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              : <FileText className="h-4 w-4" />}
                            {submittingJustify ? "Submitting…" : "Submit Justification"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setJustifyingId(null); setJustifyText(""); setJustifyFiles([]); }}
                            className="rounded-lg px-4 py-2 text-sm border transition"
                            style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Justify button
                      <button
                        onClick={() => setJustifyingId(c.id)}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                        style={{ backgroundColor: "#f59e0b" }}>
                        <FileText className="h-4 w-4" />
                        Justify
                      </button>
                    )}
                  </div>
                )}

                {/* ── RESPOND section (REFUNDED status only) ── */}
                {c.status === "REFUNDED" && (
                  <div className="space-y-3">
                    {c.workerResponse ? (
                      <div className="rounded-lg p-3" style={{ backgroundColor: "var(--color-neutral-50)" }}>
                        <p className="text-xs font-medium mb-1" style={{ color: "var(--color-muted-foreground)" }}>
                          YOUR RESPONSE
                        </p>
                        <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{c.workerResponse}</p>
                      </div>
                    ) : isResponding ? (
                      <div className="space-y-3">
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={4}
                          placeholder="Acknowledge the failure, provide your explanation..."
                          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
                          style={{
                            borderColor: "var(--color-border)",
                            backgroundColor: "var(--color-background)",
                            color: "var(--color-foreground)",
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitResponse(c.id)}
                            disabled={submittingResponse}
                            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                            style={{ backgroundColor: "var(--color-primary)" }}>
                            <MessageSquare className="h-4 w-4" />
                            {submittingResponse ? "Submitting…" : "Submit Response"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRespondingTo(null); setResponseText(""); }}
                            className="rounded-lg px-4 py-2 text-sm border transition"
                            style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRespondingTo(c.id)}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border transition"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                        <MessageSquare className="h-4 w-4" />
                        Respond to Claim
                      </button>
                    )}
                  </div>
                )}

                {/* Non-actionable statuses */}
                {!["PENDING", "REFUNDED"].includes(c.status) && (
                  <div className="rounded-lg p-3 text-xs"
                    style={{ backgroundColor: "var(--color-neutral-50)", color: "var(--color-muted-foreground)" }}>
                    Status: <strong style={{ color: statusColor[c.status] || "#6b7280" }}>
                      {c.status.replace(/_/g, " ")}
                    </strong>
                    {c.status === "APPROVED" && " — This claim has been approved. A refund is being processed."}
                    {c.status === "REJECTED" && " — This claim was rejected by the evaluator."}
                    {c.status === "UNDER_REVIEW" && " — This claim is currently under review by an evaluator."}
                    {c.status === "REFUND_INITIATED" && " — Refund is being processed by the refund office."}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
