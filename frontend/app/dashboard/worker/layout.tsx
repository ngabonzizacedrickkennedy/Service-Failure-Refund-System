"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import AiChat from "@/components/AiChat";
import { authService } from "@/lib/authService";
import { Sparkles } from "lucide-react";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    const s = authService.getSession();
    if (s?.role !== "WORKER") {
      router.push("/login");
    }
  }, [router]);

  return (
    <DashboardLayout>
      {children}

      {/* AI Chat floating button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          aria-label="Open AI Assistant"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 shadow-2xl transition-transform hover:scale-105 active:scale-95"
          style={{
            padding: "12px 20px",
            borderRadius: "50px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.45), 0 2px 8px rgba(0,0,0,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}>
          <Sparkles className="h-5 w-5 text-white" />
          <span className="text-white font-semibold text-sm">AI Assistant</span>
        </button>
      )}

      <AiChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </DashboardLayout>
  );
}
