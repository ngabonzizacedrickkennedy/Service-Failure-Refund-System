"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Plus, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { claimService, ClaimResponse } from "@/lib/claimService";

const statusColor: Record<string, string> = {
  PENDING: "#f59e0b",
  UNDER_REVIEW: "#3b82f6",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
};

export default function ProviderClaimsPage() {
  const [claims, setClaims] = useState<ClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");

  useEffect(() => {
    if (projectId) {
      router.replace(`/dashboard/provider/claims/new?projectId=${projectId}`);
      return;
    }
    claimService.getMyClaims()
      .then(setClaims)
      .catch(() => toast.error("Failed to load claims."))
      .finally(() => setLoading(false));
  }, [projectId, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>My Claims</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            {claims.length} claim{claims.length !== 1 ? "s" : ""} filed
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-primary)" }} />
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <FileText className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>No claims filed</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Claims can be filed from a failed project&apos;s detail page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}>
              <Link href={`/dashboard/provider/claims/${c.id}`}
                className="flex items-center gap-4 rounded-xl border p-4 transition hover:shadow-sm"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>
                      Claim #{c.id.slice(0, 8)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: statusColor[c.status] + "20", color: statusColor[c.status] }}>
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>
                    {c.description}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                    Filed {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
