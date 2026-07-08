"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Star, Briefcase, Mail, Loader2,
  Award, Percent, UserCheck, RefreshCw, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { toast } from "react-toastify";
import { projectService, type ProjectResponse, type RankedWorkerResponse } from "@/lib/projectService";
import { workerCvService } from "@/lib/workerCvService";
import { userService } from "@/lib/userService";

const STRONG_MATCH = 60;
const MIN_MATCH    = 40;

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  OPEN:      { bg: "#22c55e20", text: "#22c55e", label: "Open",      icon: <Clock      className="h-3.5 w-3.5" /> },
  ASSIGNED:  { bg: "#3b82f620", text: "#3b82f6", label: "Assigned",  icon: <UserCheck  className="h-3.5 w-3.5" /> },
  COMPLETED: { bg: "#8b5cf620", text: "#8b5cf6", label: "Completed", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  FAILED:    { bg: "#ef444420", text: "#ef4444", label: "Failed",    icon: <XCircle    className="h-3.5 w-3.5" /> },
};

interface WorkerCard extends RankedWorkerResponse {
  profileImageUrl?: string | null;
}

interface ProjectWithCandidates {
  project: ProjectResponse;
  candidates: WorkerCard[];
}

export default function ProviderAlumniPage() {
  const [sections, setSections]     = useState<ProjectWithCandidates[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = (isInitial = false) => {
    if (!isInitial) setRefreshing(true);
    projectService.getMyProjects()
      .then(async (myProjects) => {
        const built: ProjectWithCandidates[] = [];

        await Promise.allSettled(
          myProjects.map(async (p) => {
            const isTerminal = p.status === "ASSIGNED" || p.status === "COMPLETED" || p.status === "FAILED";
            try {
              const raw = await projectService.getCandidates(p.id);
              const candidates: WorkerCard[] = raw
                .filter((c) => c.rankScore >= MIN_MATCH)
                .sort((a, b) => b.rankScore - a.rankScore)
                .map((c) => ({ ...c, profileImageUrl: null }));

              // For terminal projects, always ensure the assigned worker is present
              if (isTerminal && p.assignedWorkerId && !candidates.some((c) => c.workerId === p.assignedWorkerId)) {
                try {
                  const cv = await workerCvService.getWorkerCv(p.assignedWorkerId);
                  candidates.unshift({
                    workerId: cv.workerId,
                    workerName: cv.workerName,
                    workerEmail: cv.workerEmail,
                    specialization: cv.specialization,
                    yearsOfExperience: cv.yearsOfExperience,
                    ratingScore: cv.ratingScore,
                    rankScore: 100,
                    profileImageUrl: null,
                  });
                } catch { /* assigned worker CV not found, show fallback message */ }
              }

              built.push({ project: p, candidates });
            } catch {
              built.push({ project: p, candidates: [] });
            }
          })
        );

        // Sort sections: OPEN first, then ASSIGNED, COMPLETED, FAILED
        const order: Record<string, number> = { OPEN: 0, ASSIGNED: 1, COMPLETED: 2, FAILED: 3 };
        built.sort((a, b) => (order[a.project.status] ?? 9) - (order[b.project.status] ?? 9));
        setSections(built);

        // Fetch profile images in background
        built.forEach(({ candidates }) => {
          candidates.forEach((w) => {
            userService.getUser(w.workerId)
              .then((u) => {
                if (u.profileImageUrl) {
                  setSections((prev) =>
                    prev.map((s) => ({
                      ...s,
                      candidates: s.candidates.map((c) =>
                        c.workerId === w.workerId ? { ...c, profileImageUrl: u.profileImageUrl } : c
                      ),
                    }))
                  );
                }
              })
              .catch(() => {});
          });
        });
      })
      .catch(() => { if (isInitial) toast.error("Failed to load projects."); })
      .finally(() => {
        if (isInitial) setLoading(false);
        else setRefreshing(false);
      });
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>My Projects & Candidates</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Each project shows its best AI-matched workers. Assigned projects show only the assigned worker.
          </p>
        </div>
        <button
          onClick={() => load(false)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition hover:opacity-80 disabled:opacity-50"
          style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)", backgroundColor: "var(--color-card)" }}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>

      ) : sections.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="mx-auto mb-3 h-10 w-10 flex items-center justify-center"
            style={{ color: "var(--color-neutral-300)" }}>
            <GraduationCap />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>No projects posted yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Post a project to see AI-matched worker candidates here.
          </p>
        </div>

      ) : (
        <div className="space-y-8">
          {sections.map(({ project: p, candidates }) => (
            <ProjectSection key={p.id} project={p} candidates={candidates} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Project section ─────────────────────────────────────────────────────── */

function ProjectSection({ project: p, candidates }: { project: ProjectResponse; candidates: WorkerCard[] }) {
  const style   = STATUS_STYLE[p.status] ?? STATUS_STYLE.OPEN;
  const assigned = candidates.find((c) => c.workerId === p.assignedWorkerId);
  const isTerminal = p.status === "ASSIGNED" || p.status === "COMPLETED" || p.status === "FAILED";

  const best      = candidates.filter((c) => c.rankScore >= STRONG_MATCH);
  const potential = candidates.filter((c) => c.rankScore >= MIN_MATCH && c.rankScore < STRONG_MATCH);

  return (
    <div className="space-y-3">
      {/* Project header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold truncate" style={{ color: "var(--color-foreground)" }}>
              {p.title}
            </h4>
            <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0"
              style={{ backgroundColor: style.bg, color: style.text }}>
              {style.icon}
              {style.label}
            </span>
            {p.categoryDisplayName && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0"
                style={{ backgroundColor: "var(--color-primary-50, #f0f4ff)", color: "var(--color-primary)" }}>
                {p.categoryDisplayName}
              </span>
            )}
          </div>
          {p.requiredSkills && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)" }}>
              Skills: {p.requiredSkills}
            </p>
          )}
        </div>
      </div>

      {/* ASSIGNED / COMPLETED / FAILED — show only the assigned worker */}
      {isTerminal ? (
        assigned ? (
          <div className="rounded-xl border p-4 flex items-center gap-4"
            style={{ backgroundColor: "var(--color-card)", borderColor: style.text + "40" }}>
            <Avatar worker={assigned} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold" style={{ color: "var(--color-foreground)" }}>{assigned.workerName}</p>
                <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: style.bg, color: style.text }}>
                  <UserCheck className="h-3 w-3" />
                  {p.status === "ASSIGNED" ? "Assigned Worker" : p.status === "COMPLETED" ? "Completed By" : "Was Assigned To"}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{assigned.workerEmail}</p>
              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
                  <Briefcase className="h-3 w-3" /> {assigned.specialization}
                </span>
                <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
                  <Award className="h-3 w-3" /> {assigned.yearsOfExperience} yrs exp
                </span>
                <span className="text-xs flex items-center gap-1" style={{ color: ratingColor(assigned.ratingScore) }}>
                  <Star className="h-3 w-3" style={{ color: "#f59e0b" }} /> {assigned.ratingScore.toFixed(1)} / 10
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border px-4 py-3 text-sm"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>
            {p.status === "ASSIGNED" ? "Worker assigned — not found in candidate list." : `Project ${style.label.toLowerCase()}.`}
          </div>
        )

      ) : /* OPEN — show ranked candidates */ candidates.length === 0 ? (
        <div className="rounded-xl border px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>
          No matching workers found yet. Workers appear once they submit a rated CV matching your required skills.
        </div>

      ) : (
        <div className="space-y-4">
          {best.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--color-muted-foreground)" }}>
                Strong matches · {STRONG_MATCH}%+
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {best.map((w, i) => (
                  <CandidateCard key={w.workerId} worker={w} isBest={i === 0} />
                ))}
              </div>
            </div>
          )}
          {potential.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--color-muted-foreground)" }}>
                Potential candidates · {MIN_MATCH}–{STRONG_MATCH - 1}%
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {potential.map((w) => (
                  <CandidateCard key={w.workerId} worker={w} isBest={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Candidate card (OPEN projects) ─────────────────────────────────────── */

function CandidateCard({ worker: w, isBest }: { worker: WorkerCard; isBest: boolean }) {
  const mColor = w.rankScore >= 60 ? "#22c55e" : w.rankScore >= 40 ? "#f59e0b" : "#ef4444";
  const rColor = ratingColor(w.ratingScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-4 space-y-3 relative overflow-hidden"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: isBest ? "#22c55e" : "var(--color-border)",
      }}>
      {isBest && (
        <div className="absolute top-0 right-0 px-2 py-0.5 text-xs font-bold"
          style={{ backgroundColor: "#22c55e", color: "white", borderBottomLeftRadius: "8px" }}>
          BEST MATCH
        </div>
      )}

      <div className="flex items-center gap-3">
        <Avatar worker={w} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--color-foreground)" }}>{w.workerName}</p>
          <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>{w.workerEmail}</p>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <div className="flex items-center gap-0.5">
            <Percent className="h-3 w-3" style={{ color: mColor }} />
            <span className="font-bold text-sm" style={{ color: mColor }}>{w.rankScore.toFixed(0)}%</span>
          </div>
          <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>match</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
          <Briefcase className="h-3 w-3" /> {w.specialization}
        </span>
        <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
          <Award className="h-3 w-3" /> {w.yearsOfExperience} yrs
        </span>
        <span className="text-xs flex items-center gap-1" style={{ color: rColor }}>
          <Star className="h-3 w-3" style={{ color: "#f59e0b" }} /> {w.ratingScore.toFixed(1)} / 10
        </span>
        <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
          <Mail className="h-3 w-3" /> {w.workerEmail}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Avatar ──────────────────────────────────────────────────────────────── */

function Avatar({ worker: w, size }: { worker: WorkerCard; size: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-14 w-14 text-base" : "h-10 w-10 text-sm";
  const colors = ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];
  let h = 0;
  for (let i = 0; i < w.workerId.length; i++) h = (h * 31 + w.workerId.charCodeAt(i)) % colors.length;
  const initials = w.workerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className={`${dim} rounded-full overflow-hidden flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: colors[h] }}>
      {w.profileImageUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={w.profileImageUrl} alt={w.workerName} className="h-full w-full object-cover" />
        : initials}
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function ratingColor(s: number) {
  return s >= 7 ? "#22c55e" : s >= 4 ? "#f59e0b" : "#ef4444";
}
