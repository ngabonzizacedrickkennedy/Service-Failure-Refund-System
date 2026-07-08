"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, ArrowLeft, Info } from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import api from "@/lib/api";

export default function CreateAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    temporaryPassword: "",
    role: "EVALUATOR" as "EVALUATOR" | "REFUND_OFFICE",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  function handleChange(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/admin/users", form);
      toast.success(
        `Account created for ${form.fullName}. Credentials sent to ${form.email}.`
      );
      setForm({
        fullName: "",
        email: "",
        temporaryPassword: "",
        role: "EVALUATOR",
        phone: "",
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to create account.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>Create Account</h3>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Manually create Evaluator or Refund Office accounts.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/admin/users")}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
            backgroundColor: "transparent",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-lg"
      >
        <div
          className="rounded-xl border p-6 space-y-5"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <div
            className="flex items-start gap-3 rounded-lg border p-3"
            style={{
              backgroundColor: "var(--color-neutral-50)",
              borderColor: "var(--color-neutral-200)",
            }}
          >
            <Info
              className="h-4 w-4 mt-0.5 flex-shrink-0"
              style={{ color: "var(--color-neutral-500)" }}
            />
            <p className="text-xs" style={{ color: "var(--color-neutral-600)" }}>
              Evaluator and Refund Office accounts cannot self-register. Only
              the Admin can create them here. The temporary password will be
              shared with the staff member directly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
                Account Role
              </label>
              <div className="flex gap-3">
                {(["EVALUATOR", "REFUND_OFFICE"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleChange("role", r)}
                    className="flex-1 px-4 py-2 rounded-full text-xs font-medium border transition-all"
                    style={{
                      backgroundColor:
                        form.role === r
                          ? "var(--color-primary)"
                          : "var(--color-background)",
                      color:
                        form.role === r ? "#ffffff" : "var(--color-neutral-600)",
                      borderColor:
                        form.role === r
                          ? "var(--color-primary)"
                          : "var(--color-border)",
                    }}
                  >
                    {r === "EVALUATOR" ? "Evaluator" : "Refund Office"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--color-foreground)" }}
                >
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: "var(--color-neutral-400)" }}
                  />
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    placeholder="Jane Smith"
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 transition"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-background)",
                      color: "var(--color-foreground)",
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--color-foreground)" }}
                >
                  Phone{" "}
                  <span style={{ color: "var(--color-neutral-400)" }}>
                    (optional)
                  </span>
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: "var(--color-neutral-400)" }}
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    placeholder="+250 700 000 000"
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 transition"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-background)",
                      color: "var(--color-foreground)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "var(--color-neutral-400)" }}
                />
                <input
                  type="email"
                  required
                  value={form.email}
                  placeholder="staff@platform.com"
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 transition"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
                Temporary Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "var(--color-neutral-400)" }}
                />
                <input
                  type="password"
                  required
                  value={form.temporaryPassword}
                  placeholder="••••••••"
                  onChange={(e) => handleChange("temporaryPassword", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 transition"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-foreground)",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Creating account…
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}