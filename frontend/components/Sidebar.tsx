"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "@/navigation";
import {
  Home,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Briefcase,
  FileText,
  ClipboardList,
  AlertCircle,
  Video,
  Clock,
  MessageSquare,
  FileSignature,
  GraduationCap,
  Award,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  ClipboardCheck,
  RefreshCw,
  ScrollText,
  Scale,
  Landmark,
  Globe,
  LayoutDashboard,
} from "lucide-react";
import { authService } from "@/lib/authService";
import { useTranslations } from "next-intl";
import { Link as LocaleLink, useRouter as useLocaleRouter } from "@/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function getNavItems(role: string, t: (key: string) => string): NavItem[] {
  switch (role) {
    case "PROVIDER":
      return [
        { label: t("dashboard"), href: "/dashboard/provider", icon: <Home className="h-4 w-4 flex-shrink-0" /> },
        { label: t("myProfile"), href: "/dashboard/provider/profile", icon: <User className="h-4 w-4 flex-shrink-0" /> },
        { label: t("myProjects"), href: "/dashboard/provider/projects", icon: <Briefcase className="h-4 w-4 flex-shrink-0" /> },
        { label: t("viewAlumni"), href: "/dashboard/provider/alumni", icon: <GraduationCap className="h-4 w-4 flex-shrink-0" /> },
        { label: t("myClaims"), href: "/dashboard/provider/claims", icon: <FileText className="h-4 w-4 flex-shrink-0" /> },
        { label: t("messages"), href: "/dashboard/provider/messages", icon: <MessageSquare className="h-4 w-4 flex-shrink-0" /> },
        { label: t("contract"), href: "/dashboard/provider/contract", icon: <FileSignature className="h-4 w-4 flex-shrink-0" /> },
        { label: t("account"), href: "/dashboard/provider/account", icon: <Wallet className="h-4 w-4 flex-shrink-0" /> },
        { label: t("publicHome"), href: "/", icon: <Globe className="h-4 w-4 flex-shrink-0" /> },
      ];
    case "WORKER":
      return [
        { label: t("dashboard"), href: "/dashboard/worker", icon: <Home className="h-4 w-4 flex-shrink-0" /> },
        { label: t("myProfile"), href: "/dashboard/worker/profile", icon: <User className="h-4 w-4 flex-shrink-0" /> },
        { label: t("myCV"), href: "/dashboard/worker/cv", icon: <ClipboardList className="h-4 w-4 flex-shrink-0" /> },
        { label: t("interview"), href: "/dashboard/worker/interview", icon: <Video className="h-4 w-4 flex-shrink-0" /> },
        { label: t("pendingProjects"), href: "/dashboard/worker/pending-projects", icon: <Clock className="h-4 w-4 flex-shrink-0" /> },
        { label: t("assignedProjects"), href: "/dashboard/worker/projects", icon: <Briefcase className="h-4 w-4 flex-shrink-0" /> },
        { label: t("claimsAgainstMe"), href: "/dashboard/worker/claims", icon: <AlertCircle className="h-4 w-4 flex-shrink-0" /> },
        { label: t("messages"), href: "/dashboard/worker/messages", icon: <MessageSquare className="h-4 w-4 flex-shrink-0" /> },
        { label: t("contract"), href: "/dashboard/worker/contract", icon: <FileSignature className="h-4 w-4 flex-shrink-0" /> },
        { label: t("account"), href: "/dashboard/worker/account", icon: <Wallet className="h-4 w-4 flex-shrink-0" /> },
        { label: t("publicHome"), href: "/", icon: <Globe className="h-4 w-4 flex-shrink-0" /> },
      ];
    case "EVALUATOR":
      return [
        { label: t("dashboard"), href: "/dashboard/evaluator", icon: <Home className="h-4 w-4 flex-shrink-0" /> },
        { label: t("myProfile"), href: "/dashboard/evaluator/profile", icon: <User className="h-4 w-4 flex-shrink-0" /> },
        { label: t("submittedClaims"), href: "/dashboard/evaluator/claims", icon: <ClipboardCheck className="h-4 w-4 flex-shrink-0" /> },
        { label: t("justifications"), href: "/dashboard/evaluator/justifications", icon: <Scale className="h-4 w-4 flex-shrink-0" /> },
        { label: t("claimMonitor"), href: "/dashboard/evaluator/claim-monitor", icon: <ShieldCheck className="h-4 w-4 flex-shrink-0" /> },
        { label: t("messaging"), href: "/dashboard/evaluator/messaging", icon: <MessageSquare className="h-4 w-4 flex-shrink-0" /> },
        { label: t("publicHome"), href: "/", icon: <Globe className="h-4 w-4 flex-shrink-0" /> },
      ];
    case "REFUND_OFFICE":
      return [
        { label: t("dashboard"), href: "/dashboard/refund-office", icon: <Home className="h-4 w-4 flex-shrink-0" /> },
        { label: t("myProfile"), href: "/dashboard/refund-office/profile", icon: <User className="h-4 w-4 flex-shrink-0" /> },
        { label: t("refundClaims"), href: "/dashboard/refund-office/claims", icon: <RefreshCw className="h-4 w-4 flex-shrink-0" /> },
        { label: t("refundAction"), href: "/dashboard/refund-office/refund-action", icon: <ClipboardCheck className="h-4 w-4 flex-shrink-0" /> },
        { label: t("systemAccount"), href: "/dashboard/refund-office/system-account", icon: <Landmark className="h-4 w-4 flex-shrink-0" /> },
        { label: t("messaging"), href: "/dashboard/refund-office/messaging", icon: <MessageSquare className="h-4 w-4 flex-shrink-0" /> },
        { label: t("publicHome"), href: "/", icon: <Globe className="h-4 w-4 flex-shrink-0" /> },
      ];
    case "ADMIN":
      return [
        { label: t("dashboard"), href: "/dashboard/admin", icon: <Home className="h-4 w-4 flex-shrink-0" /> },
        { label: t("homeController"), href: "/dashboard/admin/home-controller", icon: <LayoutDashboard className="h-4 w-4 flex-shrink-0" /> },
        { label: t("userManagement"), href: "/dashboard/admin/users", icon: <Users className="h-4 w-4 flex-shrink-0" /> },
        { label: t("projects"), href: "/dashboard/admin/projects", icon: <Briefcase className="h-4 w-4 flex-shrink-0" /> },
        { label: t("systemAlumni"), href: "/dashboard/admin/alumni", icon: <Award className="h-4 w-4 flex-shrink-0" /> },
        { label: t("workersMonitor"), href: "/dashboard/admin/workers-monitor", icon: <ShieldAlert className="h-4 w-4 flex-shrink-0" /> },
        { label: t("contractValidation"), href: "/dashboard/admin/contracts", icon: <ShieldCheck className="h-4 w-4 flex-shrink-0" /> },
        { label: t("auditLog"), href: "/dashboard/admin/audit-log", icon: <ScrollText className="h-4 w-4 flex-shrink-0" /> },
        { label: t("messaging"), href: "/dashboard/admin/messaging", icon: <MessageSquare className="h-4 w-4 flex-shrink-0" /> },
        { label: t("publicHome"), href: "/", icon: <Globe className="h-4 w-4 flex-shrink-0" /> },
      ];
    default:
      return [];
  }
}

const ROOT_HREFS = [
  "/",
  "/dashboard/worker",
  "/dashboard/provider",
  "/dashboard/admin",
  "/dashboard/evaluator",
  "/dashboard/refund-office",
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const router = useLocaleRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState<{
    fullName: string;
    role: string;
    profileImageUrl: string | null;
  } | null>(null);
  const [sidebarImgError, setSidebarImgError] = useState(false);

  useEffect(() => {
    const load = () => {
      const s = authService.getSession();
      if (s) {
        setSession({ fullName: s.fullName, role: s.role, profileImageUrl: s.profileImageUrl ?? null });
        setSidebarImgError(false);
      }
    };
    load();

    const handleImageUpdate = (e: Event) => {
      const url = (e as CustomEvent<string>).detail ?? null;
      setSession((prev) => prev ? { ...prev, profileImageUrl: url } : prev);
      setSidebarImgError(false);
    };

    window.addEventListener("profileImageUpdated", handleImageUpdate);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("profileImageUpdated", handleImageUpdate);
      window.removeEventListener("resize", check);
    };
  }, []);

  const textPrimary = "var(--color-foreground)";
  const textSecondary = "var(--color-muted-foreground)";
  const textHover = "var(--color-foreground)";
  const textFaint = "color-mix(in srgb, var(--color-muted-foreground) 80%, transparent)";
  const textFaintest = "color-mix(in srgb, var(--color-muted-foreground) 55%, transparent)";
  const borderColor = "var(--color-border)";
  const hoverBg = "var(--color-muted)";
  const activeBg = "color-mix(in srgb, var(--color-primary-500) 12%, var(--color-muted))";
  const cardBg = "var(--color-muted)";
  const iconBtnBg = "var(--color-muted)";
  const iconBtnBgHover = "var(--color-border)";
  const iconBtnBorder = "var(--color-border)";
  const iconBtnColor = "var(--color-muted-foreground)";
  const logoutColor = "var(--color-muted-foreground)";

  const accentColor = "#5B4FE5";

  const roleLabel = useMemo(() => {
    switch (session?.role) {
      case "PROVIDER":     return t("roleProvider");
      case "WORKER":       return t("roleWorker");
      case "ADMIN":        return t("roleAdmin");
      case "EVALUATOR":    return t("roleEvaluator");
      case "REFUND_OFFICE":return t("roleRefundOffice");
      default:             return session?.role || "";
    }
  }, [session?.role, t]);

  const navItems = getNavItems(session?.role || "", t);
  const initial = session?.fullName?.charAt(0).toUpperCase() || "U";
  const handleLogout = () => { authService.logout(); router.push("/login"); };

  return (
    <>
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          style={{ backdropFilter: "blur(2px)" }}
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className="fixed md:relative z-40 flex flex-col h-screen overflow-hidden"
        style={{
          background: "var(--color-card)",
          borderRight: `1px solid ${borderColor}`,
          width: collapsed ? 64 : 256,
          minWidth: collapsed ? 64 : 256,
          transform: isMobile && collapsed ? "translateX(-256px)" : "translateX(0)",
          transition: "width 0.22s ease-in-out, min-width 0.22s ease-in-out, transform 0.22s ease-in-out",
        }}
      >
        {/* ── Logo ── */}
        <div
          style={{
            borderBottom: `1px solid ${borderColor}`,
            padding: "0.875rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            flexShrink: 0,
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          <div
            style={{
              minWidth: 0,
              opacity: collapsed ? 0 : 1,
              transition: "opacity 0.15s",
              overflow: "hidden",
              width: collapsed ? 0 : "auto",
              pointerEvents: collapsed ? "none" : "auto",
            }}
          >
            <div style={{ color: textPrimary, fontWeight: 800, fontSize: "0.875rem", lineHeight: 1.2, letterSpacing: "-0.01em" }}>SSFRS</div>
            <div style={{ color: textFaint, fontSize: 10, lineHeight: 1.2, marginTop: 2 }}>
              {t("refundSystem")}
            </div>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              height: 26,
              width: 26,
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: iconBtnColor,
              background: iconBtnBg,
              border: `1px solid ${iconBtnBorder}`,
              cursor: "pointer",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = textPrimary;
              (e.currentTarget as HTMLElement).style.background = iconBtnBgHover;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = iconBtnColor;
              (e.currentTarget as HTMLElement).style.background = iconBtnBg;
            }}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: "0.625rem 0.4rem 0.4rem" }}>
          {!collapsed && (
            <p
              style={{
                paddingLeft: "0.625rem",
                marginBottom: "0.3rem",
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: textFaintest,
              }}
            >
              {t("menu")}
            </p>
          )}
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.0625rem" }}>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (!ROOT_HREFS.includes(item.href) && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <LocaleLink
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      borderRadius: 8,
                      padding: "0.375rem 0.625rem",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      textDecoration: "none",
                      position: "relative",
                      transition: "background-color 0.12s, color 0.12s",
                      backgroundColor: isActive ? activeBg : "transparent",
                      color: isActive ? textPrimary : textSecondary,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = hoverBg;
                        e.currentTarget.style.color = textHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = textSecondary;
                      }
                    }}
                  >
                    {/* Active left indicator */}
                    {isActive && (
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          height: "60%",
                          width: 3,
                          borderRadius: "0 3px 3px 0",
                          backgroundColor: accentColor,
                        }}
                      />
                    )}
                    <span
                      style={{
                        color: isActive ? accentColor : "inherit",
                        marginLeft: collapsed ? "auto" : 0,
                        marginRight: collapsed ? "auto" : "0.625rem",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {item.icon}
                    </span>
                    <span
                      style={{
                        opacity: collapsed ? 0 : 1,
                        transition: "opacity 0.15s",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        maxWidth: collapsed ? 0 : 200,
                      }}
                    >
                      {item.label}
                    </span>
                  </LocaleLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── User ── */}
        <div
          style={{
            flexShrink: 0,
            padding: "0.75rem",
            borderTop: `1px solid ${borderColor}`,
          }}
        >
          {collapsed ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1.5px solid ${accentColor}60`,
                  backgroundColor: `${accentColor}20`,
                  flexShrink: 0,
                }}
              >
                {session?.profileImageUrl && !sidebarImgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.profileImageUrl}
                    alt=""
                    style={{ height: "100%", width: "100%", objectFit: "cover" }}
                    onError={() => setSidebarImgError(true)}
                  />
                ) : (
                  <span style={{ color: accentColor, fontWeight: 700, fontSize: 12, userSelect: "none" }}>{initial}</span>
                )}
              </div>
              <button
                onClick={handleLogout}
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
                  color: logoutColor,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = logoutColor)}
                title={t("logOut")}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.5rem 0.625rem",
                borderRadius: 12,
                backgroundColor: cardBg,
              }}
            >
              <div
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1.5px solid ${accentColor}55`,
                  backgroundColor: `${accentColor}18`,
                  flexShrink: 0,
                }}
              >
                {session?.profileImageUrl && !sidebarImgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.profileImageUrl}
                    alt=""
                    style={{ height: "100%", width: "100%", objectFit: "cover" }}
                    onError={() => setSidebarImgError(true)}
                  />
                ) : (
                  <span style={{ color: accentColor, fontWeight: 700, fontSize: 12, userSelect: "none" }}>{initial}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: textPrimary, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session?.fullName || "User"}
                </p>
                <p style={{ fontSize: 10, fontWeight: 500, color: accentColor, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {roleLabel}
                </p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  height: 28,
                  width: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  flexShrink: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: logoutColor,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = logoutColor)}
                title={t("logOut")}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
