"use client";

import { useState } from "react";
import { useRouter, Link } from "@/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, User, Phone, Briefcase, HardHat } from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { authService } from "@/lib/authService";
import { useTranslations } from "next-intl";
import {
  AuthShell,
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthSubmit,
} from "@/components/AuthShell";

export default function RegisterPage() {
  const t = useTranslations("Register");
  const tLogin = useTranslations("Login");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    fullName: z.string().min(2, t("errFullName")),
    email: z.string().email(t("errEmail")),
    password: z
      .string()
      .min(8, t("errPasswordMin"))
      .regex(/[A-Z]/, t("errPasswordUpper"))
      .regex(/[a-z]/, t("errPasswordLower"))
      .regex(/[0-9]/, t("errPasswordNumber"))
      .regex(/[@$!%*?&]/, t("errPasswordSpecial")),
    phone: z.string().min(7, t("errPhone")),
    role: z.enum(["PROVIDER", "WORKER"], { error: t("errRole") }),
  });

  type FormData = z.infer<typeof schema>;

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

  const roles = [
    { value: "PROVIDER", label: t("providerRole"), Icon: Briefcase },
    { value: "WORKER", label: t("workerRole"), Icon: HardHat },
  ] as const;

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
        <h1 className="auth-title">{t("title")}</h1>
        <p className="auth-subtitle">{t("subtitle")}</p>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <AuthField label={t("fullNameLabel")} error={errors.fullName?.message}>
            <AuthInput
              icon={User}
              type="text"
              autoComplete="name"
              placeholder={t("fullNamePlaceholder")}
              invalid={!!errors.fullName}
              {...register("fullName")}
            />
          </AuthField>

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

          <AuthField label={t("passwordLabel")} error={errors.password?.message}>
            <AuthPasswordInput
              autoComplete="new-password"
              placeholder="••••••••"
              invalid={!!errors.password}
              {...register("password")}
            />
          </AuthField>

          <AuthField label={t("phoneLabel")} error={errors.phone?.message}>
            <AuthInput
              icon={Phone}
              type="tel"
              autoComplete="tel"
              placeholder={t("phonePlaceholder")}
              invalid={!!errors.phone}
              {...register("phone")}
            />
          </AuthField>

          <AuthField label={t("roleLabel")} error={errors.role?.message}>
            <div className="auth-segmented">
              {roles.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue("role", value, { shouldValidate: true })}
                  aria-pressed={selectedRole === value}
                  className={`auth-segment ${selectedRole === value ? "is-active" : ""}`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </AuthField>

          <AuthSubmit loading={loading} loadingLabel={t("creatingAccount")}>
            {t("createAccount")}
          </AuthSubmit>
        </form>

        <p className="auth-footer">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="auth-footer-link">
            {t("signIn")}
          </Link>
        </p>
      </motion.div>
    </AuthShell>
  );
}
