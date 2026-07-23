"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/navigation";
import {
  Users, Calendar, ShieldAlert, ChevronRight,
  UserPlus, ScrollText, ShieldCheck, Briefcase,
} from "lucide-react";
import api from "@/lib/api";
import refundApi from "@/lib/refundApi";
import { authService } from "@/lib/authService";
import { projectService, type ProjectResponse } from "@/lib/projectService";
import { claimService, type ClaimResponse } from "@/lib/claimService";
import { contractService, type ContractResponse } from "@/lib/contractService";
import { useIsDarkMode, statusColor, useCategoricalPalette } from "@/lib/chartTheme";
import ChartCard from "@/components/charts/ChartCard";
import DonutStatChart from "@/components/charts/DonutStatChart";
import StatusBarChart, { type BarDatum } from "@/components/charts/StatusBarChart";
import TrendLineChart, { type TrendDatum } from "@/components/charts/TrendLineChart";

const ACCENT = "#5B4FE5";
const ACCENT_LIGHT = "#EEF2FF";

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 18,
  boxShadow: "var(--shadow-card)",
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.13em",
  color: "var(--color-muted-foreground)",
};

interface User {
  id: string;
  role: string;
  active: boolean;
  locked: boolean;
  createdAt: string;
}

interface SystemAccountData {
  totalBlockedAmount: number;
  accountsWithPendingFunds: number;
  totalAccounts: number;
}

type TxnType = "FUNDED" | "REFUND_ISSUED" | "REFUND_PENDING";

interface Transaction {
  id: string;
  title: string;
  type: TxnType;
  amount: number;
  date: string;
}

const USER_ROLES = ["PROVIDER", "WORKER", "EVALUATOR", "REFUND_OFFICE", "ADMIN"] as const;

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function initials(text: string): string {
  const words = text.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function AdminOverviewPage() {
  const t = useTranslations("AdminDashboard");
  const tStatus = useTranslations("Status");
  const locale = useLocale();
  const dark = useIsDarkMode();
  const categorical = useCategoricalPalette();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [claims, setClaims] = useState<ClaimResponse[]>([]);
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [systemAccount, setSystemAccount] = useState<SystemAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ fullName: string } | null>(null);

  useEffect(() => {
    const s = authService.getSession();
    if (s) setSession({ fullName: s.fullName });

    Promise.allSettled([
      api.get<User[]>("/api/admin/users"),
      projectService.getAllProjects(),
      claimService.getAllClaims(),
      contractService.getAllContracts(),
      refundApi.get<SystemAccountData>("/api/system/account"),
    ]).then(([u, p, c, k, sa]) => {
      if (u.status === "fulfilled") setUsers(u.value.data);
      if (p.status === "fulfilled") setProjects(p.value);
      if (c.status === "fulfilled") setClaims(c.value);
      if (k.status === "fulfilled") setContracts(k.value);
      if (sa.status === "fulfilled") setSystemAccount(sa.value.data);
    }).finally(() => setLoading(false));
  }, []);

  const total = users.length;
  const active = users.filter((u) => u.active && !u.locked).length;
  const locked = users.filter((u) => u.locked).length;

  const usersByRole = USER_ROLES.map((role, i) => ({
    key: role,
    label: role.replace("_", " "),
    value: users.filter((u) => u.role === role).length,
    color: categorical[i % categorical.length],
  }));

  const accountStatus = [
    { key: "ACTIVE", label: tStatus("ACTIVE"), value: active, color: statusColor("ACTIVE", dark) },
    { key: "LOCKED", label: tStatus("LOCKED"), value: locked, color: statusColor("LOCKED", dark) },
    { key: "INACTIVE", label: tStatus("INACTIVE"), value: Math.max(0, total - active - locked), color: statusColor("INACTIVE", dark) },
  ];

  const projectsByStatus = (["OPEN", "ASSIGNED", "COMPLETED", "FAILED"] as const).map((status) => ({
    key: status,
    label: tStatus(status),
    value: projects.filter((p) => p.status === status).length,
    color: statusColor(status, dark),
  }));

  const claimsByStatus = (["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "REFUND_INITIATED", "REFUNDED"] as const).map((status) => ({
    key: status,
    label: tStatus(status),
    value: claims.filter((c) => c.status === status).length,
    color: statusColor(status, dark),
  }));

  const fullyExecuted = contracts.filter((c) => c.adminValidated).length;
  const awaitingValidation = contracts.filter((c) => c.workerSigned && c.providerSigned && !c.adminValidated).length;
  const awaitingSignatures = contracts.filter((c) => !(c.workerSigned && c.providerSigned)).length;

  const contractPipeline = [
    { key: "fullyExecuted", label: t("fullyExecuted"), value: fullyExecuted, color: statusColor("APPROVED", dark) },
    { key: "awaitingValidation", label: t("awaitingValidation"), value: awaitingValidation, color: statusColor("UNDER_REVIEW", dark) },
    { key: "awaitingSignatures", label: t("awaitingSignatures"), value: awaitingSignatures, color: statusColor("PENDING", dark) },
  ];

  // "Dynamics of the Balance" — refunded amount actually paid out, grouped by month.
  const refundedClaims = claims.filter((c) => c.status === "REFUNDED");
  const totalRefunded = refundedClaims.reduce((sum, c) => sum + (c.projectBudget ?? 0), 0);

  const balanceDynamics: TrendDatum[] = (() => {
    const byMonth = new Map<string, { label: string; value: number }>();
    refundedClaims.forEach((c) => {
      const d = new Date(c.updatedAt);
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString(locale, { month: "short", year: "2-digit" });
      const prev = byMonth.get(sortKey);
      byMonth.set(sortKey, { label, value: (prev?.value ?? 0) + (c.projectBudget ?? 0) });
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sortKey, v]) => ({ key: sortKey, label: v.label, value: Math.round(v.value) }));
  })();

  // "Analytics" — new user sign-ups per week, last 6 weeks.
  const signupsByWeek: BarDatum[] = (() => {
    const now = new Date();
    const weeks: { key: string; label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(now.getDate() - i * 7 - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const value = users.filter((u) => {
        const d = new Date(u.createdAt);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeks.push({ key: `w${i}`, label: `W${6 - i}`, value });
    }
    return weeks.map((w, idx) => ({ ...w, color: categorical[idx % categorical.length] }));
  })();

  // "Recent Transactions" — real fundings + real refund outcomes, merged and sorted by date.
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const transactions: Transaction[] = [
    ...projects.filter((p) => p.funded).map((p) => ({
      id: `fund-${p.id}`, title: p.title, type: "FUNDED" as const, amount: p.budget, date: p.updatedAt || p.createdAt,
    })),
    ...refundedClaims.map((c) => ({
      id: `refund-${c.id}`,
      title: projectById.get(c.projectId)?.title ?? t("unknownProject"),
      type: "REFUND_ISSUED" as const,
      amount: c.projectBudget ?? 0,
      date: c.updatedAt,
    })),
    ...claims.filter((c) => ["PENDING", "UNDER_REVIEW", "APPROVED", "REFUND_INITIATED"].includes(c.status)).map((c) => ({
      id: `pending-${c.id}`,
      title: projectById.get(c.projectId)?.title ?? t("unknownProject"),
      type: "REFUND_PENDING" as const,
      amount: c.projectBudget ?? 0,
      date: c.updatedAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const txnLabel = (type: TxnType) =>
    type === "FUNDED" ? t("txnProjectFunded") : type === "REFUND_ISSUED" ? t("txnRefundIssued") : t("txnRefundPending");

  const today = new Date().toLocaleDateString(locale, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const quickLinks = [
    { label: t("manageAllUsers"), href: "/dashboard/admin/users", icon: <Users className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: t("createNewAccount"), href: "/dashboard/admin/users/create", icon: <UserPlus className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: t("workersMonitor"), href: "/dashboard/admin/workers-monitor", icon: <ShieldAlert className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: t("contractValidation"), href: "/dashboard/admin/contracts", icon: <ShieldCheck className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: t("projects"), href: "/dashboard/admin/projects", icon: <Briefcase className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: t("auditLog"), href: "/dashboard/admin/audit-log", icon: <ScrollText className="h-4 w-4" style={{ color: ACCENT }} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem", maxWidth: 1040 }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ ...CARD_STYLE, padding: "1.125rem 1.25rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "0.5rem", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: ACCENT }}>
          <ShieldAlert style={{ width: 11, height: 11 }} />
          {t("roleBadge")}
        </div>
        <h2 style={{ color: "var(--color-foreground)", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "0.25rem" }}>
          {session?.fullName ? t("welcomeBack", { name: session.fullName }) : t("defaultTitle")}
        </h2>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "0.8125rem" }}>{t("subtitle")}</p>
        <div style={{ marginTop: "0.625rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Calendar style={{ width: 12, height: 12, color: "var(--color-muted-foreground)" }} />
          <span style={{ fontSize: "0.6875rem", color: "var(--color-muted-foreground)" }}>{today}</span>
        </div>
      </motion.div>

      {/* Dynamics of the Balance + Analytics/Available Balance sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem", alignItems: "start" }}>
        <div style={{ gridColumn: "span 2", minWidth: 0 }}>
          <ChartCard title={t("balanceDynamics")} subtitle={t("balanceDynamicsSub")} delay={0.16} compact>
            <TrendLineChart data={balanceDynamics} valueFormatter={currency} emptyMessage={t("noRefundsYet")} height={150} />
          </ChartCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0 }}>
          <ChartCard title={t("analytics")} subtitle={t("analyticsSub")} delay={0.2} compact>
            <StatusBarChart data={signupsByWeek} height={120} />
          </ChartCard>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            style={{ ...CARD_STYLE, padding: "1.125rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={SECTION_LABEL_STYLE}>{t("availableBalance")}</p>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#16a34a" }}>
                <span style={{ height: 5, width: 5, borderRadius: "50%", backgroundColor: "#16a34a" }} />
                {t("liveLabel")}
              </span>
            </div>
            <div>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {loading ? "—" : currency(systemAccount?.totalBlockedAmount ?? 0)}
              </p>
              <p style={{ fontSize: "0.6875rem", color: "var(--color-muted-foreground)", marginTop: 5 }}>
                {t("lockedInProjects", { count: systemAccount?.accountsWithPendingFunds ?? 0 })}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderTop: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "0.6875rem", color: "var(--color-muted-foreground)" }}>{t("totalRefundedLabel")}</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-foreground)" }}>{currency(totalRefunded)}</span>
            </div>
            <Link href="/dashboard/admin/projects"
              style={{ textAlign: "center", borderRadius: 10, padding: "0.5rem", fontWeight: 700, fontSize: "0.75rem", textDecoration: "none", backgroundColor: ACCENT, color: "#fff" }}>
              {t("viewProjects")}
            </Link>
          </motion.div>
        </div>
      </div>

      <div>
        <p style={{ ...SECTION_LABEL_STYLE, marginBottom: "0.625rem" }}>{t("platformMetrics")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          <ChartCard title={t("usersByRole")} delay={0.28} compact>
            <DonutStatChart data={usersByRole} centerLabel={t("totalUsers")} height={140} />
          </ChartCard>
          <ChartCard title={t("accountStatus")} delay={0.3} compact>
            <DonutStatChart data={accountStatus} centerLabel={t("totalUsers")} height={140} />
          </ChartCard>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          <ChartCard title={t("projectsByStatus")} delay={0.34} compact>
            <StatusBarChart data={projectsByStatus} height={160} />
          </ChartCard>
          <ChartCard title={t("claimsByStatus")} delay={0.36} compact>
            <StatusBarChart data={claimsByStatus} height={160} />
          </ChartCard>
          <ChartCard title={t("contractPipeline")} delay={0.38} compact>
            <DonutStatChart data={contractPipeline} centerLabel={t("contractPipeline")} height={140} />
          </ChartCard>
        </div>
      </div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} style={{ ...CARD_STYLE, padding: "1.125rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
          <p style={SECTION_LABEL_STYLE}>{t("recentTransactions")}</p>
          <Link href="/dashboard/admin/projects" style={{ fontSize: "0.6875rem", fontWeight: 600, color: ACCENT, textDecoration: "none" }}>
            {t("viewAll")}
          </Link>
        </div>

        {transactions.length === 0 ? (
          <p style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)", padding: "1.5rem 0", textAlign: "center" }}>
            {t("noTransactionsYet")}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {transactions.map((tx, i) => {
              const isPending = tx.type === "REFUND_PENDING";
              return (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0", borderBottom: i < transactions.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <div style={{ height: 30, width: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: ACCENT_LIGHT, color: ACCENT, fontSize: "0.6875rem", fontWeight: 800, flexShrink: 0 }}>
                    {initials(tx.title)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tx.title}
                    </p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-muted-foreground)" }}>
                      {txnLabel(tx.type)} · {new Date(tx.date).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: tx.type === "FUNDED" ? "#16a34a" : "var(--color-foreground)" }}>
                      {tx.type === "FUNDED" ? "+" : ""}{currency(tx.amount)}
                    </p>
                    <span
                      style={{
                        display: "inline-block", marginTop: 2, padding: "1px 7px", borderRadius: 999,
                        fontSize: 9, fontWeight: 700,
                        backgroundColor: isPending ? "#fef3c7" : "#dcfce7",
                        color: isPending ? "#b45309" : "#15803d",
                      }}
                    >
                      {isPending ? t("pending") : t("success")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }} style={{ ...CARD_STYLE, padding: "1.125rem" }}>
        <p style={{ ...SECTION_LABEL_STYLE, marginBottom: "0.75rem" }}>{t("quickActions")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.4rem" }}>
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}
              style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.625rem", borderRadius: 9, border: "1px solid var(--color-border)", textDecoration: "none", transition: "background-color 0.12s, border-color 0.12s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ACCENT_LIGHT; (e.currentTarget as HTMLElement).style.borderColor = `${ACCENT}35`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}>
              <div style={{ height: 24, width: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: ACCENT_LIGHT, flexShrink: 0 }}>{link.icon}</div>
              <span style={{ flex: 1, fontSize: "0.75rem", fontWeight: 500, color: "var(--color-foreground)" }}>{link.label}</span>
              <ChevronRight style={{ width: 13, height: 13, color: ACCENT, opacity: 0.4, flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
