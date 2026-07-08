"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Shield, CheckCircle, AlertTriangle, ChevronRight,
  Video, ClipboardList, Calendar, Zap,
} from "lucide-react";
import Link from "next/link";
import { authService } from "@/lib/authService";
import { userService, type UserProfile, type WorkerProfile } from "@/lib/userService";
import { workerCvService, type WorkerCvResponse } from "@/lib/workerCvService";

const ACCENT = "#7C3AED";
const ACCENT_LIGHT = "#F5F3FF";

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 14,
  boxShadow: "var(--shadow-card)",
};

interface CompletionItem {
  label: string;
  done: boolean;
  weight: number;
  href: string;
}

function calcCompletion(
  user: UserProfile | null,
  profile: WorkerProfile | null,
  cv: WorkerCvResponse | null,
): { pct: number; items: CompletionItem[] } {
  const items: CompletionItem[] = [
    { label: "Full name provided", done: !!user?.fullName?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { label: "Phone number added", done: !!user?.phone?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { label: "Professional title set", done: !!profile?.professionalTitle?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { label: "Country & city filled", done: !!(profile?.country?.trim() && profile?.city?.trim()), weight: 10, href: "/dashboard/worker/profile" },
    { label: "Field of expertise selected", done: !!profile?.specialization?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { label: "LinkedIn profile linked", done: !!(profile as (WorkerProfile & { linkedinUrl?: string }) | null)?.linkedinUrl?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { label: "GitHub profile linked", done: !!(profile as (WorkerProfile & { githubUrl?: string }) | null)?.githubUrl?.trim(), weight: 10, href: "/dashboard/worker/profile" },
    { label: "CV / specialization submitted", done: !!(cv?.specialization?.trim() && cv?.yearsOfExperience !== undefined), weight: 15, href: "/dashboard/worker/cv" },
    { label: "CV file uploaded", done: !!cv?.cvFileUrl, weight: 15, href: "/dashboard/worker/cv" },
  ];
  const total = items.reduce((s, i) => s + i.weight, 0);
  const done = items.filter((i) => i.done).reduce((s, i) => s + i.weight, 0);
  return { pct: Math.round((done / total) * 100), items };
}

export default function WorkerDashboard() {
  const [session, setSession] = useState<{ userId: string; fullName: string; email: string; role: string } | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [cv, setCv] = useState<WorkerCvResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = authService.getSession();
    if (!s) { setLoading(false); return; }
    setSession({ userId: s.userId, fullName: s.fullName, email: s.email, role: s.role });

    Promise.allSettled([
      userService.getUser(s.userId),
      userService.getIdentityProfile(s.role, s.userId),
      workerCvService.getMyCv(),
    ]).then(([u, p, c]) => {
      if (u.status === "fulfilled") setUser(u.value as UserProfile);
      if (p.status === "fulfilled") setProfile(p.value as WorkerProfile);
      if (c.status === "fulfilled") setCv(c.value as WorkerCvResponse);
    }).finally(() => setLoading(false));
  }, []);

  const { pct, items } = calcCompletion(user, profile, cv);
  const canBeRated = pct >= 80;
  const barColor = pct < 50 ? "#ef4444" : pct < 80 ? "#f59e0b" : "#22c55e";
  const barGrad = pct < 50
    ? "linear-gradient(90deg, #ef4444, #f87171)"
    : pct < 80
    ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
    : "linear-gradient(90deg, #22c55e, #4ade80)";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const accountFields = [
    { icon: <User className="h-3.5 w-3.5" />, label: "Full Name", value: session?.fullName || "—" },
    { icon: <Mail className="h-3.5 w-3.5" />, label: "Email Address", value: session?.email || "—" },
    { icon: <Shield className="h-3.5 w-3.5" />, label: "Role", value: "Worker" },
  ];

  const actions = [
    { label: "View & Edit Profile", href: "/dashboard/worker/profile", icon: <User className="h-4 w-4" style={{ color: ACCENT }} />, special: false },
    { label: "Manage My CV", href: "/dashboard/worker/cv", icon: <ClipboardList className="h-4 w-4" style={{ color: ACCENT }} />, special: false },
    ...(canBeRated ? [{ label: "Start AI Interview", href: "/dashboard/worker/interview", icon: <Video className="h-4 w-4" style={{ color: ACCENT }} />, special: true }] : []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 1100 }}>

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          borderRadius: 18,
          padding: "2rem 2.5rem",
          minHeight: 168,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #3b0764 0%, #5b21b6 55%, #7c3aed 100%)",
        }}
      >
        <div style={{ position: "absolute", right: -50, top: -50, height: 220, width: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.09), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 100, bottom: -40, height: 160, width: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.06), transparent)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              borderRadius: 999, padding: "0.25rem 0.75rem", marginBottom: "1rem",
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
              backgroundColor: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}>
              <User style={{ width: 11, height: 11 }} />
              Worker
            </div>
            <h2 style={{ color: "#fff", fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "0.375rem" }}>
              Welcome back, {session?.fullName || "Worker"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
              Complete your profile to unlock AI interview and rating.
            </p>
            <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar style={{ width: 13, height: 13, color: "rgba(255,255,255,0.4)" }} />
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{today}</span>
            </div>
          </div>

          {/* Completion pill (desktop) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: "1.5rem" }}>
            <span style={{
              fontSize: "2.5rem", fontWeight: 900, lineHeight: 1,
              color: loading ? "rgba(255,255,255,0.2)" : (canBeRated ? "#4ade80" : "#facc15"),
            }}>
              {loading ? "—" : `${pct}%`}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>
              Complete
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Profile Completion Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ ...CARD_STYLE, padding: "1.5rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: 4 }}>
              Profile Completion
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-foreground)" }}>
              {canBeRated
                ? "You meet the minimum threshold — AI features are available."
                : `Reach 80% to unlock AI rating and interview. (${80 - pct}% remaining)`}
            </p>
          </div>
          {!loading && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              borderRadius: 999, padding: "0.3rem 0.75rem", flexShrink: 0, marginLeft: "1rem",
              fontSize: 11, fontWeight: 700,
              backgroundColor: canBeRated ? "#22c55e18" : "#f59e0b18",
              color: canBeRated ? "#22c55e" : "#f59e0b",
              border: `1px solid ${canBeRated ? "#22c55e35" : "#f59e0b35"}`,
            }}>
              {canBeRated ? <CheckCircle style={{ width: 12, height: 12 }} /> : <AlertTriangle style={{ width: 12, height: 12 }} />}
              {canBeRated ? "AI Unlocked" : `${pct}%`}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: 7, borderRadius: 999, backgroundColor: "var(--color-border)", overflow: "hidden", marginBottom: "1.25rem" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: loading ? "0%" : `${pct}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{
              height: "100%",
              borderRadius: 999,
              background: barGrad,
              boxShadow: `0 0 10px ${barColor}60`,
            }}
          />
        </div>

        {/* Checklist */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 36, borderRadius: 10, backgroundColor: "var(--color-neutral-100)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.5625rem 0.75rem",
                  borderRadius: 10,
                  textDecoration: "none",
                  backgroundColor: item.done ? "#22c55e09" : "transparent",
                  transition: "background-color 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-neutral-50)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = item.done ? "#22c55e09" : "transparent"; }}
              >
                <div style={{
                  height: 18, width: 18, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1.5px solid ${item.done ? "#22c55e" : "var(--color-border)"}`,
                  backgroundColor: item.done ? "#22c55e" : "transparent",
                }}>
                  {item.done && <CheckCircle style={{ width: 10, height: 10, color: "#fff" }} />}
                </div>
                <span style={{ flex: 1, fontSize: "0.8125rem", color: item.done ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: "2px 7px", borderRadius: 999,
                  backgroundColor: item.done ? "#22c55e18" : "var(--color-neutral-100)",
                  color: item.done ? "#22c55e" : "var(--color-muted-foreground)",
                }}>
                  +{item.weight}%
                </span>
                {!item.done && (
                  <ChevronRight style={{ width: 13, height: 13, color: ACCENT, opacity: 0.4, flexShrink: 0 }} />
                )}
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Account Info + Quick Actions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          style={{ ...CARD_STYLE, padding: "1.5rem" }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "1rem" }}>
            Account Info
          </p>
          <div>
            {accountFields.map((field, i) => (
              <div
                key={field.label}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.75rem 0",
                  borderBottom: i < accountFields.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <div style={{ height: 30, width: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: ACCENT_LIGHT, color: ACCENT, flexShrink: 0 }}>
                  {field.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted-foreground)", marginBottom: 2 }}>{field.label}</p>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{field.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ ...CARD_STYLE, padding: "1.5rem" }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "1rem" }}>
            Quick Actions
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.625rem 0.75rem",
                  borderRadius: 10,
                  border: action.special ? `1px solid ${ACCENT}35` : "1px solid var(--color-border)",
                  backgroundColor: action.special ? `${ACCENT}10` : "transparent",
                  textDecoration: "none",
                  transition: "background-color 0.12s, border-color 0.12s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = ACCENT_LIGHT;
                  (e.currentTarget as HTMLElement).style.borderColor = `${ACCENT}40`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = action.special ? `${ACCENT}10` : "transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = action.special ? `${ACCENT}35` : "var(--color-border)";
                }}
              >
                <div style={{ height: 28, width: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: ACCENT_LIGHT, flexShrink: 0 }}>
                  {action.icon}
                </div>
                <span style={{ flex: 1, fontSize: "0.8125rem", fontWeight: action.special ? 600 : 500, color: action.special ? ACCENT : "var(--color-foreground)" }}>
                  {action.label}
                </span>
                {action.special && <Zap style={{ width: 13, height: 13, color: ACCENT, flexShrink: 0 }} />}
                <ChevronRight style={{ width: 14, height: 14, color: ACCENT, opacity: action.special ? 0.7 : 0.4, flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
