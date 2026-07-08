"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Shield, RefreshCw, ClipboardCheck, Landmark,
  MessageSquare, ChevronRight, Calendar, ArrowUpRight, DollarSign,
} from "lucide-react";
import Link from "next/link";
import { authService } from "@/lib/authService";

const ACCENT = "#059669";
const ACCENT_LIGHT = "#ECFDF5";

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 14,
  boxShadow: "var(--shadow-card)",
};

export default function RefundOfficeDashboard() {
  const [session, setSession] = useState<{
    fullName: string;
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const s = authService.getSession();
    if (s) setSession({ fullName: s.fullName, email: s.email, role: s.role });
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const modules = [
    { label: "Refund Claims", desc: "View and process incoming refund claims", href: "/dashboard/refund-office/claims", icon: <RefreshCw className="h-5 w-5" style={{ color: ACCENT }} /> },
    { label: "Refund Actions", desc: "Execute and finalise refund decisions", href: "/dashboard/refund-office/refund-action", icon: <ClipboardCheck className="h-5 w-5" style={{ color: ACCENT }} /> },
    { label: "System Account", desc: "Manage financial system accounts", href: "/dashboard/refund-office/system-account", icon: <Landmark className="h-5 w-5" style={{ color: ACCENT }} /> },
  ];

  const actions = [
    { label: "View & Edit Profile", href: "/dashboard/refund-office/profile", icon: <User className="h-4 w-4" style={{ color: ACCENT }} /> },
    { label: "Messaging", href: "/dashboard/refund-office/messaging", icon: <MessageSquare className="h-4 w-4" style={{ color: ACCENT }} /> },
  ];

  const accountFields = [
    { icon: <User className="h-3.5 w-3.5" />, label: "Full Name", value: session?.fullName || "—" },
    { icon: <Mail className="h-3.5 w-3.5" />, label: "Email Address", value: session?.email || "—" },
    { icon: <Shield className="h-3.5 w-3.5" />, label: "Role", value: "Refund Office" },
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
          background: "linear-gradient(135deg, #022c22 0%, #065f46 55%, #059669 100%)",
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
            <DollarSign style={{ width: 11, height: 11 }} />
            Refund Office
          </div>

          <h2 style={{ color: "#fff", fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "0.375rem" }}>
            Welcome back, {session?.fullName || "Staff"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
            Process refund claims and manage financial operations.
          </p>
          <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar style={{ width: 13, height: 13, color: "rgba(255,255,255,0.4)" }} />
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{today}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Modules ── */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--color-muted-foreground)", marginBottom: "0.75rem" }}>
          Modules
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {modules.map((mod, i) => (
            <motion.div
              key={mod.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.07 }}
            >
              <Link
                href={mod.href}
                style={{ ...CARD_STYLE, display: "block", padding: "1.25rem", textDecoration: "none", transition: "box-shadow 0.2s, border-color 0.2s" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-elevated)";
                  (e.currentTarget as HTMLElement).style.borderColor = `${ACCENT}45`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ height: 40, width: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: ACCENT_LIGHT, flexShrink: 0 }}>
                    {mod.icon}
                  </div>
                  <ArrowUpRight style={{ width: 15, height: 15, color: ACCENT, opacity: 0.35, flexShrink: 0 }} />
                </div>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-foreground)", marginBottom: "0.25rem" }}>{mod.label}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-muted-foreground)" }}>{mod.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Account Info + Quick Actions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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
          transition={{ delay: 0.31 }}
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
                  {action.icon}
                </div>
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
