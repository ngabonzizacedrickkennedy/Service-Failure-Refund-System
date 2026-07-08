"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import auditApi from "@/lib/auditApi";
import api from "@/lib/api";

interface AuditLog {
  id: string;
  actorId: string;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  service: string;
  resourceType: string | null;
  resourceId: string | null;
  outcome: string;
  details: string | null;
  timestamp: string;
}

interface PageData {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface UserInfo {
  fullName: string;
  role: string;
}

const ACTION_LABELS: Record<string, string> = {
  USER_REGISTERED: "User Registered",
  USER_DELETED: "User Deleted",
  USER_STATUS_CHANGED: "User Status Changed",
  WORKER_PROFILE_UPDATED: "Worker Profile Updated",
  PROVIDER_PROFILE_UPDATED: "Provider Profile Updated",
  ADMIN_MESSAGE_SENT: "Admin Message Sent",
  PROJECT_POSTED: "Project Posted",
  WORKER_CV_SUBMITTED: "Worker CV Submitted",
  WORKER_ASSIGNED_TO_PROJECT: "Worker Assigned to Project",
  CV_APPROVAL_DECISION: "CV Approval Decision",
  PROJECT_MARKED_FAILED: "Project Marked Failed",
  PROJECT_MARKED_COMPLETED: "Project Marked Completed",
  CLAIM_FILED: "Claim Filed",
  WORKER_CLAIM_RESPONSE_SUBMITTED: "Worker Claim Response",
  GEOLOCATION_VERIFIED: "Geolocation Verified",
  GEOLOCATION_FLAGGED: "Geolocation Flagged",
  EVALUATOR_DECISION_APPROVED: "Evaluator Decision — Approved",
  EVALUATOR_DECISION_REJECTED: "Evaluator Decision — Rejected",
  REFUND_INITIATED: "Refund Initiated",
  REFUND_COMPLETED: "Refund Completed",
  AI_CONFIG_CHANGED: "AI Config Changed",
};

const SERVICE_COLORS: Record<string, { bg: string; text: string }> = {
  "User Management": { bg: "#EDE9FE", text: "#5B21B6" },
  "Execution":       { bg: "#DBEAFE", text: "#1E40AF" },
  "AI Engine":       { bg: "#D1FAE5", text: "#065F46" },
  "Evaluation":      { bg: "#FEF3C7", text: "#92400E" },
  "Refund":          { bg: "#FFE4E6", text: "#9F1239" },
  "Audit Service":   { bg: "#F3F4F6", text: "#374151" },
};

function ServiceBadge({ service }: { service: string }) {
  const colors = SERVICE_COLORS[service] || { bg: "#F3F4F6", text: "#374151" };
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {service}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const ok = outcome === "SUCCESS";
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: ok ? "#D1FAE5" : "#FFE4E6",
        color: ok ? "#065F46" : "#9F1239",
      }}
    >
      {ok ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {ok ? "Success" : "Failure"}
    </span>
  );
}

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: "var(--color-neutral-100)",
        color: "var(--color-neutral-600)",
      }}
    >
      {role}
    </span>
  );
}

const SYSTEM_IDS = new Set(["SYSTEM", "ADMIN"]);

function resolveName(id: string | null | undefined, userMap: Record<string, UserInfo>): string {
  if (!id) return "—";
  if (SYSTEM_IDS.has(id)) return id;
  return userMap[id]?.fullName || id;
}

/** Keys whose values are still raw UUIDs and need name resolution. */
const USER_ID_KEYS = new Set(["deletedUserId"]);

function parseDetails(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function DetailPanel({ log, userMap }: { log: AuditLog; userMap: Record<string, UserInfo> }) {
  const details = parseDetails(log.details);
  const isGeo   = log.action === "GEOLOCATION_VERIFIED" || log.action === "GEOLOCATION_FLAGGED";
  const isEval  = log.action.startsWith("EVALUATOR_DECISION");
  const isAiCfg = log.action === "AI_CONFIG_CHANGED";

  return (
    <div className="px-4 pb-4 pt-2 space-y-3">
      <div
        className="rounded-lg border p-4 text-sm space-y-2"
        style={{
          backgroundColor: "var(--color-neutral-50)",
          borderColor: "var(--color-border)",
        }}
      >
        <p className="font-semibold text-xs uppercase tracking-wide mb-3"
           style={{ color: "var(--color-muted-foreground)" }}>
          {isGeo ? "Geolocation Audit Record" : isEval ? "Evaluator Decision Trail" : isAiCfg ? "AI Config Change" : "Event Details"}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Log ID" value={log.id} mono />
          <Field label="Actor" value={resolveName(log.actorId, userMap)} />
          <Field label="Actor ID" value={log.actorId} mono />
          <Field label="Actor Role" value={log.actorRole || "—"} />
          <Field label="Action" value={ACTION_LABELS[log.action] || log.action} />
          <Field label="Service" value={log.service} />
          <Field label="Resource Type" value={log.resourceType || "—"} />
          <Field
            label={log.resourceType === "USER" ? "Resource (User)" : "Resource ID"}
            value={
              log.resourceType === "USER"
                ? resolveName(log.resourceId, userMap)
                : log.resourceId || "—"
            }
            mono={log.resourceType !== "USER"}
          />
          <Field label="Outcome" value={log.outcome} />
          <Field label="Timestamp" value={formatTs(log.timestamp)} />
        </div>

        {Object.keys(details).length > 0 && (
          <>
            <hr style={{ borderColor: "var(--color-border)" }} />
            <p className="font-semibold text-xs uppercase tracking-wide"
               style={{ color: "var(--color-muted-foreground)" }}>
              {isGeo ? "Geolocation Data" : isEval ? "Decision Data" : isAiCfg ? "Config Change Data" : "Additional Data"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(details).map(([k, v]) => {
                const isUserId = USER_ID_KEYS.has(k);
                const displayValue = isUserId ? resolveName(v, userMap) : (v || "—");
                return (
                  <Field
                    key={k}
                    label={humanize(k)}
                    value={displayValue}
                    mono={!isUserId && (k === "claimId" || k.endsWith("Id"))}
                  />
                );
              })}
            </div>
          </>
        )}

        {isGeo && (
          <p className="text-xs mt-2" style={{ color: "var(--color-muted-foreground)" }}>
            This record is read-only and cannot be modified — it serves as tamper-proof evidence that
            geolocation data was not altered after submission.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: "var(--color-muted-foreground)" }}>{label}</p>
      <p
        className={`text-xs break-all ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--color-foreground)" }}
      >
        {value}
      </p>
    </div>
  );
}

function formatTs(ts: string): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export default function AuditLogPage() {
  const [logs, setLogs]           = useState<AuditLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]           = useState(0);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [userMap, setUserMap] = useState<Record<string, UserInfo>>({});

  // filters
  const [actorId,    setActorId]    = useState("");
  const [action,     setAction]     = useState("");
  const [service,    setService]    = useState("");
  const [fromDate,   setFromDate]   = useState("");
  const [toDate,     setToDate]     = useState("");
  const [actions,    setActions]    = useState<string[]>([]);
  const [services,   setServices]   = useState<string[]>([]);

  const PAGE_SIZE = 50;

  const buildParams = useCallback(() => {
    const p: Record<string, string> = { page: String(page), size: String(PAGE_SIZE) };
    if (actorId.trim())  p.actorId    = actorId.trim();
    if (action)          p.action     = action;
    if (service)         p.serviceName = service;
    if (fromDate)        p.fromDate   = fromDate;
    if (toDate)          p.toDate     = toDate;
    return p;
  }, [page, actorId, action, service, fromDate, toDate]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditApi.get<PageData>("/api/audit/logs", { params: buildParams() });
      setLogs(res.data.content);
      setTotal(res.data.totalElements);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    auditApi.get<string[]>("/api/audit/actions").then((r) => setActions(r.data)).catch(() => {});
    auditApi.get<string[]>("/api/audit/services").then((r) => setServices(r.data)).catch(() => {});
    api.get<{ id: string; fullName: string; role: string }[]>("/api/admin/users")
      .then((r) => {
        const m: Record<string, UserInfo> = {};
        r.data.forEach((u) => { m[u.id] = { fullName: u.fullName, role: u.role }; });
        setUserMap(m);
      })
      .catch(() => {});
  }, []);

  function resetFilters() {
    setActorId("");
    setAction("");
    setService("");
    setFromDate("");
    setToDate("");
    setPage(0);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (actorId.trim())  params.actorId     = actorId.trim();
      if (action)          params.action       = action;
      if (service)         params.serviceName  = service;
      if (fromDate)        params.fromDate     = fromDate;
      if (toDate)          params.toDate       = toDate;

      const res = await auditApi.get("/api/audit/logs/export", {
        params,
        responseType: "blob",
      });

      const url  = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href  = url;
      link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = actorId || action || service || fromDate || toDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--color-neutral-100)" }}
          >
            <ShieldCheck className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <h3 style={{ color: "var(--color-primary-800)" }}>Audit Log</h3>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              Tamper-proof record of every action across the system. Read-only.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-foreground)",
              backgroundColor: "transparent",
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl border p-4 space-y-4"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Filter className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            Filters
          </span>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto text-xs underline"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Actor dropdown */}
          <select
            value={actorId}
            onChange={(e) => { setActorId(e.target.value); setPage(0); }}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-background)",
              color: "var(--color-foreground)",
            }}
          >
            <option value="">All Users</option>
            {Object.entries(userMap)
              .sort((a, b) => a[1].fullName.localeCompare(b[1].fullName))
              .map(([id, u]) => (
                <option key={id} value={id}>
                  {u.fullName} ({u.role})
                </option>
              ))}
          </select>

          {/* Action dropdown */}
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(0); }}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-background)",
              color: "var(--color-foreground)",
            }}
          >
            <option value="">All Action Types</option>
            {actions.map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
            ))}
          </select>

          {/* Service dropdown */}
          <select
            value={service}
            onChange={(e) => { setService(e.target.value); setPage(0); }}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-background)",
              color: "var(--color-foreground)",
            }}
          >
            <option value="">All Services</option>
            {services.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
              className="flex-1 rounded-lg border px-2 py-2 text-xs focus:outline-none focus:ring-2 transition"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-foreground)",
              }}
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(0); }}
              className="flex-1 rounded-lg border px-2 py-2 text-xs focus:outline-none focus:ring-2 transition"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-foreground)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            {total.toLocaleString()} {total === 1 ? "entry" : "entries"}
          </span>
          <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            Most recent first · Click any row to expand
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "var(--color-neutral-50)" }}>
              <tr>
                {["Actor", "Action", "Service", "Resource", "Outcome", "Timestamp", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--color-neutral-500)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span
                        className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: "var(--color-primary)" }}
                      />
                      <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                        Loading audit log…
                      </span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                      No audit entries match the current filters.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <React.Fragment key={log.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.4) }}
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      className="border-t cursor-pointer transition-colors"
                      style={{
                        borderColor: "var(--color-border)",
                        backgroundColor: expanded === log.id ? "var(--color-neutral-50)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (expanded !== log.id) {
                          e.currentTarget.style.backgroundColor = "var(--color-neutral-50)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (expanded !== log.id) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {/* Actor */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className="text-xs font-medium truncate max-w-[160px]"
                            style={{ color: "var(--color-foreground)" }}
                            title={log.actorId}
                          >
                            {resolveName(log.actorId, userMap)}
                          </span>
                          <RoleBadge role={log.actorRole} />
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-medium"
                          style={{ color: "var(--color-foreground)" }}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>

                      {/* Service */}
                      <td className="px-4 py-3">
                        <ServiceBadge service={log.service} />
                      </td>

                      {/* Resource */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {log.resourceType && (
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--color-muted-foreground)" }}
                            >
                              {log.resourceType}
                            </span>
                          )}
                          {log.resourceId && (
                            <span
                              className="text-xs truncate max-w-[140px]"
                              style={{ color: "var(--color-foreground)" }}
                              title={log.resourceId}
                            >
                              {log.resourceType === "USER"
                                ? resolveName(log.resourceId, userMap)
                                : log.resourceId.length > 12
                                  ? log.resourceId.slice(0, 8) + "…"
                                  : log.resourceId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Outcome */}
                      <td className="px-4 py-3">
                        <OutcomeBadge outcome={log.outcome} />
                      </td>

                      {/* Timestamp */}
                      <td
                        className="px-4 py-3 text-xs whitespace-nowrap"
                        style={{ color: "var(--color-muted-foreground)" }}
                      >
                        {formatTs(log.timestamp)}
                      </td>

                      {/* Expand toggle */}
                      <td className="px-4 py-3">
                        {expanded === log.id ? (
                          <ChevronUp className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
                        ) : (
                          <ChevronDown className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
                        )}
                      </td>
                    </motion.tr>

                    {/* Expanded detail row */}
                    <AnimatePresence>
                      {expanded === log.id && (
                        <motion.tr
                          key={`${log.id}-detail`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td
                            colSpan={7}
                            style={{ backgroundColor: "var(--color-neutral-50)" }}
                          >
                            <DetailPanel log={log} userMap={userMap} />
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 w-8 flex items-center justify-center rounded-lg border transition disabled:opacity-40"
                style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 w-8 flex items-center justify-center rounded-lg border transition disabled:opacity-40"
                style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
