"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw, CheckCircle, XCircle, Clock, Activity,
  AlertTriangle, DollarSign, Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import { evaluatorService, type EvaluatorClaimResponse } from "@/lib/evaluatorService";

type Status = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "REFUND_INITIATED" | "REFUNDED";

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:          { label: "Pending",          color: "#f59e0b", bg: "#f59e0b20", icon: <Clock className="h-3.5 w-3.5" /> },
  APPROVED:         { label: "Approved",          color: "#22c55e", bg: "#22c55e20", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  REJECTED:         { label: "Rejected",          color: "#ef4444", bg: "#ef444420", icon: <XCircle className="h-3.5 w-3.5" /> },
  REFUND_INITIATED: { label: "Refund Initiated",  color: "#6366f1", bg: "#6366f120", icon: <RefreshCw className="h-3.5 w-3.5" /> },
  REFUNDED:         { label: "Refunded",          color: "#0ea5e9", bg: "#0ea5e920", icon: <DollarSign className="h-3.5 w-3.5" /> },
};

const FILTERS: Status[] = ["ALL", "PENDING", "APPROVED", "REJECTED", "REFUND_INITIATED", "REFUNDED"];

export default function EvaluatorClaimMonitorPage() {
  const [claims, setClaims]     = useState<EvaluatorClaimResponse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<Status>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setClaims(await evaluatorService.getAllClaims());
    } catch {
      toast.error("Failed to load claims.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = {
    ALL:              claims.length,
    PENDING:          claims.filter(c => c.status === "PENDING").length,
    APPROVED:         claims.filter(c => c.status === "APPROVED").length,
    REJECTED:         claims.filter(c => c.status === "REJECTED").length,
    REFUND_INITIATED: claims.filter(c => c.status === "REFUND_INITIATED").length,
    REFUNDED:         claims.filter(c => c.status === "REFUNDED").length,
  };

  const visible = filter === "ALL" ? claims : claims.filter(c => c.status === filter);

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
          <h3 style={{ color: "var(--color-primary-800)" }}>Claim Monitor</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Live overview of all submitted claims and their current statuses.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm border transition hover:opacity-80"
          style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {(["PENDING", "APPROVED", "REJECTED", "REFUND_INITIATED", "REFUNDED"] as Status[]).map(s => {
          const meta = STATUS_META[s];
          return (
            <div key={s} className="rounded-xl border p-3 space-y-1"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-1.5">
                <span style={{ color: meta.color }}>{meta.icon}</span>
                <p className="text-xs font-medium truncate" style={{ color: "var(--color-muted-foreground)" }}>{meta.label}</p>
              </div>
              <p className="text-xl font-bold" style={{ color: meta.color }}>{counts[s]}</p>
            </div>
          );
        })}
        <div className="rounded-xl border p-3 space-y-1"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
            <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Total</p>
          </div>
          <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>{counts.ALL}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{
              backgroundColor: filter === f ? "var(--color-primary)" : "var(--color-neutral-100)",
              color: filter === f ? "#fff" : "var(--color-foreground)",
            }}>
            {f === "ALL" ? `All (${counts.ALL})` : `${STATUS_META[f].label} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Claims table */}
      {visible.length === 0 ? (
        <div className="rounded-xl border py-16 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <AlertTriangle className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--color-muted-foreground)" }} />
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>No claims match this filter.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-neutral-50)" }}>
                  {["Project", "Provider", "Worker", "Status", "Filed On"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--color-muted-foreground)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((claim, i) => {
                  const meta = STATUS_META[claim.status] ?? { label: claim.status, color: "#6b7280", bg: "#6b728020", icon: null };
                  return (
                    <motion.tr key={claim.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[180px]" style={{ color: "var(--color-foreground)" }}>
                          {claim.projectTitle ?? `Project ${claim.projectId.slice(0, 8)}…`}
                        </p>
                        {claim.projectBudget != null && (
                          <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                            ${Number(claim.projectBudget).toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono" style={{ color: "var(--color-muted-foreground)" }}>
                          {claim.providerId.slice(0, 12)}…
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono" style={{ color: "var(--color-muted-foreground)" }}>
                          {claim.workerId.slice(0, 12)}…
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: meta.bg, color: meta.color }}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
