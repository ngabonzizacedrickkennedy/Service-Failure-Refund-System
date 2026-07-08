"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/navigation";
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
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
          style={{
            padding: "14px 22px 14px 14px",
            borderRadius: "999px",
            background: "#5B4FE5",
            boxShadow: "0 10px 30px rgba(91,79,229,0.45), 0 3px 10px rgba(0,0,0,0.15)",
          }}>
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: 30, width: 30, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.18)", flexShrink: 0,
          }}>
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="text-white font-semibold text-sm">AI Assistant</span>
        </button>
      )}

      <AiChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </DashboardLayout>
  );
}
