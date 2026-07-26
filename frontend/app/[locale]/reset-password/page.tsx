"use client";

import { useState } from "react";
import { useRouter, Link } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { authService } from "@/lib/authService";
import { useTranslations } from "next-intl";
import { AuthShell, AuthField, AuthPasswordInput, AuthSubmit } from "@/components/AuthShell";

export default function ResetPasswordPage() {
  const t = useTranslations("ResetPassword");
  const tLogin = useTranslations("Login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const schema = z
    .object({
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[@$!%*?&]/, "Must contain a special character"),
      confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  type FormData = z.infer<typeof schema>;

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, data.newPassword);
      setDone(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Something went wrong.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const navRight = (
    <Link href="/login" className="auth-nav-link">
      {tLogin("signIn")}
    </Link>
  );

  if (!token) {
    return (
      <AuthShell navRight={navRight}>
        <h1 className="auth-title">{t("title")}</h1>
        <p className="auth-subtitle">
          Invalid or missing reset token.{" "}
          <Link href="/forgot-password" className="auth-footer-link">
            Request a new link
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell navRight={navRight}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
      >
        {done ? (
          <>
            <div className="auth-badge">
              <CheckCircle size={30} />
            </div>
            <h1 className="auth-title">Password updated</h1>
            <p className="auth-subtitle">
              Your password has been reset. You can now sign in.
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                className="auth-submit"
                style={{ marginTop: 0 }}
                onClick={() => router.push("/login")}
              >
                {t("backToSignIn")}
              </button>
            </div>
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
              <AuthField error={errors.newPassword?.message}>
                <AuthPasswordInput
                  autoComplete="new-password"
                  placeholder={t("newPasswordLabel")}
                  aria-label={t("newPasswordLabel")}
                  invalid={!!errors.newPassword}
                  {...register("newPassword")}
                />
              </AuthField>

              <AuthField error={errors.confirmPassword?.message}>
                <AuthPasswordInput
                  autoComplete="new-password"
                  placeholder={t("confirmPasswordLabel")}
                  aria-label={t("confirmPasswordLabel")}
                  invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
              </AuthField>

              <AuthSubmit loading={loading} loadingLabel={t("resetting")}>
                {t("resetPassword")}
              </AuthSubmit>
            </form>
          </>
        )}
      </motion.div>
    </AuthShell>
  );
}
