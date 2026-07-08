"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, Sun, Moon, X, CheckCheck } from "lucide-react";
import { authService } from "@/lib/authService";
import { userService } from "@/lib/userService";
import { notificationService, type NotificationItem } from "@/lib/notificationService";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface HeaderProps {
  onMenuClick: () => void;
}

function getRoleLabel(role: string, t: (key: string) => string): string {
  switch (role) {
    case "PROVIDER":      return t("roleProvider");
    case "WORKER":        return t("roleWorker");
    case "EVALUATOR":     return t("roleEvaluator");
    case "REFUND_OFFICE": return t("roleRefundOffice");
    case "ADMIN":         return t("roleAdmin");
    default:              return role;
  }
}

export default function Header({ onMenuClick }: HeaderProps) {
  const t = useTranslations("Header");
  const router = useRouter();

  const [session, setSession] = useState<{
    fullName: string;
    role: string;
    profileImageUrl: string | null;
  } | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      const s = authService.getSession();
      if (!s) return;
      setSession({ fullName: s.fullName, role: s.role, profileImageUrl: s.profileImageUrl ?? null });
      setImgError(false);
      if (!s.profileImageUrl) {
        try {
          const user = await userService.getUser(s.userId);
          if (user.profileImageUrl) {
            authService.updateSessionImage(user.profileImageUrl);
            setSession((prev) => prev ? { ...prev, profileImageUrl: user.profileImageUrl } : prev);
          }
        } catch {}
      }
    };
    load();

    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      setDarkMode(true);
    }

    const handleImageUpdate = (e: Event) => {
      const url = (e as CustomEvent<string>).detail ?? null;
      setSession((prev) => (prev ? { ...prev, profileImageUrl: url } : prev));
      setImgError(false);
    };
    window.addEventListener("profileImageUpdated", handleImageUpdate);
    return () => window.removeEventListener("profileImageUpdated", handleImageUpdate);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 15_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openDropdown = async () => {
    setDropdownOpen((prev) => !prev);
    if (!dropdownOpen) {
      setLoadingNotifs(true);
      try {
        const list = await notificationService.getMyNotifications();
        setNotifications(list);
      } catch {}
      finally { setLoadingNotifs(false); }
    }
  };

  const handleNotifClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await notificationService.markRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    const link = notificationService.getLinkForNotification(notif);
    setDropdownOpen(false);
    if (link !== "#") router.push(link);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
    window.dispatchEvent(new Event("themechange"));
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return t("justNow");
    if (mins < 60) return t("minutesAgo", { mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return t("hoursAgo", { hrs });
    return d.toLocaleDateString();
  };

  const initial = session?.fullName?.charAt(0).toUpperCase() || "U";
  const accent = "#5B4FE5";
  const roleLabel = session?.role ? getRoleLabel(session.role, t) : "";

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.25rem",
        height: 56,
        flexShrink: 0,
        backgroundColor: "var(--color-card)",
        borderBottom: "1px solid var(--color-border)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
      }}
    >
      {/* Mobile menu button */}
      <button
        className="md:hidden"
        onClick={onMenuClick}
        style={{
          height: 36,
          width: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "var(--color-foreground)",
        }}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Right side controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginLeft: "auto" }}>
        {/* Language switcher */}
        <LanguageSwitcher variant="light" />

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          style={{
            height: 34,
            width: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: "var(--color-muted)",
            cursor: "pointer",
            color: "var(--color-foreground)",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-neutral-400)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={openDropdown}
            style={{
              height: 34,
              width: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-muted)",
              cursor: "pointer",
              color: "var(--color-foreground)",
              position: "relative",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-neutral-400)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  minWidth: 16,
                  height: 16,
                  padding: "0 3px",
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#fff",
                  backgroundColor: "#ef4444",
                  border: "1.5px solid var(--color-card)",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 340,
                borderRadius: 14,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
                zIndex: 50,
                overflow: "hidden",
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.875rem 1rem",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Bell className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-foreground)" }}>
                    {t("notifications")}
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 999,
                        backgroundColor: "#ef444418",
                        color: "#ef4444",
                        border: "1px solid #ef444430",
                      }}
                    >
                      {unreadCount} {t("new")}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        fontSize: 11,
                        fontWeight: 600,
                        color: accent,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 6px",
                        borderRadius: 6,
                      }}
                    >
                      <CheckCheck className="h-3 w-3" />
                      {t("markAllRead")}
                    </button>
                  )}
                  <button
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      height: 24,
                      width: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 6,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-muted-foreground)",
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {loadingNotifs ? (
                  <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
                    <div style={{
                      width: 24, height: 24, margin: "0 auto 8px",
                      border: `2px solid ${accent}30`,
                      borderTopColor: accent,
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }} />
                    <p style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>{t("loading")}</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
                    <Bell className="h-8 w-8" style={{ color: "var(--color-border)", margin: "0 auto 8px" }} />
                    <p style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>{t("noNotifications")}</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "0.75rem 1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                        backgroundColor: notif.read ? "transparent" : `${accent}08`,
                        border: "none",
                        borderBottom: "1px solid var(--color-border)",
                        cursor: "pointer",
                        transition: "background-color 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-muted)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = notif.read ? "transparent" : `${accent}08`)}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-foreground)", lineHeight: 1.4, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          {notif.title}
                          {!notif.read && (
                            <span style={{ display: "inline-block", height: 6, width: 6, borderRadius: "50%", backgroundColor: accent, flexShrink: 0 }} />
                          )}
                        </span>
                        <span style={{ fontSize: 10, flexShrink: 0, color: "var(--color-muted-foreground)", marginTop: 1 }}>
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, lineHeight: 1.5, color: "var(--color-muted-foreground)" }}>
                        {notif.message}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, backgroundColor: "var(--color-border)", margin: "0 0.25rem" }} />

        {/* Avatar */}
        <div
          style={{
            height: 32,
            width: 32,
            borderRadius: "50%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: `1.5px solid ${accent}50`,
            backgroundColor: `${accent}15`,
          }}
        >
          {session?.profileImageUrl && !imgError ? (
            <img
              src={session.profileImageUrl}
              alt=""
              style={{ height: "100%", width: "100%", objectFit: "cover" }}
              onError={() => setImgError(true)}
            />
          ) : (
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: accent, userSelect: "none" }}>
              {initial}
            </span>
          )}
        </div>

        {/* Name + role badge */}
        <div className="hidden md:flex flex-col items-end" style={{ gap: "0.1rem" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-foreground)", lineHeight: 1.2 }}>
            {session?.fullName || "User"}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "1px 6px",
              borderRadius: 999,
              backgroundColor: `${accent}15`,
              color: accent,
              lineHeight: 1.6,
            }}
          >
            {roleLabel}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}
