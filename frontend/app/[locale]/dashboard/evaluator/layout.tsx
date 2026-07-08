"use client";

import { useEffect } from "react";
import { useRouter } from "@/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { authService } from "@/lib/authService";

export default function EvaluatorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    const s = authService.getSession();
    if (s?.role !== "EVALUATOR") {
      router.push("/login");
    }
  }, [router]);

  return <DashboardLayout>{children}</DashboardLayout>;
}
