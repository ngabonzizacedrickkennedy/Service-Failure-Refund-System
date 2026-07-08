"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, User, Phone, Briefcase, HardHat } from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { authService } from "@/lib/authService";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[@$!%*?&]/, "Must contain a special character"),
  phone: z.string().min(7, "Phone number is required"),
  role: z.enum(["PROVIDER", "WORKER"], {
    error: "Please select a role",
  }),
});

type FormData = z.infer<typeof schema>;

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

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((d) => setVideoUrl(d?.hero?.videoUrl || ""))
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedRole = watch("role");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authService.register(data);
      toast.success("Account created. Please sign in.");
      router.push("/login");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .auth-left { display: none; }
        .auth-mobile-logo { display: flex; }
        @media (min-width: 768px) {
          .auth-left { display: flex; }
          .auth-mobile-logo { display: none; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
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
          {videoUrl && (
            <video autoPlay muted loop playsInline src={videoUrl}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,18,38,0.55) 0%, rgba(10,18,38,0.70) 60%, rgba(10,18,38,0.88) 100%)", zIndex: 1 }} />
          <div style={{ position: "absolute", right: -60, top: -60, height: 280, width: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.12), transparent)", pointerEvents: "none", zIndex: 2 }} />
          <div style={{ position: "absolute", left: -40, bottom: -40, height: 200, width: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.08), transparent)", pointerEvents: "none", zIndex: 2 }} />

          <div style={{ position: "relative", zIndex: 3 }}>
            <div style={{ marginBottom: "3.5rem" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "1.125rem", lineHeight: 1.2, letterSpacing: "-0.02em" }}>SSFRS</div>
              <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, marginTop: 3 }}>Service Failure Refund System</div>
            </div>

            <h2 style={{ color: "#fff", fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.25, marginBottom: "0.875rem" }}>
              Join the platform today.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.75 }}>
              Create your account as a Project Provider or Worker and get started with structured claim management.
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
              maxWidth: 440,
              backgroundColor: "var(--color-card)",
              borderRadius: 18,
              padding: "2.5rem",
              boxShadow: "var(--shadow-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ color: "var(--color-foreground)", fontWeight: 800, marginBottom: "0.25rem" }}>
                Create your account
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted-foreground)" }}>
                Fill in your details to get started
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>

              {/* Full Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-foreground)" }}>Full Name</label>
                <div style={{ position: "relative" }}>
                  <User style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--color-neutral-400)", pointerEvents: "none" }} />
                  <input
                    type="text"
                    {...register("fullName")}
                    placeholder="John Doe"
                    style={inputStyle(!!errors.fullName)}
                    onFocus={(e) => onFocusInput(e, !!errors.fullName)}
                    onBlur={(e) => onBlurInput(e, !!errors.fullName)}
                  />
                </div>
                {errors.fullName && <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>{errors.fullName.message}</p>}
              </div>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-foreground)" }}>Email address</label>
                <div style={{ position: "relative" }}>
                  <Mail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--color-neutral-400)", pointerEvents: "none" }} />
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="you@example.com"
                    style={inputStyle(!!errors.email)}
                    onFocus={(e) => onFocusInput(e, !!errors.email)}
                    onBlur={(e) => onBlurInput(e, !!errors.email)}
                  />
                </div>
                {errors.email && <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-foreground)" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--color-neutral-400)", pointerEvents: "none" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="••••••••"
                    style={inputStyle(!!errors.password, "0.65rem 2.5rem 0.65rem 2.5rem")}
                    onFocus={(e) => onFocusInput(e, !!errors.password)}
                    onBlur={(e) => onBlurInput(e, !!errors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-neutral-400)", display: "flex" }}
                  >
                    {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
                {errors.password && <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>{errors.password.message}</p>}
              </div>

              {/* Phone */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-foreground)" }}>Phone Number</label>
                <div style={{ position: "relative" }}>
                  <Phone style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--color-neutral-400)", pointerEvents: "none" }} />
                  <input
                    type="tel"
                    {...register("phone")}
                    placeholder="+1 234 567 8900"
                    style={inputStyle(!!errors.phone)}
                    onFocus={(e) => onFocusInput(e, !!errors.phone)}
                    onBlur={(e) => onBlurInput(e, !!errors.phone)}
                  />
                </div>
                {errors.phone && <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>{errors.phone.message}</p>}
              </div>

              {/* Role */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-foreground)" }}>I am a</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                  {([
                    { value: "PROVIDER", label: "Project Provider", icon: <Briefcase style={{ width: 16, height: 16 }} /> },
                    { value: "WORKER",   label: "Worker",           icon: <HardHat style={{ width: 16, height: 16 }} /> },
                  ] as const).map((opt) => {
                    const active = selectedRole === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValue("role", opt.value)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                          padding: "0.625rem 0.75rem",
                          borderRadius: 10,
                          border: `1.5px solid ${active ? ACCENT : "var(--color-border)"}`,
                          backgroundColor: active ? `${ACCENT}10` : "transparent",
                          color: active ? ACCENT : "var(--color-muted-foreground)",
                          fontWeight: active ? 700 : 500,
                          fontSize: "0.8125rem",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {errors.role && <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>{errors.role.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "0.72rem 1rem", borderRadius: 10, marginTop: "0.375rem",
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
                    Creating account…
                  </>
                ) : "Create Account"}
              </button>
            </form>

            <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--color-muted-foreground)" }}>
              Already have an account?{" "}
              <a href="/login" style={{ fontWeight: 700, color: ACCENT, textDecoration: "none" }}>
                Sign in
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
