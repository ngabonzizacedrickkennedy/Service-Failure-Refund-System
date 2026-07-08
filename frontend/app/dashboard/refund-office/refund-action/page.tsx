"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, Clock, Lock, RefreshCw, DollarSign,
  ArrowRight, Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { refundService, type RefundClaimResponse } from "@/lib/refundService";
import executionApi from "@/lib/executionApi";
import type { ProjectResponse } from "@/lib/projectService";

export default function RefundActionPage() {
  const [refunded, setRefunded] = useState<RefundClaimResponse[]>([]);
  const [projects, setProjects] = useState<Record<string, ProjectResponse>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const claims = await refundService.getRefundedClaims();
      setRefunded(claims);

      // fetch project details for each unique projectId
      const uniqueIds = [...new Set(claims.map(c => c.projectId))];
      const entries = await Promise.all(
        uniqueIds.map(id =>
          executionApi.get<ProjectResponse>(`/api/projects/${id}`, { cache: false })
            .then(r => [id, r.data] as [string, ProjectResponse])
            .catch(() => null)
        )
      );
      const map: Record<string, ProjectResponse> = {};
      entries.forEach(e => { if (e) map[e[0]] = e[1]; });
      setProjects(map);
    } catch {
      toast.error("Failed to load refund history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalRefunded = refunded.reduce((s, c) => s + (c.projectBudget ?? 0), 0);
  const reLocked = refunded.filter(c => {
    const p = projects[c.projectId];
    return p?.status === "ASSIGNED" || (p?.status === "OPEN" && p?.funded);
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>Refund Action</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Monitor processed refunds and track whether providers have re-locked funds.
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
            <CheckCircle className="h-4 w-4" style={{ color: "#22c55e" }} />
            <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
              Total Processed
            </p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {refunded.length}
          </p>
        </div>

        <div className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-4 w-4" style={{ color: "#6366f1" }} />
            <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
              Total Returned
            </p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            ${totalRefunded.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Lock className="h-4 w-4" style={{ color: "#f59e0b" }} />
            <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
              Re-Locked
            </p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {reLocked}
          </p>
        </div>
      </div>

      {/* Claims list */}
      {refunded.length === 0 ? (
        <div className="rounded-xl border py-16 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <CheckCircle className="h-8 w-8 mx-auto mb-3" style={{ color: "#22c55e" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            No refunds processed yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {refunded.map((claim, i) => {
            const project = projects[claim.projectId];
            const amount = claim.projectBudget ?? 0;

            const isProviderReLocked =
              (project?.status === "OPEN" && project?.funded) ||
              project?.status === "ASSIGNED";
            const isAssigned = project?.status === "ASSIGNED";
            const isFundedOpen = project?.status === "OPEN" && project?.funded;
            const isAwaitingReLock = project?.status === "OPEN" && !project?.funded;
            const isFailed = project?.status === "FAILED";

            return (
              <motion.div key={claim.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>

                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-5 py-4"
                  style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate"
                      style={{ color: "var(--color-foreground)" }}>
                      {project?.title ?? `Project ${claim.projectId.slice(0, 8)}…`}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                      Refunded {new Date(claim.updatedAt).toLocaleDateString()} · Provider {claim.providerId.slice(0, 8)}…
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: "#22c55e" }}>
                      ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>returned</p>
                  </div>
                </div>

                {/* Status track */}
                <div className="px-5 py-4 space-y-2">

                  {/* Step 1 — Refund processed */}
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#22c55e" }} />
                    <div className="flex-1">
                      <p className="text-xs font-medium" style={{ color: "#22c55e" }}>
                        Refund processed — amount returned to provider
                      </p>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="ml-[7px] h-4 w-px" style={{ backgroundColor: "var(--color-border)" }} />

                  {/* Step 2 — Re-lock monitor */}
                  <div className="flex items-center gap-2.5">
                    {isProviderReLocked ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#22c55e" }} />
                    ) : (
                      <Clock className="h-4 w-4 flex-shrink-0" style={{ color: "#f59e0b" }} />
                    )}
                    <p className="text-xs font-medium"
                      style={{ color: isProviderReLocked ? "#22c55e" : "#f59e0b" }}>
                      {isAwaitingReLock && "Waiting for provider to re-lock funds into reposted project"}
                      {isFundedOpen && "Provider re-locked funds — awaiting admin to assign a worker"}
                      {isAssigned && "Funds re-locked and locked in new assignment"}
                      {isFailed && "Project failed again — new claim may be pending"}
                      {!project && "Project status unavailable"}
                    </p>
                  </div>

                  {/* Connector */}
                  {isAssigned && (
                    <>
                      <div className="ml-[7px] h-4 w-px" style={{ backgroundColor: "var(--color-border)" }} />
                      {/* Step 3 — Locked in project */}
                      <div className="flex items-center gap-2.5">
                        <Lock className="h-4 w-4 flex-shrink-0" style={{ color: "#f59e0b" }} />
                        <p className="text-xs font-medium" style={{ color: "#f59e0b" }}>
                          ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} moved from Total Deposited → Locked in Projects
                        </p>
                      </div>
                    </>
                  )}

                  {/* Project status badge */}
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: isAssigned ? "#3b82f620" : isFundedOpen ? "#f59e0b20" : isAwaitingReLock ? "#6366f120" : "#ef444420",
                        color: isAssigned ? "#3b82f6" : isFundedOpen ? "#f59e0b" : isAwaitingReLock ? "#6366f1" : "#ef4444",
                      }}>
                      Project: {project?.status ?? "Unknown"}
                    </span>
                    {isAssigned && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: "#22c55e20", color: "#22c55e" }}>
                        Re-funded
                      </span>
                    )}
                    {isFailed && (
                      <span className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--color-muted-foreground)" }}>
                        <ArrowRight className="h-3 w-3" />
                        Check Refund Claims for new requests
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
