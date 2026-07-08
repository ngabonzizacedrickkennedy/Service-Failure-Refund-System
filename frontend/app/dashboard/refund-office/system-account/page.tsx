"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, RefreshCw, Lock, Users } from "lucide-react";
import { toast } from "react-toastify";
import refundApi from "@/lib/refundApi";

interface SystemAccountData {
  totalBlockedAmount: number;
  accountsWithPendingFunds: number;
  totalAccounts: number;
}

export default function SystemAccountPage() {
  const [data, setData]       = useState<SystemAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await refundApi.get<SystemAccountData>("/api/system/account", { cache: false });
      setData(res.data);
    } catch {
      toast.error("Failed to load system account data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const stats = data
    ? [
        {
          label: "Total Locked Amount",
          value: fmt(data.totalBlockedAmount),
          sub: "Sum of budgets for all worker-assigned projects",
          icon: <Lock className="h-5 w-5" style={{ color: "#f59e0b" }} />,
          color: "#f59e0b",
        },
        {
          label: "Active Assigned Projects",
          value: data.accountsWithPendingFunds.toString(),
          sub: "Projects currently locked with a worker",
          icon: <Users className="h-5 w-5" style={{ color: "#6366f1" }} />,
          color: "#6366f1",
        },
        {
          label: "Total Registered Accounts",
          value: data.totalAccounts.toString(),
          sub: "All system accounts",
          icon: <DollarSign className="h-5 w-5" style={{ color: "#22c55e" }} />,
          color: "#22c55e",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>System Account</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Live view of all funds currently blocked in the system — money held in escrow
            while workers are assigned to active projects.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50"
          style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-primary)" }} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border p-5"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{s.label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: "var(--color-foreground)" }}>
                      {s.value}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>{s.sub}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: s.color + "20" }}>
                    {s.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="rounded-xl border p-5 space-y-3"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
              How System Account Works
            </p>
            <ul className="space-y-2 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#6366f1" }} />
                When a provider funds a project, the budget is deposited into their system account
                and held until the project concludes (success or refund).
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#22c55e" }} />
                When the project completes successfully, the pending balance is released to the worker.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#f59e0b" }} />
                When a refund is processed, the pending balance is returned to the provider and debited
                from the system total blocked amount.
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
