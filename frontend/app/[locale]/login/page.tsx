"use client";

import { useState } from "react";
import { useRouter, Link } from "@/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/authService";
import { useTranslations } from "next-intl";
import {
  AuthShell,
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthSubmit,
} from "@/components/AuthShell";

export default function LoginPage() {
  const t = useTranslations("Login");
  const tRegister = useTranslations("Register");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"login" | "otp">("login");
  const [pendingEmail, setPendingEmail] = useState("");

  const loginSchema = z.object({
    email: z.string().email(t("emailError")),
    password: z.string().min(1, t("passwordError")),
  });

  const otpSchema = z.object({
    otp: z.string().length(6, t("otpError")),
  });

  type LoginFormData = z.infer<typeof loginSchema>;
  type OtpFormData = z.infer<typeof otpSchema>;

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

  return (
    <AuthShell
      navRight={
        <Link href="/register" className="auth-nav-link">
          {tRegister("createAccount")}
        </Link>
      }
    >
      <AnimatePresence mode="wait">
        {step === "login" ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24 }}
          >
            <h1 className="auth-title">{t("title")}</h1>
            <p className="auth-subtitle">{t("subtitle")}</p>

            <form className="auth-form" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
              <AuthField error={loginForm.formState.errors.email?.message}>
                <AuthInput
                  type="email"
                  autoComplete="email"
                  placeholder={t("emailLabel")}
                  aria-label={t("emailLabel")}
                  invalid={!!loginForm.formState.errors.email}
                  {...loginForm.register("email")}
                />
              </AuthField>

              <AuthField error={loginForm.formState.errors.password?.message}>
                <AuthPasswordInput
                  autoComplete="current-password"
                  placeholder={t("passwordLabel")}
                  aria-label={t("passwordLabel")}
                  invalid={!!loginForm.formState.errors.password}
                  {...loginForm.register("password")}
                />
              </AuthField>

              <div className="auth-meta-row">
                <Link href="/forgot-password" className="auth-quiet-link">
                  {t("forgotPassword")}
                </Link>
              </div>

              <AuthSubmit loading={loading} loadingLabel={t("signingIn")}>
                {t("signIn")}
              </AuthSubmit>
            </form>

            <p className="auth-footer">
              {t("noAccount")}{" "}
              <Link href="/register" className="auth-footer-link">
                {t("createAccount")}
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24 }}
          >
            <div className="auth-badge">
              <ShieldCheck size={30} />
            </div>
            <h1 className="auth-title">{t("otpTitle")}</h1>
            <p className="auth-subtitle">
              {t("otpSubtitle")} <strong style={{ color: "var(--auth-ink)" }}>{pendingEmail}</strong>
            </p>

            <form className="auth-form" onSubmit={otpForm.handleSubmit(onOtpSubmit)}>
              <AuthField error={otpForm.formState.errors.otp?.message}>
                <AuthInput
                  className="auth-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  aria-label={t("verificationCode")}
                  invalid={!!otpForm.formState.errors.otp}
                  {...otpForm.register("otp")}
                />
              </AuthField>

              <AuthSubmit loading={loading} loadingLabel={t("verifying")}>
                {t("verifyAndSignIn")}
              </AuthSubmit>
            </form>

            <p className="auth-footer">
              {t("wrongAccount")}{" "}
              <button
                type="button"
                onClick={() => setStep("login")}
                className="auth-footer-link"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "inherit" }}
              >
                {t("goBack")}
              </button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
