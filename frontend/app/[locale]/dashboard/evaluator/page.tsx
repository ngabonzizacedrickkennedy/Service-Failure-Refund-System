"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/navigation";
import {
  User, Mail, Shield, ClipboardCheck, Scale, ShieldCheck,
  MessageSquare, ChevronRight, Calendar, ArrowUpRight,
} from "lucide-react";
import { authService } from "@/lib/authService";
import { evaluatorService, type EvaluatorClaimResponse } from "@/lib/evaluatorService";
import { justificationService, type JustificationWithClaimDto } from "@/lib/justificationService";
import { useIsDarkMode, statusColor } from "@/lib/chartTheme";
import ChartCard from "@/components/charts/ChartCard";
import DonutStatChart from "@/components/charts/DonutStatChart";
import StatusBarChart from "@/components/charts/StatusBarChart";

const ACCENT = "#5B4FE5";
const ACCENT_LIGHT = "#EEF2FF";
const CARD_STYLE: React.CSSProperties = { backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, boxShadow: "var(--shadow-card)" };

const CLAIM_STATUSES = ["PENDING", "APPROVED", "REJECTED", "REFUND_INITIATED", "REFUNDED"] as const;
const JUSTIFICATION_STATUSES = ["SUBMITTED", "VALIDATED", "REJECTED"] as const;

export default function EvaluatorDashboard() {
  const t = useTranslations("EvaluatorDashboard");
  const tStatus = useTranslations("Status");
  const locale = useLocale();
  const dark = useIsDarkMode();
  const [session, setSession] = useState<{ fullName: string; email: string; role: string } | null>(null);
  const [claims, setClaims] = useState<EvaluatorClaimResponse[]>([]);
  const [justifications, setJustifications] = useState<JustificationWithClaimDto[]>([]);

  useEffect(() => {
    const s = authService.getSession();
    if (s) setSession({ fullName: s.fullName, email: s.email, role: s.role });

    Promise.allSettled([evaluatorService.getAllClaims(), justificationService.getAllJustifications()])
      .then(([c, j]) => {
        if (c.status === "fulfilled") setClaims(c.value);
        if (j.status === "fulfilled") setJustifications(j.value);
      });
  }, []);

  const today = new Date().toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const claimsByStatus = CLAIM_STATUSES.map((status) => ({
    key: status,
    label: tStatus(status),
    value: claims.filter((c) => c.status === status).length,
    color: statusColor(status, dark),
  }));

  const justificationsByStatus = JUSTIFICATION_STATUSES.map((status) => ({
    key: status,
    label: tStatus(status),
    value: justifications.filter((j) => j.justificationStatus === status).length,
    color: statusColor(status, dark),
  }));

  const modules = [
    { label: t("submittedClaims"), desc: t("submittedClaimsDesc"), href: "/dashboard/evaluator/claims", icon: <ClipboardCheck className="h-5 w-5" style={{ color: ACCENT }} /> },
    { label: t("justifications"), desc: t("justificationsDesc"), href: "/dashboard/evaluator/justifications", icon: <Scale className="h-5 w-5" style={{ color: ACCENT }} /> },
    { label: t("claimMonitor"), desc: t("claimMonitorDesc"), href: "/dashboard/evaluator/claim-monitor", icon: <ShieldCheck className="h-5 w-5" style={{ color: ACCENT }} /> },
  ];

  const actions = [
    { label: t("viewEditProfile"), href: "/dashboard/evaluator/profile", icon: <User className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: t("messaging"), href: "/dashboard/evaluator/messaging", icon: <MessageSquare className="h-4 w-4" style={{ color: ACCENT }} /> },
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
          <Scale style={{ width: 12, height: 12 }} />{t("roleBadge")}
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
        <ChartCard title={t("claimsQueue")} delay={0.14}>
          <StatusBarChart data={claimsByStatus} />
        </ChartCard>
        <ChartCard title={t("justificationsByStatus")} delay={0.18}>
          <DonutStatChart data={justificationsByStatus} centerLabel={t("justificationsByStatus")} />
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
