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
import { authService } from "@/lib/authService";
import { projectService, type ProjectResponse } from "@/lib/projectService";
import { claimService, type ClaimResponse } from "@/lib/claimService";
import { contractService, type ContractResponse } from "@/lib/contractService";
import { useIsDarkMode, statusColor, useCategoricalPalette } from "@/lib/chartTheme";
import ChartCard from "@/components/charts/ChartCard";
import DonutStatChart from "@/components/charts/DonutStatChart";
import StatusBarChart from "@/components/charts/StatusBarChart";

const ACCENT = "#5B4FE5";
const ACCENT_LIGHT = "#EEF2FF";

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 20,
  boxShadow: "var(--shadow-card)",
};

interface User {
  id: string;
  role: string;
  active: boolean;
  locked: boolean;
}

const USER_ROLES = ["PROVIDER", "WORKER", "EVALUATOR", "REFUND_OFFICE", "ADMIN"] as const;

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
    ]).then(([u, p, c, k]) => {
      if (u.status === "fulfilled") setUsers(u.value.data);
      if (p.status === "fulfilled") setProjects(p.value);
      if (c.status === "fulfilled") setClaims(c.value);
      if (k.status === "fulfilled") setContracts(k.value);
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 1100 }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ ...CARD_STYLE, padding: "1.5rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "0.625rem", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: ACCENT }}>
          <ShieldAlert style={{ width: 12, height: 12 }} />
          {t("roleBadge")}
        </div>
        <h2 style={{ color: "var(--color-foreground)", fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "0.375rem" }}>
          {session?.fullName ? t("welcomeBack", { name: session.fullName }) : t("defaultTitle")}
        </h2>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "0.875rem" }}>{t("subtitle")}</p>
        <div style={{ marginTop: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar style={{ width: 13, height: 13, color: "var(--color-muted-foreground)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)" }}>{today}</span>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
        <ChartCard title={t("usersByRole")} delay={0.2}>
          <DonutStatChart data={usersByRole} centerLabel={t("totalUsers")} />
        </ChartCard>
        <ChartCard title={t("accountStatus")} delay={0.24}>
          <DonutStatChart data={accountStatus} centerLabel={t("totalUsers")} />
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
        <ChartCard title={t("projectsByStatus")} delay={0.28}>
          <StatusBarChart data={projectsByStatus} />
        </ChartCard>
        <ChartCard title={t("claimsByStatus")} delay={0.32}>
          <StatusBarChart data={claimsByStatus} />
        </ChartCard>
        <ChartCard title={t("contractPipeline")} delay={0.36}>
          <DonutStatChart data={contractPipeline} centerLabel={t("contractPipeline")} />
        </ChartCard>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ ...CARD_STYLE, padding: "1.5rem" }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "1rem" }}>{t("quickActions")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.5rem" }}>
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.75rem", borderRadius: 10, border: "1px solid var(--color-border)", textDecoration: "none", transition: "background-color 0.12s, border-color 0.12s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ACCENT_LIGHT; (e.currentTarget as HTMLElement).style.borderColor = `${ACCENT}35`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}>
              <div style={{ height: 28, width: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: ACCENT_LIGHT, flexShrink: 0 }}>{link.icon}</div>
              <span style={{ flex: 1, fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-foreground)" }}>{link.label}</span>
              <ChevronRight style={{ width: 14, height: 14, color: ACCENT, opacity: 0.4, flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
