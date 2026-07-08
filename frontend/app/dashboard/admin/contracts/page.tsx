"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileSignature, CheckCircle, Clock, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { contractService, type ContractResponse } from "@/lib/contractService";

export default function AdminContractValidationPage() {
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const all = await contractService.getAllContracts();
      setContracts(all);
    } catch {
      toast.error("Failed to load contracts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const validate = async (id: string) => {
    setValidating(id);
    try {
      const updated = await contractService.validate(id);
      setContracts((prev) => prev.map((c) => c.id === id ? updated : c));
      toast.success("Contract validated successfully!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to validate.";
      toast.error(msg);
    } finally {
      setValidating(null);
    }
  };

  const pending = contracts.filter((c) => c.workerSigned && c.providerSigned && !c.adminValidated);
  const validated = contracts.filter((c) => c.adminValidated);
  const incomplete = contracts.filter((c) => !c.workerSigned || !c.providerSigned);

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>Contract Validation</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Validate contracts that have been signed by both worker and project provider.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm border transition"
          style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending Validation", count: pending.length, color: "#f59e0b" },
          { label: "Validated", count: validated.length, color: "#22c55e" },
          { label: "Incomplete", count: incomplete.length, color: "var(--color-muted-foreground)" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4 text-center"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      ) : (
        <>
          {/* Pending validation */}
          {pending.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "var(--color-muted-foreground)" }}>
                Awaiting Validation ({pending.length})
              </p>
              {pending.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border p-5 space-y-4"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>{c.projectTitle}</h5>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                        Contract {c.id.slice(0, 8).toUpperCase()} · {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "#f59e0b20", color: "#f59e0b" }}>
                      Needs Validation
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>WORKER</p>
                      <p style={{ color: "var(--color-foreground)" }}>{c.workerName}</p>
                      {c.workerSignedAt && (
                        <p className="text-xs" style={{ color: "#22c55e" }}>✓ Signed {new Date(c.workerSignedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>PROVIDER</p>
                      <p style={{ color: "var(--color-foreground)" }}>{c.providerName}</p>
                      {c.providerSignedAt && (
                        <p className="text-xs" style={{ color: "#22c55e" }}>✓ Signed {new Date(c.providerSignedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => validate(c.id)} disabled={validating === c.id}
                    className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition"
                    style={{ backgroundColor: "#22c55e" }}>
                    {validating === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {validating === c.id ? "Validating…" : "Validate Contract"}
                  </button>
                </motion.div>
              ))}
            </section>
          )}

          {/* Validated */}
          {validated.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "var(--color-muted-foreground)" }}>
                Validated ({validated.length})
              </p>
              {validated.map((c) => (
                <div key={c.id}
                  className="flex items-center justify-between rounded-xl border px-5 py-3"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{c.projectTitle}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                      {c.workerName} ↔ {c.providerName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#22c55e" }}>
                    <CheckCircle className="h-4 w-4" />
                    Validated
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Incomplete */}
          {incomplete.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "var(--color-muted-foreground)" }}>
                Incomplete Contracts ({incomplete.length})
              </p>
              {incomplete.map((c) => (
                <div key={c.id}
                  className="flex items-center justify-between rounded-xl border px-5 py-3"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{c.projectTitle}</p>
                    <div className="flex gap-3 mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      <span className="flex items-center gap-1">
                        {c.workerSigned ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
                        Worker
                      </span>
                      <span className="flex items-center gap-1">
                        {c.providerSigned ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
                        Provider
                      </span>
                    </div>
                  </div>
                  <FileSignature className="h-5 w-5" style={{ color: "var(--color-neutral-300)" }} />
                </div>
              ))}
            </section>
          )}

          {contracts.length === 0 && (
            <div className="rounded-xl border p-12 text-center"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <FileSignature className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>No contracts yet</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                Contracts appear here once workers and providers sign them.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
