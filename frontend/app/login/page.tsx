"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/authService";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

const ACCENT = "#2563EB";

function inputStyle(hasError: boolean, extraPadding?: string): React.CSSProperties {
  return {
    width: "100%",
    border: `1.5px solid ${hasError ? "#ef4444" : "var(--color-border)"}`,
    borderRadius: 10,
    padding: extraPadding ?? "0.65rem 0.875rem 0.65rem 2.5rem",
    fontSize: "0.875rem",
    backgroundColor: "var(--color-background)",
    color: "var(--color-foreground)",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };
}

function onFocusInput(e: React.FocusEvent<HTMLInputElement>, hasError: boolean) {
  e.currentTarget.style.borderColor = hasError ? "#ef4444" : ACCENT;
  e.currentTarget.style.boxShadow = hasError
    ? "0 0 0 3px rgba(239,68,68,0.10)"
    : "0 0 0 3px rgba(37,99,235,0.10)";
}

function onBlurInput(e: React.FocusEvent<HTMLInputElement>, hasError: boolean) {
  e.currentTarget.style.borderColor = hasError ? "#ef4444" : "var(--color-border)";
  e.currentTarget.style.boxShadow = "none";
}


export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"login" | "otp">("login");
  const [pendingEmail, setPendingEmail] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((d) => setVideoUrl(d?.hero?.videoUrl || ""))
      .catch(() => {});
  }, []);

  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  const otpForm = useForm<OtpFormData>({ resolver: zodResolver(otpSchema) });

  const onLoginSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      if (res.requiresOtp) {
        setPendingEmail(data.email);
        setStep("otp");
        toast.info("A verification code has been sent to your email.");
      } else {
        authService.saveSession(res);
        toast.success("Welcome back, " + res.fullName);
        router.push(authService.getDashboardPath(res.role));
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid email or password.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    setLoading(true);
    try {
      const res = await authService.verifyOtp(pendingEmail, data.otp);
      authService.saveSession(res);
      toast.success("Welcome back, " + res.fullName);
      router.push(authService.getDashboardPath(res.role));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid or expired code.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const emailErr = !!loginForm.formState.errors.email;
  const passwordErr = !!loginForm.formState.errors.password;
  const otpErr = !!otpForm.formState.errors.otp;

  return (
    <>
      <style>{`
        .auth-left { display: none; }
        .auth-mobile-logo { display: flex; }
        @media (min-width: 768px) {
          .auth-left { display: flex; }
          .auth-mobile-logo { display: none; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* ── Left branding panel ── */}
        <div
          className="auth-left"
          style={{
            width: "50%",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",
            background: "linear-gradient(160deg, #0F172A 0%, #1A253D 100%)",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "2.5rem",
          }}
        >
          {/* Video background */}
          {videoUrl && (
            <video autoPlay muted loop playsInline src={videoUrl}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
          )}
          {/* Dark overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,18,38,0.55) 0%, rgba(10,18,38,0.70) 60%, rgba(10,18,38,0.88) 100%)", zIndex: 1 }} />
          {/* Decorative orbs */}
          <div style={{ position: "absolute", right: -60, top: -60, height: 280, width: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.12), transparent)", pointerEvents: "none", zIndex: 2 }} />
          <div style={{ position: "absolute", left: -40, bottom: -40, height: 200, width: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.08), transparent)", pointerEvents: "none", zIndex: 2 }} />

          <div style={{ position: "relative", zIndex: 3 }}>
            {/* Logo */}
            <div style={{ marginBottom: "3.5rem" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "1.125rem", lineHeight: 1.2, letterSpacing: "-0.02em" }}>SSFRS</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.875rem", fontWeight: 600, marginTop: 4, letterSpacing: "0.01em" }}>Service Failure Refund System</div>
            </div>

            <h2 style={{ color: "#fff", fontSize: "3.5rem", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: "1.25rem" }}>
              Manage service failures with confidence.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "1rem", lineHeight: 1.75, fontWeight: 600 }}>
              A complete platform for tracking service claims, evaluating worker performance, and processing refunds.
            </p>

          </div>

          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", position: "relative", zIndex: 3 }}>
            © 2026 SSFRS · All rights reserved
          </p>
        </div>

        {/* ── Right form panel ── */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2.5rem 1.5rem",
          backgroundColor: "var(--color-neutral-50)",
        }}>
          {/* Mobile logo */}
          <div className="auth-mobile-logo" style={{ alignItems: "center", marginBottom: "1.75rem" }}>
            <span style={{ color: "var(--color-foreground)", fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.02em" }}>SSFRS</span>
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            style={{
              width: "100%",
              maxWidth: 420,
              backgroundColor: "var(--color-card)",
              borderRadius: 18,
              padding: "2.5rem",
              boxShadow: "var(--shadow-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            <AnimatePresence mode="wait">
              {step === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Header */}
                  <div style={{ marginBottom: "2rem" }}>
                    <h3 style={{ color: "var(--color-foreground)", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.03em", marginBottom: "0.3rem" }}>
                      Welcome back
                    </h3>
                    <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--color-muted-foreground)" }}>
                      Sign in to your SSFRS account
                    </p>
                  </div>

                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Email */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-foreground)" }}>
                        Email address
                      </label>
                      <div style={{ position: "relative" }}>
                        <Mail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--color-neutral-400)", pointerEvents: "none" }} />
                        <input
                          type="email"
                          {...loginForm.register("email")}
                          placeholder="you@example.com"
                          style={inputStyle(emailErr)}
                          onFocus={(e) => onFocusInput(e, emailErr)}
                          onBlur={(e) => onBlurInput(e, emailErr)}
                        />
                      </div>
                      {loginForm.formState.errors.email && (
                        <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-foreground)" }}>
                          Password
                        </label>
                        <a href="/forgot-password" style={{ fontSize: "0.75rem", fontWeight: 600, color: ACCENT, textDecoration: "none" }}>
                          Forgot password?
                        </a>
                      </div>
                      <div style={{ position: "relative" }}>
                        <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--color-neutral-400)", pointerEvents: "none" }} />
                        <input
                          type={showPassword ? "text" : "password"}
                          {...loginForm.register("password")}
                          placeholder="••••••••"
                          style={inputStyle(passwordErr, "0.65rem 2.5rem 0.65rem 2.5rem")}
                          onFocus={(e) => onFocusInput(e, passwordErr)}
                          onBlur={(e) => onBlurInput(e, passwordErr)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-neutral-400)", display: "flex" }}
                        >
                          {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: "100%", padding: "0.72rem 1rem", borderRadius: 10, marginTop: "0.25rem",
                        background: loading ? "var(--color-neutral-300)" : "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
                        color: "#fff", fontWeight: 700, fontSize: "0.875rem", border: "none",
                        cursor: loading ? "not-allowed" : "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", gap: "0.5rem",
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    >
                      {loading ? (
                        <>
                          <span style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                          Signing in…
                        </>
                      ) : "Sign In"}
                    </button>
                  </form>

                  <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-muted-foreground)" }}>
                    Don&apos;t have an account?{" "}
                    <a href="/register" style={{ fontWeight: 700, color: ACCENT, textDecoration: "none" }}>
                      Create account
                    </a>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* OTP header */}
                  <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{
                      margin: "0 auto 1rem",
                      height: 52, width: 52, borderRadius: "50%",
                      background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                      border: "1.5px solid #BFDBFE",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <ShieldCheck style={{ width: 24, height: 24, color: ACCENT }} />
                    </div>
                    <h3 style={{ color: "var(--color-foreground)", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.03em", marginBottom: "0.3rem" }}>
                      Verify your identity
                    </h3>
                    <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--color-muted-foreground)", marginBottom: "0.375rem" }}>
                      We sent a 6-digit code to
                    </p>
                    <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-foreground)" }}>
                      {pendingEmail}
                    </p>
                  </div>

                  <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-foreground)" }}>
                        Verification Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        {...otpForm.register("otp")}
                        placeholder="1 2 3 4 5 6"
                        style={{
                          ...inputStyle(otpErr, "0.75rem 1rem"),
                          textAlign: "center",
                          fontSize: "1.375rem",
                          fontFamily: "monospace",
                          letterSpacing: "0.45em",
                          fontWeight: 700,
                        }}
                        onFocus={(e) => onFocusInput(e, otpErr)}
                        onBlur={(e) => onBlurInput(e, otpErr)}
                      />
                      {otpForm.formState.errors.otp && (
                        <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>{otpForm.formState.errors.otp.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: "100%", padding: "0.72rem 1rem", borderRadius: 10,
                        background: loading ? "var(--color-neutral-300)" : "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
                        color: "#fff", fontWeight: 700, fontSize: "0.875rem", border: "none",
                        cursor: loading ? "not-allowed" : "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      }}
                    >
                      {loading ? (
                        <>
                          <span style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                          Verifying…
                        </>
                      ) : "Verify & Sign In"}
                    </button>
                  </form>

                  <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-muted-foreground)" }}>
                    Wrong account?{" "}
                    <button
                      type="button"
                      onClick={() => setStep("login")}
                      style={{ fontWeight: 700, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontSize: "0.8125rem" }}
                    >
                      Go back
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
