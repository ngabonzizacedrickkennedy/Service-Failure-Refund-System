"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, UserCheck, Lock, Calendar, ShieldAlert, ChevronRight,
  UserPlus, ScrollText, ShieldCheck, Briefcase,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { authService } from "@/lib/authService";

const ACCENT = "#D97706";
const ACCENT_LIGHT = "#FFFBEB";

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 14,
  boxShadow: "var(--shadow-card)",
};

interface User {
  id: string;
  active: boolean;
  locked: boolean;
}

export default function AdminOverviewPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ fullName: string } | null>(null);

  useEffect(() => {
    const s = authService.getSession();
    if (s) setSession({ fullName: s.fullName });
    api
      .get<User[]>("/api/admin/users")
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, []);

  const total = users.length;
  const active = users.filter((u) => u.active && !u.locked).length;
  const locked = users.filter((u) => u.locked).length;
  const inactive = total - active - locked;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const stats = [
    {
      label: "Total Users",
      value: loading ? "—" : total,
      sub: "Registered accounts",
      icon: <Users className="h-5 w-5" />,
      iconColor: "#3B82F6",
      iconBg: "#EFF6FF",
    },
    {
      label: "Active Users",
      value: loading ? "—" : active,
      sub: "Can currently log in",
      icon: <UserCheck className="h-5 w-5" />,
      iconColor: "#22c55e",
      iconBg: "#f0fdf4",
    },
    {
      label: "Locked Accounts",
      value: loading ? "—" : locked,
      sub: "Failed login lockout",
      icon: <Lock className="h-5 w-5" />,
      iconColor: "#ef4444",
      iconBg: "#fef2f2",
    },
  ];

  const quickLinks = [
    { label: "Manage All Users", href: "/dashboard/admin/users", icon: <Users className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: "Create New Account", href: "/dashboard/admin/users/create", icon: <UserPlus className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: "Workers Monitor", href: "/dashboard/admin/workers-monitor", icon: <ShieldAlert className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: "Contract Validation", href: "/dashboard/admin/contracts", icon: <ShieldCheck className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: "Projects", href: "/dashboard/admin/projects", icon: <Briefcase className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: "Audit Log", href: "/dashboard/admin/audit-log", icon: <ScrollText className="h-4 w-4" style={{ color: ACCENT }} /> },
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
          background: "linear-gradient(135deg, #451a03 0%, #92400e 55%, #d97706 100%)",
        }}
      >
        <div style={{ position: "absolute", right: -50, top: -50, height: 220, width: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.09), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 100, bottom: -40, height: 160, width: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.06), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: -30, bottom: -30, height: 120, width: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.04), transparent)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            borderRadius: 999, padding: "0.25rem 0.75rem", marginBottom: "1rem",
            fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
            backgroundColor: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}>
            <ShieldAlert style={{ width: 11, height: 11 }} />
            Administrator
          </div>

          <h2 style={{ color: "#fff", fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "0.375rem" }}>
            {session?.fullName ? `Welcome back, ${session.fullName}` : "Admin Overview"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
            Monitor users, manage projects, and maintain platform health.
          </p>
          <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar style={{ width: 13, height: 13, color: "rgba(255,255,255,0.4)" }} />
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{today}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "0.75rem" }}>
          Platform Statistics
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.07 }}
              style={{ ...CARD_STYLE, padding: "1.25rem" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                <div style={{ height: 40, width: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: s.iconBg, color: s.iconColor, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: "2.25rem", fontWeight: 900, color: s.iconColor, lineHeight: 1 }}>
                  {s.value}
                </span>
              </div>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-foreground)", marginBottom: "0.2rem" }}>{s.label}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)" }}>{s.sub}</p>

              {/* Mini bar */}
              {!loading && total > 0 && (
                <div style={{ marginTop: "0.875rem", height: 4, borderRadius: 999, backgroundColor: "var(--color-border)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((Number(s.value) / total) * 100)}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 + i * 0.07 }}
                    style={{ height: "100%", borderRadius: 999, backgroundColor: s.iconColor }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        style={{ ...CARD_STYLE, padding: "1.5rem" }}
      >
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "1rem" }}>
          Quick Actions
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.5rem" }}>
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.625rem 0.75rem",
                borderRadius: 10,
                border: "1px solid var(--color-border)",
                textDecoration: "none",
                transition: "background-color 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = ACCENT_LIGHT;
                (e.currentTarget as HTMLElement).style.borderColor = `${ACCENT}35`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
              }}
            >
              <div style={{ height: 28, width: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: ACCENT_LIGHT, flexShrink: 0 }}>
                {link.icon}
              </div>
              <span style={{ flex: 1, fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-foreground)" }}>{link.label}</span>
              <ChevronRight style={{ width: 14, height: 14, color: ACCENT, opacity: 0.4, flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
