"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { Link } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { authService } from "@/lib/authService";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const ACCENT = "#2563EB";

function inputStyle(hasError: boolean, extraPadding?: string): React.CSSProperties {
  return { width: "100%", border: `1.5px solid ${hasError ? "#ef4444" : "var(--color-border)"}`, borderRadius: 10, padding: extraPadding ?? "0.65rem 0.875rem 0.65rem 2.5rem", fontSize: "0.875rem", backgroundColor: "var(--color-background)", color: "var(--color-foreground)", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s" };
}

function onFocusInput(e: React.FocusEvent<HTMLInputElement>, hasError: boolean) {
  e.currentTarget.style.borderColor = hasError ? "#ef4444" : ACCENT;
  e.currentTarget.style.boxShadow = hasError ? "0 0 0 3px rgba(239,68,68,0.10)" : "0 0 0 3px rgba(37,99,235,0.10)";
}

function onBlurInput(e: React.FocusEvent<HTMLInputElement>, hasError: boolean) {
  e.currentTarget.style.borderColor = hasError ? "#ef4444" : "var(--color-border)";
  e.currentTarget.style.boxShadow = "none";
}

export default function ResetPasswordPage() {
  const t = useTranslations("ResetPassword");
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const schema = z.object({
    newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Must contain an uppercase letter").regex(/[a-z]/, "Must contain a lowercase letter").regex(/[0-9]/, "Must contain a number").regex(/[@$!%*?&]/, "Must contain a special character"),
    confirmPassword: z.string(),
  }).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

  type FormData = z.infer<typeof schema>;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    fetch("/api/homepage").then((r) => r.json()).then((d) => setVideoUrl(d?.hero?.videoUrl || "")).catch(() => {});
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, data.newPassword);
      setDone(true);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Something went wrong.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const LeftPanel = () => (
    <div className="auth-left" style={{ width: "50%", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflow: "hidden", background: "linear-gradient(160deg, #0F172A 0%, #1A253D 100%)", flexDirection: "column", justifyContent: "space-between", padding: "2.5rem" }}>
      {videoUrl && <video autoPlay muted loop playsInline src={videoUrl} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,18,38,0.55) 0%, rgba(10,18,38,0.70) 60%, rgba(10,18,38,0.88) 100%)", zIndex: 1 }} />
      <div style={{ position: "relative", zIndex: 3 }}>
        <div style={{ marginBottom: "3.5rem" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: "1.125rem" }}>SSFRS</div>
          <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, marginTop: 3 }}>{tAuth("brandTagline")}</div>
        </div>
        <h2 style={{ color: "#fff", fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.25, marginBottom: "0.875rem" }}>{tAuth("brandSlogan")}</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.75 }}>{tAuth("brandDesc")}</p>
      </div>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", position: "relative", zIndex: 3 }}>© 2026 SSFRS · All rights reserved</p>
    </div>
  );

  if (!token) {
    return (
      <>
        <style>{`.auth-left{display:none;} @media(min-width:768px){.auth-left{display:flex;}}`}</style>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <LeftPanel />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2.5rem 1.5rem", backgroundColor: "var(--color-neutral-50)" }}>
            <div style={{ maxWidth: 420, width: "100%", backgroundColor: "var(--color-card)", borderRadius: 18, padding: "2.5rem", boxShadow: "var(--shadow-elevated)", border: "1px solid var(--color-border)", textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted-foreground)" }}>
                Invalid or missing reset token.{" "}
                <Link href="/forgot-password" style={{ color: ACCENT, fontWeight: 700, textDecoration: "none" }}>Request a new link</Link>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`.auth-left{display:none;} .auth-mobile-logo{display:flex;} @media(min-width:768px){.auth-left{display:flex;} .auth-mobile-logo{display:none;}} @keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <LeftPanel />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2.5rem 1.5rem", backgroundColor: "var(--color-neutral-50)" }}>
          <div className="auth-mobile-logo" style={{ alignItems: "center", marginBottom: "1.75rem" }}>
            <span style={{ color: "var(--color-foreground)", fontWeight: 800, fontSize: "1.125rem" }}>SSFRS</span>
          </div>
          <div style={{ position: "absolute", top: "1rem", right: "1rem" }}><LanguageSwitcher variant="light" /></div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
            style={{ width: "100%", maxWidth: 420, backgroundColor: "var(--color-card)", borderRadius: 18, padding: "2.5rem", boxShadow: "var(--shadow-elevated)", border: "1px solid var(--color-border)" }}>
            {done ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
                style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div style={{ height: 56, width: 56, borderRadius: "50%", background: "linear-gradient(135deg, #DCFCE7, #BBF7D0)", border: "1.5px solid #86EFAC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle style={{ width: 26, height: 26, color: "#22c55e" }} />
                </div>
                <div>
                  <h3 style={{ color: "var(--color-foreground)", fontWeight: 800, marginBottom: "0.375rem" }}>Password updated</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-muted-foreground)", lineHeight: 1.65 }}>Your password has been reset. You can now sign in.</p>
                </div>
                <button onClick={() => router.push("/login")} style={{ width: "100%", padding: "0.72rem 1rem", borderRadius: 10, marginTop: "0.5rem", background: "linear-gradient(135deg, #1E293B 0%, #334155 100%)", color: "#fff", fontWeight: 700, fontSize: "0.875rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  {t("backToSignIn")}
                </button>
              </motion.div>
            ) : (
              <>
                <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-muted-foreground)", textDecoration: "none", marginBottom: "1.75rem" }}>
                  <ArrowLeft style={{ width: 14, height: 14 }} />{t("backToSignIn")}
                </Link>
                <div style={{ marginBottom: "2rem" }}>
                  <h3 style={{ color: "var(--color-foreground)", fontWeight: 800, marginBottom: "0.375rem" }}>{t("title")}</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-muted-foreground)", lineHeight: 1.6 }}>{t("subtitle")}</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-foreground)" }}>{t("newPasswordLabel")}</label>
                    <div style={{ position: "relative" }}>
                      <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--color-neutral-400)", pointerEvents: "none" }} />
                      <input type={showPassword ? "text" : "password"} {...register("newPassword")} placeholder="••••••••" style={inputStyle(!!errors.newPassword, "0.65rem 2.5rem 0.65rem 2.5rem")} onFocus={(e) => onFocusInput(e, !!errors.newPassword)} onBlur={(e) => onBlurInput(e, !!errors.newPassword)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-neutral-400)", display: "flex" }}>
                        {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                      </button>
                    </div>
                    {errors.newPassword && <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>{errors.newPassword.message}</p>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-foreground)" }}>{t("confirmPasswordLabel")}</label>
                    <div style={{ position: "relative" }}>
                      <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--color-neutral-400)", pointerEvents: "none" }} />
                      <input type={showConfirm ? "text" : "password"} {...register("confirmPassword")} placeholder="••••••••" style={inputStyle(!!errors.confirmPassword, "0.65rem 2.5rem 0.65rem 2.5rem")} onFocus={(e) => onFocusInput(e, !!errors.confirmPassword)} onBlur={(e) => onBlurInput(e, !!errors.confirmPassword)} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-neutral-400)", display: "flex" }}>
                        {showConfirm ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>{errors.confirmPassword.message}</p>}
                  </div>
                  <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.72rem 1rem", borderRadius: 10, marginTop: "0.25rem", background: loading ? "var(--color-neutral-300)" : "linear-gradient(135deg, #1E293B 0%, #334155 100%)", color: "#fff", fontWeight: 700, fontSize: "0.875rem", border: "none", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "opacity 0.15s" }}>
                    {loading ? (
                      <><span style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />{t("resetting")}</>
                    ) : t("resetPassword")}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
