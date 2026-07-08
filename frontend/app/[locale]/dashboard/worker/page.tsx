"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/navigation";
import {
  User, Mail, Shield, CheckCircle, AlertTriangle, ChevronRight,
  Video, ClipboardList, Calendar, Zap,
} from "lucide-react";
import { authService } from "@/lib/authService";
import { userService, type UserProfile, type WorkerProfile } from "@/lib/userService";
import { workerCvService, type WorkerCvResponse } from "@/lib/workerCvService";
import { projectService, type ProjectResponse } from "@/lib/projectService";
import { claimService, type ClaimResponse } from "@/lib/claimService";
import { useIsDarkMode, statusColor } from "@/lib/chartTheme";
import ChartCard from "@/components/charts/ChartCard";
import DonutStatChart from "@/components/charts/DonutStatChart";
import StatusBarChart from "@/components/charts/StatusBarChart";

const ACCENT = "#5B4FE5";
const ACCENT_LIGHT = "#EEF2FF";
const CARD_STYLE: React.CSSProperties = { backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, boxShadow: "var(--shadow-card)" };

function calcCompletion(user: UserProfile | null, profile: WorkerProfile | null, cv: WorkerCvResponse | null) {
  const items = [
    { key: "itemFullName", done: !!user?.fullName?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { key: "itemPhone", done: !!user?.phone?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { key: "itemTitle", done: !!profile?.professionalTitle?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { key: "itemLocation", done: !!(profile?.country?.trim() && profile?.city?.trim()), weight: 10, href: "/dashboard/worker/profile" },
    { key: "itemExpertise", done: !!profile?.specialization?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { key: "itemLinkedin", done: !!(profile as (WorkerProfile & { linkedinUrl?: string }) | null)?.linkedinUrl?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { key: "itemGithub", done: !!(profile as (WorkerProfile & { githubUrl?: string }) | null)?.githubUrl?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { key: "itemCvSpec", done: !!(cv?.specialization?.trim() && cv?.yearsOfExperience !== undefined), weight: 15, href: "/dashboard/worker/cv" },
    { key: "itemCvFile", done: !!cv?.cvFileUrl, weight: 15, href: "/dashboard/worker/cv" },
  ];
  const total = items.reduce((s, i) => s + i.weight, 0);
  const done = items.filter((i) => i.done).reduce((s, i) => s + i.weight, 0);
  return { pct: Math.round((done / total) * 100), items };
}

const PROJECT_STATUSES = ["ASSIGNED", "COMPLETED", "FAILED"] as const;
const CLAIM_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "REFUND_INITIATED", "REFUNDED"] as const;

export default function WorkerDashboard() {
  const t = useTranslations("WorkerDashboard");
  const tStatus = useTranslations("Status");
  const locale = useLocale();
  const dark = useIsDarkMode();
  const [session, setSession] = useState<{ userId: string; fullName: string; email: string; role: string } | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [cv, setCv] = useState<WorkerCvResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [claims, setClaims] = useState<ClaimResponse[]>([]);

  useEffect(() => {
    const s = authService.getSession();
    if (!s) { setLoading(false); return; }
    setSession({ userId: s.userId, fullName: s.fullName, email: s.email, role: s.role });
    Promise.allSettled([userService.getUser(s.userId), userService.getIdentityProfile(s.role, s.userId), workerCvService.getMyCv()])
      .then(([u, p, c]) => {
        if (u.status === "fulfilled") setUser(u.value as UserProfile);
        if (p.status === "fulfilled") setProfile(p.value as WorkerProfile);
        if (c.status === "fulfilled") setCv(c.value as WorkerCvResponse);
      }).finally(() => setLoading(false));

    Promise.allSettled([projectService.getAssignedProjects(), claimService.getClaimsAgainstMe()])
      .then(([p, c]) => {
        if (p.status === "fulfilled") setProjects(p.value);
        if (c.status === "fulfilled") setClaims(c.value);
      });
  }, []);

  const { pct, items } = calcCompletion(user, profile, cv);
  const canBeRated = pct >= 80;

  const projectsByStatus = PROJECT_STATUSES.map((status) => ({
    key: status,
    label: tStatus(status),
    value: projects.filter((p) => p.status === status).length,
    color: statusColor(status, dark),
  }));

  const claimsByStatus = CLAIM_STATUSES.map((status) => ({
    key: status,
    label: tStatus(status),
    value: claims.filter((c) => c.status === status).length,
    color: statusColor(status, dark),
  }));

  const trackRecord = [
    { key: "completed", label: t("completedLabel"), value: cv?.completedProjects ?? 0, color: statusColor("COMPLETED", dark) },
    { key: "failed", label: t("failuresLabel"), value: cv?.pastFailures ?? 0, color: statusColor("FAILED", dark) },
  ];
  const barGrad = pct < 50 ? "linear-gradient(90deg, #ef4444, #f87171)" : pct < 80 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #22c55e, #4ade80)";
  const barColor = pct < 50 ? "#ef4444" : pct < 80 ? "#f59e0b" : "#22c55e";

  const today = new Date().toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const accountFields = [
    { icon: <User className="h-3.5 w-3.5" />, label: t("fullName"), value: session?.fullName || "—" },
    { icon: <Mail className="h-3.5 w-3.5" />, label: t("emailAddress"), value: session?.email || "—" },
    { icon: <Shield className="h-3.5 w-3.5" />, label: t("role"), value: t("roleValue") },
  ];

  const actions = [
    { label: t("viewEditProfile"), href: "/dashboard/worker/profile", icon: <User className="h-4 w-4" style={{ color: ACCENT }} />, special: false },
    { label: t("manageCV"), href: "/dashboard/worker/cv", icon: <ClipboardList className="h-4 w-4" style={{ color: ACCENT }} />, special: false },
    ...(canBeRated ? [{ label: t("startAiInterview"), href: "/dashboard/worker/interview", icon: <Video className="h-4 w-4" style={{ color: ACCENT }} />, special: true }] : []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 1100 }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ ...CARD_STYLE, padding: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "0.625rem", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: ACCENT }}>
            <User style={{ width: 12, height: 12 }} />{t("roleBadge")}
          </div>
          <h2 style={{ color: "var(--color-foreground)", fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "0.375rem" }}>
            {t("welcomeBack", { name: session?.fullName || t("defaultName") })}
          </h2>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "0.875rem" }}>{t("subtitle")}</p>
          <div style={{ marginTop: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar style={{ width: 13, height: 13, color: "var(--color-muted-foreground)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)" }}>{today}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: "1.5rem" }}>
          <span style={{ fontSize: "2.25rem", fontWeight: 900, lineHeight: 1, color: loading ? "var(--color-muted-foreground)" : (canBeRated ? "#22c55e" : "#f59e0b") }}>
            {loading ? "—" : `${pct}%`}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted-foreground)" }}>{t("complete")}</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...CARD_STYLE, padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: 4 }}>{t("profileCompletion")}</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-foreground)" }}>
              {canBeRated ? t("completionReady") : t("completionNeeded", { remaining: 80 - pct })}
            </p>
          </div>
          {!loading && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999, padding: "0.3rem 0.75rem", flexShrink: 0, marginLeft: "1rem", fontSize: 11, fontWeight: 700, backgroundColor: canBeRated ? "#22c55e18" : "#f59e0b18", color: canBeRated ? "#22c55e" : "#f59e0b", border: `1px solid ${canBeRated ? "#22c55e35" : "#f59e0b35"}` }}>
              {canBeRated ? <CheckCircle style={{ width: 12, height: 12 }} /> : <AlertTriangle style={{ width: 12, height: 12 }} />}
              {canBeRated ? t("aiUnlocked") : `${pct}%`}
            </div>
          )}
        </div>
        <div style={{ width: "100%", height: 7, borderRadius: 999, backgroundColor: "var(--color-border)", overflow: "hidden", marginBottom: "1.25rem" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: loading ? "0%" : `${pct}%` }} transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ height: "100%", borderRadius: 999, background: barGrad, boxShadow: `0 0 10px ${barColor}60` }} />
        </div>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {[...Array(6)].map((_, i) => (<div key={i} style={{ height: 36, borderRadius: 10, backgroundColor: "var(--color-neutral-100)", animation: "pulse 1.5s ease-in-out infinite" }} />))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {items.map((item) => (
              <Link key={item.key} href={item.href}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5625rem 0.75rem", borderRadius: 10, textDecoration: "none", backgroundColor: item.done ? "#22c55e09" : "transparent", transition: "background-color 0.12s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-neutral-50)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = item.done ? "#22c55e09" : "transparent"; }}>
                <div style={{ height: 18, width: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${item.done ? "#22c55e" : "var(--color-border)"}`, backgroundColor: item.done ? "#22c55e" : "transparent" }}>
                  {item.done && <CheckCircle style={{ width: 10, height: 10, color: "#fff" }} />}
                </div>
                <span style={{ flex: 1, fontSize: "0.8125rem", color: item.done ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}>{t(item.key as Parameters<typeof t>[0])}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, backgroundColor: item.done ? "#22c55e18" : "var(--color-neutral-100)", color: item.done ? "#22c55e" : "var(--color-muted-foreground)" }}>+{item.weight}%</span>
                {!item.done && <ChevronRight style={{ width: 13, height: 13, color: ACCENT, opacity: 0.4, flexShrink: 0 }} />}
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
        <ChartCard title={t("myProjectsByStatus")} delay={0.16}>
          <DonutStatChart data={projectsByStatus} centerLabel={t("myProjectsByStatus")} />
        </ChartCard>
        <ChartCard title={t("claimsAgainstMeByStatus")} delay={0.2}>
          <StatusBarChart data={claimsByStatus} />
        </ChartCard>
        <ChartCard title={t("trackRecord")} subtitle={`${t("ratingScore")}: ${cv?.ratingScore?.toFixed(1) ?? "—"}`} delay={0.24}>
          <DonutStatChart data={trackRecord} centerLabel={t("trackRecord")} />
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} style={{ ...CARD_STYLE, padding: "1.5rem" }}>
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ ...CARD_STYLE, padding: "1.5rem" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "1rem" }}>{t("quickActions")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {actions.map((action) => (
              <Link key={action.href} href={action.href}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.75rem", borderRadius: 10, border: action.special ? `1px solid ${ACCENT}35` : "1px solid var(--color-border)", backgroundColor: action.special ? `${ACCENT}10` : "transparent", textDecoration: "none", transition: "background-color 0.12s, border-color 0.12s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ACCENT_LIGHT; (e.currentTarget as HTMLElement).style.borderColor = `${ACCENT}40`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = action.special ? `${ACCENT}10` : "transparent"; (e.currentTarget as HTMLElement).style.borderColor = action.special ? `${ACCENT}35` : "var(--color-border)"; }}>
                <div style={{ height: 28, width: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: ACCENT_LIGHT, flexShrink: 0 }}>{action.icon}</div>
                <span style={{ flex: 1, fontSize: "0.8125rem", fontWeight: action.special ? 600 : 500, color: action.special ? ACCENT : "var(--color-foreground)" }}>{action.label}</span>
                {action.special && <Zap style={{ width: 13, height: 13, color: ACCENT, flexShrink: 0 }} />}
                <ChevronRight style={{ width: 14, height: 14, color: ACCENT, opacity: action.special ? 0.7 : 0.4, flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
