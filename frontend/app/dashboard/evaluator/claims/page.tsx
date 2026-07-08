"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, MapPin, MessageSquare, ChevronDown, ChevronUp,
  AlertTriangle, Eye, Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import { evaluatorService, type EvaluatorClaimResponse, type MessageEvidenceItem } from "@/lib/evaluatorService";
import { aiService, type ImageVerificationResult } from "@/lib/aiService";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "REFUND_INITIATED" | "REFUNDED";

interface GeoValidationResult {
  imageCoords: { lat: number; lon: number } | null;
  projectCoords: { lat: number; lon: number } | null;
  distanceKm: number | null;
  projectAddress: string | null;
  valid: boolean | null;
  error: string | null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SSFRS-EvaluatorApp/1.0 (evaluation)" },
  });
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  }
  return null;
}

export default function EvaluatorClaimsPage() {
  const [claims, setClaims] = useState<EvaluatorClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [geoResults, setGeoResults] = useState<Record<string, GeoValidationResult>>({});
  const [geoLoading, setGeoLoading] = useState<Record<string, boolean>>({});
  const [aiResults, setAiResults] = useState<Record<string, ImageVerificationResult>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [msgExpanded, setMsgExpanded] = useState<Record<string, boolean>>({});

  const loadClaims = useCallback(async () => {
    try {
      const all = await evaluatorService.getAllClaims();
      setClaims(all);
    } catch {
      toast.error("Failed to load claims.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  const handleValidate = async (claim: EvaluatorClaimResponse) => {
    if (!claim.constructionLocation) {
      setGeoResults(prev => ({
        ...prev,
        [claim.id]: {
          imageCoords: null, projectCoords: null, distanceKm: null,
          projectAddress: null, valid: null,
          error: "No construction location recorded for this project.",
        },
      }));
      return;
    }

    if (!claim.extractedLat || !claim.extractedLon) return;

    setGeoLoading(prev => ({ ...prev, [claim.id]: true }));
    try {
      const projectCoords = await geocodeAddress(claim.constructionLocation);
      const imageCoords = { lat: claim.extractedLat, lon: claim.extractedLon };

      if (!projectCoords) {
        setGeoResults(prev => ({
          ...prev,
          [claim.id]: {
            imageCoords, projectCoords: null, distanceKm: null,
            projectAddress: claim.constructionLocation,
            valid: null, error: `Could not geocode address: "${claim.constructionLocation}". Try a more specific address.`,
          },
        }));
        return;
      }

      const distanceKm = haversineKm(imageCoords.lat, imageCoords.lon, projectCoords.lat, projectCoords.lon);
      const THRESHOLD_KM = 1.0;
      const valid = distanceKm <= THRESHOLD_KM;

      setGeoResults(prev => ({
        ...prev,
        [claim.id]: {
          imageCoords, projectCoords, distanceKm,
          projectAddress: claim.constructionLocation,
          valid, error: null,
        },
      }));
    } catch {
      setGeoResults(prev => ({
        ...prev,
        [claim.id]: {
          imageCoords: null, projectCoords: null, distanceKm: null,
          projectAddress: claim.constructionLocation,
          valid: null, error: "Geolocation validation failed. Check your internet connection.",
        },
      }));
    } finally {
      setGeoLoading(prev => ({ ...prev, [claim.id]: false }));
    }
  };

  const handleAiVerify = async (claim: EvaluatorClaimResponse) => {
    if (!claim.constructionLocation || claim.ghostProjectImageUrls.length === 0) return;
    setAiLoading(prev => ({ ...prev, [claim.id]: true }));
    try {
      const result = await aiService.verifyImageLocation(
        claim.id,
        claim.ghostProjectImageUrls,
        claim.constructionLocation
      );
      setAiResults(prev => ({ ...prev, [claim.id]: result }));
    } catch {
      toast.error("AI image analysis failed. Try again.");
    } finally {
      setAiLoading(prev => ({ ...prev, [claim.id]: false }));
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const updated = await evaluatorService.approveClaim(id);
      setClaims(prev => prev.map(c => c.id === id ? updated : c));
      toast.success("Claim approved. Worker notified.");
    } catch {
      toast.error("Failed to approve claim.");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const updated = await evaluatorService.rejectClaim(id);
      setClaims(prev => prev.map(c => c.id === id ? updated : c));
      toast.success("Claim rejected.");
    } catch {
      toast.error("Failed to reject claim.");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const filtered = claims.filter(c =>
    statusFilter === "ALL" ? true : c.status === statusFilter
  );

  // Keep filter buttons only for relevant statuses
  const filterOptions: StatusFilter[] = ["ALL", "PENDING", "APPROVED", "REJECTED", "REFUND_INITIATED", "REFUNDED"];

  const parseMessages = (json: string | null): MessageEvidenceItem[] => {
    if (!json) return [];
    try { return JSON.parse(json) as MessageEvidenceItem[]; } catch { return []; }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: "#f59e0b", text: "Pending" },
      APPROVED: { bg: "#22c55e", text: "Approved" },
      REJECTED: { bg: "#ef4444", text: "Rejected" },
      REFUND_INITIATED: { bg: "#6366f1", text: "Refund Initiated" },
      REFUNDED: { bg: "#0ea5e9", text: "Refunded" },
    };
    const style = map[s] ?? { bg: "#6b7280", text: s };
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
        style={{ backgroundColor: style.bg }}>
        {style.text}
      </span>
    );
  };

  const projectStatusBadge = (s: string | null) => {
    if (!s) return null;
    const map: Record<string, { bg: string; color: string; text: string }> = {
      OPEN:      { bg: "#22c55e20", color: "#22c55e", text: "Project: Open" },
      ASSIGNED:  { bg: "#3b82f620", color: "#3b82f6", text: "Project: Assigned" },
      COMPLETED: { bg: "#8b5cf620", color: "#8b5cf6", text: "Project: Completed" },
      FAILED:    { bg: "#ef444420", color: "#ef4444", text: "Project: Failed" },
    };
    const style = map[s] ?? { bg: "#6b728020", color: "#6b7280", text: `Project: ${s}` };
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: style.bg, color: style.color }}>
        {style.text}
      </span>
    );
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>Submitted Claims</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Review, validate, and decide on filed claims.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
          {filterOptions.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              style={{
                backgroundColor: statusFilter === s ? "var(--color-primary)" : "var(--color-neutral-100)",
                color: statusFilter === s ? "#fff" : "var(--color-foreground)",
              }}>
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border py-12 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            No claims found{statusFilter !== "ALL" ? ` with status "${statusFilter}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((claim) => {
            const isConstruction = !!claim.constructionLocation;
            const isExpanded = expandedId === claim.id;
            const messages = parseMessages(claim.messageEvidence);
            const geo = geoResults[claim.id];

            return (
              <motion.div key={claim.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>

                <button
                  className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:opacity-80 transition"
                  onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(claim.status)}
                      {projectStatusBadge(claim.projectStatus)}
                      {isConstruction && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-foreground)" }}>
                          Construction
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>
                      {claim.projectTitle ?? `Project ${claim.projectId.slice(0, 8)}…`}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      Filed {new Date(claim.createdAt).toLocaleDateString()} · Provider: {claim.providerId.slice(0, 8)}…
                    </p>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: "var(--color-muted-foreground)" }} />
                    : <ChevronDown className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: "var(--color-muted-foreground)" }} />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                        <div className="pt-4 space-y-1">
                          <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>Description</p>
                          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{claim.description}</p>
                        </div>

                        {claim.workerResponse && (
                          <div className="rounded-lg border p-3 space-y-1"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
                            <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>Worker Response</p>
                            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{claim.workerResponse}</p>
                          </div>
                        )}

                        {claim.proofDocumentUrls.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                              Proof Documents ({claim.proofDocumentUrls.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {claim.proofDocumentUrls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition hover:opacity-80"
                                  style={{ borderColor: "var(--color-border)", color: "var(--color-primary-600)" }}>
                                  <Eye className="h-3 w-3" /> Document {i + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {messages.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" style={{ color: "var(--color-primary-600)" }} />
                              <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                                Message Evidence ({messages.length} messages)
                              </p>
                              <button
                                onClick={() => setMsgExpanded(prev => ({ ...prev, [claim.id]: !prev[claim.id] }))}
                                className="text-xs"
                                style={{ color: "var(--color-primary-600)" }}>
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
                                  <div className="max-h-56 overflow-y-auto rounded-lg border p-3 space-y-3"
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

                        {isConstruction && claim.ghostProjectImageUrls.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" style={{ color: "#ef4444" }} />
                                <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                                  Ghost Project Images ({claim.ghostProjectImageUrls.length})
                                </p>
                              </div>
                              {claim.extractedLat && claim.extractedLon && (
                                <button
                                  onClick={() => handleValidate(claim)}
                                  disabled={geoLoading[claim.id]}
                                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition disabled:opacity-50"
                                  style={{ backgroundColor: "#ef4444" }}>
                                  {geoLoading[claim.id] ? (
                                    <>
                                      <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                      Validating…
                                    </>
                                  ) : "Validate Location"}
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              {claim.ghostProjectImageUrls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt=""
                                    className="w-full h-24 object-cover rounded-lg border"
                                    style={{ borderColor: "var(--color-border)" }} />
                                </a>
                              ))}
                            </div>

                            {/* No GPS — AI vision analysis (primary verification method) */}
                            {!claim.extractedLat && !claim.extractedLon && (
                              <div className="space-y-3">
                                <div className="rounded-xl border p-4"
                                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>
                                        AI Location Analysis
                                      </p>
                                      <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                                        AI analyses visual indicators (vegetation, architecture, terrain, signage) to confirm or reject the claimed region.
                                      </p>
                                      <p className="text-xs mt-1">
                                        Expected: <strong style={{ color: "var(--color-foreground)" }}>{claim.constructionLocation}</strong>
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => handleAiVerify(claim)}
                                      disabled={aiLoading[claim.id]}
                                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white flex-shrink-0 transition disabled:opacity-50"
                                      style={{ backgroundColor: "#7c3aed" }}>
                                      {aiLoading[claim.id] ? (
                                        <><span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> Analysing…</>
                                      ) : aiResults[claim.id] ? "Re-analyse" : "Analyse Images"}
                                    </button>
                                  </div>
                                </div>

                                {/* AI result */}
                                {aiResults[claim.id] && (() => {
                                  const ai = aiResults[claim.id];
                                  const isVerified = ai.location_status === "VERIFIED";
                                  const statusColor = isVerified ? "#22c55e" : "#ef4444";
                                  const statusBg = isVerified
                                    ? "color-mix(in srgb, #22c55e 8%, transparent)"
                                    : "color-mix(in srgb, #ef4444 8%, transparent)";
                                  return (
                                    <div className="rounded-xl border p-4 space-y-3"
                                      style={{ borderColor: statusColor, backgroundColor: statusBg }}>
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                          {isVerified
                                            ? <CheckCircle className="h-5 w-5" style={{ color: "#22c55e" }} />
                                            : <XCircle className="h-5 w-5" style={{ color: "#ef4444" }} />}
                                          <div>
                                            <p className="text-sm font-bold" style={{ color: statusColor }}>
                                              {isVerified ? "Images Consistent with Claimed Location" : "Location Mismatch — Images Do Not Match"}
                                            </p>
                                            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                                              {isVerified
                                                ? "Visual indicators are consistent with the claimed region."
                                                : "Visual indicators contradict the claimed location."}
                                            </p>
                                          </div>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                          style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-muted-foreground)" }}>
                                          Confidence: {ai.confidence}
                                        </span>
                                      </div>

                                      <div className="space-y-2 text-xs border-t pt-3"
                                        style={{ borderColor: statusColor + "40" }}>
                                        <div>
                                          <p className="font-semibold mb-0.5" style={{ color: "var(--color-foreground)" }}>What is visible</p>
                                          <p style={{ color: "var(--color-muted-foreground)" }}>{ai.what_is_visible}</p>
                                        </div>
                                        {ai.location_indicators && (
                                          <div>
                                            <p className="font-semibold mb-0.5" style={{ color: "var(--color-foreground)" }}>Location indicators found</p>
                                            <p style={{ color: "var(--color-muted-foreground)" }}>{ai.location_indicators}</p>
                                          </div>
                                        )}
                                        <div>
                                          <p className="font-semibold mb-0.5" style={{ color: "var(--color-foreground)" }}>Analysis</p>
                                          <p style={{ color: "var(--color-muted-foreground)" }}>{ai.analysis}</p>
                                        </div>
                                        <div>
                                          <p className="font-semibold mb-0.5" style={{ color: "var(--color-foreground)" }}>Reasoning</p>
                                          <p style={{ color: "var(--color-muted-foreground)" }}>{ai.reasoning}</p>
                                        </div>
                                      </div>

                                      <p className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
                                        AI verifies regional visual consistency — not exact street address. Use with other evidence.
                                      </p>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* GPS validation result (only shown after clicking Validate Location) */}
                            {geo && geo.error !== "NO_GPS" && (
                              <div className="rounded-xl border p-4 space-y-2"
                                style={{
                                  borderColor: geo.error ? "var(--color-border)" : geo.valid ? "#22c55e" : "#ef4444",
                                  backgroundColor: geo.error ? "var(--color-background)"
                                    : geo.valid
                                      ? "color-mix(in srgb, #22c55e 8%, transparent)"
                                      : "color-mix(in srgb, #ef4444 8%, transparent)",
                                }}>
                                {geo.error ? (
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                                    <p className="text-xs" style={{ color: "var(--color-foreground)" }}>{geo.error}</p>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      {geo.valid
                                        ? <CheckCircle className="h-4 w-4" style={{ color: "#22c55e" }} />
                                        : <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />}
                                      <p className="text-sm font-semibold"
                                        style={{ color: geo.valid ? "#16a34a" : "#dc2626" }}>
                                        {geo.valid ? "Location Validated" : "Location Mismatch"}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <p className="font-medium mb-0.5" style={{ color: "var(--color-foreground)" }}>Image GPS</p>
                                        <p style={{ color: "var(--color-muted-foreground)" }}>
                                          {geo.imageCoords?.lat.toFixed(6)}, {geo.imageCoords?.lon.toFixed(6)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="font-medium mb-0.5" style={{ color: "var(--color-foreground)" }}>Project Address</p>
                                        <p style={{ color: "var(--color-muted-foreground)" }}>
                                          {geo.projectCoords?.lat.toFixed(6)}, {geo.projectCoords?.lon.toFixed(6)}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                                      Distance:{" "}
                                      <strong style={{ color: "var(--color-foreground)" }}>
                                        {geo.distanceKm?.toFixed(3)} km
                                      </strong>
                                      {" "}(threshold: 1.0 km) · Site: <strong>{geo.projectAddress}</strong>
                                    </p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {claim.status === "PENDING" && (
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={() => handleApprove(claim.id)}
                              disabled={!!actionLoading[claim.id]}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white transition disabled:opacity-50"
                              style={{ backgroundColor: "#22c55e" }}>
                              {actionLoading[claim.id] ? (
                                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              ) : (
                                <><CheckCircle className="h-4 w-4" /> Approve Claim</>
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(claim.id)}
                              disabled={!!actionLoading[claim.id]}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white transition disabled:opacity-50"
                              style={{ backgroundColor: "#ef4444" }}>
                              {actionLoading[claim.id] ? (
                                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              ) : (
                                <><XCircle className="h-4 w-4" /> Reject Claim</>
                              )}
                            </button>
                          </div>
                        )}

                        {claim.status === "APPROVED" && (
                          <div className="flex items-center gap-2 pt-2 rounded-lg p-3"
                            style={{ backgroundColor: "color-mix(in srgb, #22c55e 10%, transparent)" }}>
                            <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#22c55e" }} />
                            <p className="text-sm font-medium" style={{ color: "#16a34a" }}>
                              Claim approved — refund process is being initiated automatically.
                            </p>
                          </div>
                        )}

                        {claim.status === "REFUND_INITIATED" && (
                          <div className="flex items-center gap-2 pt-2 rounded-lg p-3"
                            style={{ backgroundColor: "color-mix(in srgb, #6366f1 10%, transparent)" }}>
                            <RefreshCw className="h-4 w-4" style={{ color: "#6366f1" }} />
                            <p className="text-sm font-medium" style={{ color: "#6366f1" }}>
                              Refund process initiated — awaiting Refund Office action.
                            </p>
                          </div>
                        )}

                        {claim.status === "REFUNDED" && (
                          <div className="pt-2 space-y-2">
                            <div className="flex items-center gap-2 rounded-lg p-3"
                              style={{ backgroundColor: "color-mix(in srgb, #0ea5e9 10%, transparent)" }}>
                              <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#0ea5e9" }} />
                              <p className="text-sm font-medium" style={{ color: "#0ea5e9" }}>
                                Refund completed — provider was reimbursed.
                              </p>
                            </div>
                            {/* Show what happened to the project after the refund */}
                            {claim.projectStatus === "ASSIGNED" && (
                              <div className="flex items-start gap-2 rounded-lg p-3 border"
                                style={{ borderColor: "#3b82f640", backgroundColor: "#3b82f610" }}>
                                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#3b82f6" }} />
                                <p className="text-xs" style={{ color: "#3b82f6" }}>
                                  This project was reposted and a new worker has been assigned. A fresh claim may be filed if this worker also fails.
                                </p>
                              </div>
                            )}
                            {claim.projectStatus === "FAILED" && (
                              <div className="flex items-start gap-2 rounded-lg p-3 border"
                                style={{ borderColor: "#ef444440", backgroundColor: "#ef444410" }}>
                                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                                <p className="text-xs" style={{ color: "#ef4444" }}>
                                  This project was reposted and has failed again. Check the Pending filter for the new active claim.
                                </p>
                              </div>
                            )}
                            {claim.projectStatus === "OPEN" && (
                              <div className="flex items-start gap-2 rounded-lg p-3 border"
                                style={{ borderColor: "#22c55e40", backgroundColor: "#22c55e10" }}>
                                <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                                <p className="text-xs" style={{ color: "#22c55e" }}>
                                  Project is reposted and open. Provider has re-locked funds — awaiting admin assignment.
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {claim.status === "REJECTED" && (
                          <div className="flex items-center gap-2 pt-2">
                            <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />
                            <p className="text-sm font-medium" style={{ color: "#dc2626" }}>
                              This claim has been rejected.
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
