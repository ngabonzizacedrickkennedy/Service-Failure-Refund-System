"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/navigation";
import {
  User, Mail, Shield, RefreshCw, ClipboardCheck, Landmark,
  MessageSquare, ChevronRight, Calendar, ArrowUpRight, DollarSign, Lock, Users,
} from "lucide-react";
import { authService } from "@/lib/authService";
import refundApi from "@/lib/refundApi";
import { refundService, type RefundClaimResponse } from "@/lib/refundService";
import { useIsDarkMode, statusColor } from "@/lib/chartTheme";
import ChartCard from "@/components/charts/ChartCard";
import DonutStatChart from "@/components/charts/DonutStatChart";
import TrendLineChart, { type TrendDatum } from "@/components/charts/TrendLineChart";
import StatRow from "@/components/charts/StatRow";

interface SystemAccountData {
  totalBlockedAmount: number;
  accountsWithPendingFunds: number;
  totalAccounts: number;
}

const ACCENT = "#5B4FE5";
const ACCENT_LIGHT = "#EEF2FF";
const CARD_STYLE: React.CSSProperties = { backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, boxShadow: "var(--shadow-card)" };

export default function RefundOfficeDashboard() {
  const t = useTranslations("RefundOfficeDashboard");
  const tStatus = useTranslations("Status");
  const locale = useLocale();
  const dark = useIsDarkMode();
  const [session, setSession] = useState<{ fullName: string; email: string; role: string } | null>(null);
  const [account, setAccount] = useState<SystemAccountData | null>(null);
  const [pending, setPending] = useState<RefundClaimResponse[]>([]);
  const [refunded, setRefunded] = useState<RefundClaimResponse[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const s = authService.getSession();
    if (s) setSession({ fullName: s.fullName, email: s.email, role: s.role });

    Promise.allSettled([
      refundApi.get<SystemAccountData>("/api/system/account"),
      refundService.getRefundPendingClaims(),
      refundService.getRefundedClaims(),
    ]).then(([acc, pend, ref]) => {
      if (acc.status === "fulfilled") setAccount(acc.value.data);
      if (pend.status === "fulfilled") setPending(pend.value);
      if (ref.status === "fulfilled") setRefunded(ref.value);
    }).finally(() => setDataLoading(false));
  }, []);

  const currency = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const accountStats = [
    { key: "blocked", label: t("totalBlockedAmount"), value: dataLoading ? "—" : currency(account?.totalBlockedAmount ?? 0), sub: t("totalBlockedSub"), icon: <Lock className="h-5 w-5" /> },
    { key: "pendingAccounts", label: t("pendingFundsAccounts"), value: dataLoading ? "—" : (account?.accountsWithPendingFunds ?? 0), sub: t("pendingFundsSub"), icon: <Users className="h-5 w-5" /> },
    { key: "totalAccounts", label: t("totalAccounts"), value: dataLoading ? "—" : (account?.totalAccounts ?? 0), sub: t("totalAccountsSub"), icon: <DollarSign className="h-5 w-5" /> },
  ];

  const refundPipeline = [
    { key: "PENDING", label: tStatus("PENDING"), value: pending.length, color: statusColor("PENDING", dark) },
    { key: "REFUNDED", label: tStatus("REFUNDED"), value: refunded.length, color: statusColor("REFUNDED", dark) },
  ];

  const refundsByMonth: TrendDatum[] = (() => {
    const byMonth = new Map<string, { label: string; value: number }>();
    refunded.forEach((c) => {
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

  const today = new Date().toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const modules = [
    { label: t("refundClaims"), desc: t("refundClaimsDesc"), href: "/dashboard/refund-office/claims", icon: <RefreshCw className="h-5 w-5" style={{ color: ACCENT }} /> },
    { label: t("refundActions"), desc: t("refundActionsDesc"), href: "/dashboard/refund-office/refund-action", icon: <ClipboardCheck className="h-5 w-5" style={{ color: ACCENT }} /> },
    { label: t("systemAccount"), desc: t("systemAccountDesc"), href: "/dashboard/refund-office/system-account", icon: <Landmark className="h-5 w-5" style={{ color: ACCENT }} /> },
  ];

  const actions = [
    { label: t("viewEditProfile"), href: "/dashboard/refund-office/profile", icon: <User className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: t("messaging"), href: "/dashboard/refund-office/messaging", icon: <MessageSquare className="h-4 w-4" style={{ color: ACCENT }} /> },
  ];

  const accountFields = [
    { icon: <User className="h-3.5 w-3.5" />, label: t("fullName"), value: session?.fullName || "—" },
    { icon: <Mail className="h-3.5 w-3.5" />, label: t("emailAddress"), value: session?.email || "—" },
    { icon: <Shield className="h-3.5 w-3.5" />, label: t("role"), value: t("roleValue") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 1100 }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ ...CARD_STYLE, padding: "1.5rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "0.625rem", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: ACCENT }}>
          <DollarSign style={{ width: 12, height: 12 }} />{t("roleBadge")}
        </div>
        <h2 style={{ color: "var(--color-foreground)", fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "0.375rem" }}>
          {t("welcomeBack", { name: session?.fullName || t("defaultName") })}
        </h2>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "0.875rem" }}>{t("subtitle")}</p>
        <div style={{ marginTop: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar style={{ width: 13, height: 13, color: "var(--color-muted-foreground)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)" }}>{today}</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...CARD_STYLE, padding: "1.5rem" }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "1.25rem" }}>{t("overview")}</p>
        <StatRow stats={accountStats} />
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
        <ChartCard title={t("refundPipeline")} delay={0.15}>
          <DonutStatChart data={refundPipeline} centerLabel={t("refundPipeline")} />
        </ChartCard>
        <ChartCard title={t("refundsByMonth")} delay={0.2}>
          <TrendLineChart data={refundsByMonth} valueFormatter={(v) => currency(v)} />
        </ChartCard>
      </div>

      <div>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "0.75rem" }}>{t("modules")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {modules.map((mod, i) => (
            <motion.div key={mod.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.07 }}>
              <Link href={mod.href} style={{ ...CARD_STYLE, display: "block", padding: "1.25rem", textDecoration: "none", transition: "box-shadow 0.2s, border-color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-elevated)"; (e.currentTarget as HTMLElement).style.borderColor = `${ACCENT}45`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ height: 40, width: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: ACCENT_LIGHT, flexShrink: 0 }}>{mod.icon}</div>
                  <ArrowUpRight style={{ width: 15, height: 15, color: ACCENT, opacity: 0.35, flexShrink: 0 }} />
                </div>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-foreground)", marginBottom: "0.25rem" }}>{mod.label}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)" }}>{mod.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ ...CARD_STYLE, padding: "1.5rem" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "1rem" }}>{t("accountInfo")}</p>
          <div>
            {accountFields.map((field, i) => (
              <div key={field.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0", borderBottom: i < accountFields.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                <div style={{ height: 30, width: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: ACCENT_LIGHT, color: ACCENT, flexShrink: 0 }}>{field.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted-foreground)", marginBottom: 2 }}>{field.label}</p>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{field.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.31 }} style={{ ...CARD_STYLE, padding: "1.5rem" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "1rem" }}>{t("quickActions")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {actions.map((action) => (
              <Link key={action.href} href={action.href}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.75rem", borderRadius: 10, border: "1px solid var(--color-border)", textDecoration: "none", transition: "background-color 0.12s, border-color 0.12s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ACCENT_LIGHT; (e.currentTarget as HTMLElement).style.borderColor = `${ACCENT}35`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}>
                <div style={{ height: 28, width: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: ACCENT_LIGHT, flexShrink: 0 }}>{action.icon}</div>
                <span style={{ flex: 1, fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-foreground)" }}>{action.label}</span>
                <ChevronRight style={{ width: 14, height: 14, color: ACCENT, opacity: 0.4, flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
