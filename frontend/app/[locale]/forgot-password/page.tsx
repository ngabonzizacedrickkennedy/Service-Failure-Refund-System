"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { authService } from "@/lib/authService";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { AuthShell, AuthField, AuthInput, AuthSubmit } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPassword");
  const tLogin = useTranslations("Login");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const schema = z.object({ email: z.string().email(t("emailError")) });
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setSent(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      navRight={
        <Link href="/login" className="auth-nav-link">
          {tLogin("signIn")}
        </Link>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
      >
        {sent ? (
          <>
            <div className="auth-badge">
              <MailCheck size={30} />
            </div>
            <h1 className="auth-title">{t("checkEmail")}</h1>
            <p className="auth-subtitle" style={{ marginBottom: "1.25rem" }}>
              {t("resetSentTo")}
            </p>
            <div style={{ textAlign: "center" }}>
              <span className="auth-chip">{submittedEmail}</span>
            </div>
            <p
              className="auth-subtitle"
              style={{ marginTop: "1.5rem", marginBottom: "0", fontSize: "0.875rem" }}
            >
              {t("linkExpires")}
            </p>
            <p className="auth-footer">
              <Link href="/login" className="auth-back" style={{ marginBottom: 0 }}>
                <ArrowLeft size={15} />
                {t("backToSignIn")}
              </Link>
            </p>
          </>
        ) : (
          <>
            <Link href="/login" className="auth-back">
              <ArrowLeft size={15} />
              {t("backToSignIn")}
            </Link>

            <h1 className="auth-title">{t("title")}</h1>
            <p className="auth-subtitle">{t("subtitle")}</p>

            <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
              <AuthField label={t("emailLabel")} error={errors.email?.message}>
                <AuthInput
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  invalid={!!errors.email}
                  {...register("email")}
                />
              </AuthField>

              <AuthSubmit loading={loading} loadingLabel={t("sendingLink")}>
                {t("sendResetLink")}
              </AuthSubmit>
            </form>
          </>
        )}
      </motion.div>
    </AuthShell>
  );
}
