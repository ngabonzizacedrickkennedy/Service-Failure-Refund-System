"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, DollarSign, Briefcase, Search } from "lucide-react";
import { toast } from "react-toastify";
import { projectService, type ProjectResponse } from "@/lib/projectService";

const statusColor: Record<string, string> = {
  OPEN: "#22c55e", ASSIGNED: "#3b82f6", COMPLETED: "#8b5cf6", FAILED: "#ef4444",
};

export default function WorkerPendingProjectsPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    /* Fetch only OPEN projects — dedicated endpoint, no admin role required */
    projectService.getOpenProjects()
      .then(setProjects)
      .catch(() => toast.error("Failed to load pending projects."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.requiredSkills.toLowerCase().includes(search.toLowerCase()) ||
    p.scopeOfWork.toLowerCase().includes(search.toLowerCase())
  );

  const daysUntil = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Pending Projects</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Open projects awaiting assignment. These may match your field of expertise. The admin will assign you based on your AI rating.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <input
          type="text"
          placeholder="Search by title, skills, or scope…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-4 py-2.5 text-sm focus:outline-none"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-background)",
            color: "var(--color-foreground)",
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <Clock className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            {search ? "No projects match your search." : "No open projects at the moment."}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Check back later — the admin posts new projects regularly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-muted-foreground)" }}>
            {filtered.length} open project{filtered.length !== 1 ? "s" : ""}
          </p>

          {filtered.map((p, i) => {
            const thumb = p.images?.[0];
            const days = daysUntil(p.deadline);

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                {/* Banner image */}
                {thumb && (
                  <div className="h-36 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb.imageUrl} alt={thumb.description}
                      className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>{p.title}</h5>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{ backgroundColor: statusColor[p.status] + "20", color: statusColor[p.status] }}>
                          {p.status}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={p.funded
                            ? { backgroundColor: "#22c55e20", color: "#22c55e" }
                            : { backgroundColor: "#f59e0b20", color: "#f59e0b" }}>
                          {p.funded ? "Funded" : "Awaiting Funding"}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2" style={{ color: "var(--color-muted-foreground)" }}>
                        {p.scopeOfWork}
                      </p>
                    </div>
                  </div>

                  {/* Skills chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {p.requiredSkills.split(",").map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-foreground)" }}>
                        {s.trim()}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-5 text-xs pt-1 border-t"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(p.deadline).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span style={{ color: days <= 7 ? "#ef4444" : "inherit" }}>
                        {days} day{days !== 1 ? "s" : ""} left
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {Number(p.budget).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {p.images?.length || 0} image{p.images?.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
