"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Calendar, DollarSign, Star, ChevronDown, ChevronUp,
  UserCheck, Loader2, CheckCircle, Clock, Images, Mail, Award,
  MapPin, Tag, ShieldCheck, User, Hash, Image as ImageIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import { projectService, ProjectResponse, RankedWorkerResponse } from "@/lib/projectService";
import { userService } from "@/lib/userService";

interface CandidateWithPhoto extends RankedWorkerResponse {
  profileImageUrl?: string | null;
}

const statusColor: Record<string, string> = {
  OPEN: "#22c55e", ASSIGNED: "#3b82f6", COMPLETED: "#8b5cf6", FAILED: "#ef4444",
};

const statusLabel: Record<string, string> = {
  OPEN: "Open", ASSIGNED: "Assigned", COMPLETED: "Completed", FAILED: "Failed",
};

function daysUntil(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
const avatarColor = (id: string) => {
  const colors = ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % colors.length;
  return colors[h];
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Record<string, CandidateWithPhoto[]>>({});
  const [candidateLoading, setCandidateLoading] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [workerNames, setWorkerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    projectService.getAllProjects()
      .then(setProjects)
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          || "Failed to load projects.";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (project: ProjectResponse) => {
    if (expandedId === project.id) { setExpandedId(null); return; }
    setExpandedId(project.id);
    if (project.assignedWorkerId && !workerNames[project.assignedWorkerId]) {
      userService.getUser(project.assignedWorkerId)
        .then(u => setWorkerNames(prev => ({ ...prev, [project.assignedWorkerId!]: u.firstName + " " + u.lastName })))
        .catch(() => {});
    }
  };

  const loadCandidates = async (projectId: string) => {
    if (candidates[projectId]) return;
    setCandidateLoading(projectId);
    try {
      const ranked = await projectService.getCandidates(projectId);
      const withPhotos: CandidateWithPhoto[] = ranked.map(w => ({ ...w, profileImageUrl: null }));
      setCandidates(prev => ({ ...prev, [projectId]: withPhotos }));
      withPhotos.forEach(w => {
        userService.getUser(w.workerId)
          .then(u => {
            if (u.profileImageUrl) {
              setCandidates(prev => ({
                ...prev,
                [projectId]: (prev[projectId] ?? []).map(c =>
                  c.workerId === w.workerId ? { ...c, profileImageUrl: u.profileImageUrl } : c
                ),
              }));
            }
          })
          .catch(() => {});
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to load AI-ranked candidates.";
      toast.error(msg);
    } finally {
      setCandidateLoading(null);
    }
  };

  const handleAssign = async (projectId: string, workerId: string, workerName: string) => {
    setAssigning(`${projectId}-${workerId}`);
    try {
      const updated = await projectService.assignWorker(projectId, workerId);
      setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
      setExpandedId(null);
      toast.success(`Assigned ${workerName} to the project.`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Assignment failed.";
      toast.error(msg);
    } finally {
      setAssigning(null);
    }
  };

  const openProjects     = projects.filter(p => p.status === "OPEN");
  const assignedProjects = projects.filter(p => p.status === "ASSIGNED");
  const otherProjects    = projects.filter(p => p.status === "COMPLETED" || p.status === "FAILED");

  const sharedProps = { expandedId, candidates, candidateLoading, assigning, workerNames, onToggle: toggleExpand, onLoadCandidates: loadCandidates, onAssign: handleAssign };

  return (
    <div className="space-y-8">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Projects</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Manage all projects — view full details, assign workers, and monitor progress.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Open",      count: openProjects.length,                                    color: "#22c55e" },
          { label: "Assigned",  count: assignedProjects.length,                                color: "#3b82f6" },
          { label: "Completed", count: projects.filter(p => p.status === "COMPLETED").length,  color: "#8b5cf6" },
          { label: "Failed",    count: projects.filter(p => p.status === "FAILED").length,     color: "#ef4444" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4 text-center"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      ) : (
        <>
          {/* Open */}
          {openProjects.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-muted-foreground)" }}>
                Open — awaiting assignment ({openProjects.length})
              </p>
              {openProjects.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} {...sharedProps} />
              ))}
            </section>
          )}

          {openProjects.length === 0 && (
            <div className="rounded-xl border p-8 text-center"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <CheckCircle className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>No open projects awaiting assignment.</p>
            </div>
          )}

          {/* Assigned */}
          {assignedProjects.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-muted-foreground)" }}>
                Assigned & in progress ({assignedProjects.length})
              </p>
              {assignedProjects.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} {...sharedProps} />
              ))}
            </section>
          )}

          {/* Completed / Failed */}
          {otherProjects.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-muted-foreground)" }}>
                Completed / Failed ({otherProjects.length})
              </p>
              {otherProjects.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} {...sharedProps} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ── Unified expandable project card ── */
function ProjectCard({
  project, index, expandedId, candidates, candidateLoading, assigning, workerNames,
  onToggle, onLoadCandidates, onAssign,
}: {
  project: ProjectResponse;
  index: number;
  expandedId: string | null;
  candidates: Record<string, CandidateWithPhoto[]>;
  candidateLoading: string | null;
  assigning: string | null;
  workerNames: Record<string, string>;
  onToggle: (p: ProjectResponse) => void;
  onLoadCandidates: (id: string) => void;
  onAssign: (projectId: string, workerId: string, workerName: string) => void;
}) {
  const expanded = expandedId === project.id;
  const days = daysUntil(project.deadline);
  const dayColor = days <= 3 ? "#ef4444" : days <= 7 ? "#f59e0b" : "#22c55e";
  const thumb = project.images?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => onToggle(project)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 transition hover:opacity-90"
      >
        {/* Thumbnail */}
        {thumb ? (
          <div className="h-12 w-16 rounded-lg overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--color-primary-100)" }}>
            <Briefcase className="h-5 w-5" style={{ color: "var(--color-primary-600)" }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: "var(--color-foreground)" }}>
              {project.title}
            </span>
            {project.categoryDisplayName && (
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--color-primary-100)", color: "var(--color-primary-700)" }}>
                {project.categoryDisplayName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs flex-wrap" style={{ color: "var(--color-muted-foreground)" }}>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {Number(project.budget).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(project.deadline).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1 font-medium" style={{ color: dayColor }}>
              <Clock className="h-3 w-3" />
              {days === 0 ? "Due today" : `${days}d left`}
            </span>
            {project.constructionLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {project.constructionLocation}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ backgroundColor: statusColor[project.status] + "20", color: statusColor[project.status] }}>
            {statusLabel[project.status]}
          </span>
          {expanded
            ? <ChevronUp className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
            : <ChevronDown className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />}
        </div>
      </button>

      {/* Expanded detail panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t" style={{ borderColor: "var(--color-border)" }}>

              {/* Images strip */}
              {project.images?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto px-5 pt-4 pb-0"
                  style={{ scrollbarWidth: "none" }}>
                  {project.images.map((img, i) => (
                    <div key={img.id ?? i} className="flex-shrink-0 rounded-lg overflow-hidden border"
                      style={{ borderColor: "var(--color-border)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.imageUrl} alt={img.description}
                        className="h-28 w-44 object-cover" />
                      {img.description && (
                        <p className="text-xs px-2 py-1 truncate max-w-[176px]"
                          style={{ color: "var(--color-muted-foreground)", backgroundColor: "var(--color-background)" }}>
                          {img.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="px-5 py-5 space-y-5">

                {/* Specs grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <SpecItem icon={<DollarSign className="h-3.5 w-3.5" />} label="Budget">
                    ${Number(project.budget).toLocaleString()}
                  </SpecItem>
                  <SpecItem icon={<Calendar className="h-3.5 w-3.5" />} label="Deadline">
                    {new Date(project.deadline).toLocaleDateString()}
                    <span className="ml-1.5 font-medium" style={{ color: dayColor }}>
                      ({days === 0 ? "due today" : `${days}d left`})
                    </span>
                  </SpecItem>
                  <SpecItem icon={<Tag className="h-3.5 w-3.5" />} label="Category">
                    {project.categoryDisplayName ?? "—"}
                  </SpecItem>
                  <SpecItem icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Funded">
                    <span style={{ color: project.funded ? "#22c55e" : "#f59e0b" }}>
                      {project.funded ? "Yes — funds deposited" : "Not yet funded"}
                    </span>
                  </SpecItem>
                  <SpecItem icon={<Hash className="h-3.5 w-3.5" />} label="Status">
                    <span style={{ color: statusColor[project.status] }}>{statusLabel[project.status]}</span>
                  </SpecItem>
                  {project.constructionLocation && (
                    <SpecItem icon={<MapPin className="h-3.5 w-3.5" />} label="Location">
                      {project.constructionLocation}
                    </SpecItem>
                  )}
                  <SpecItem icon={<ImageIcon className="h-3.5 w-3.5" />} label="Images">
                    {project.images?.length ?? 0} attached
                  </SpecItem>
                  <SpecItem icon={<User className="h-3.5 w-3.5" />} label="Provider ID">
                    <span className="font-mono text-xs">{project.providerId.slice(0, 12)}…</span>
                  </SpecItem>
                  <SpecItem icon={<Clock className="h-3.5 w-3.5" />} label="Posted">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "—"}
                  </SpecItem>
                </div>

                {/* Assigned worker */}
                {project.assignedWorkerId && (
                  <div className="rounded-lg border px-4 py-3"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-muted-foreground)" }}>
                      ASSIGNED WORKER
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: avatarColor(project.assignedWorkerId) }}>
                        {workerNames[project.assignedWorkerId]
                          ? initials(workerNames[project.assignedWorkerId])
                          : <User className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                          {workerNames[project.assignedWorkerId] ?? "Loading…"}
                        </p>
                        <p className="text-xs font-mono" style={{ color: "var(--color-muted-foreground)" }}>
                          {project.assignedWorkerId.slice(0, 16)}…
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Required skills */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-muted-foreground)" }}>
                    REQUIRED SKILLS
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.requiredSkills.split(/[,;]+/).map((s, i) => s.trim() && (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full border"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)", backgroundColor: "var(--color-background)" }}>
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scope of work */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-muted-foreground)" }}>
                    SCOPE OF WORK
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--color-foreground)" }}>
                    {project.scopeOfWork}
                  </p>
                </div>

                {/* AI Candidates — for all OPEN projects */}
                {project.status === "OPEN" && (
                  <div className="rounded-xl border overflow-hidden"
                    style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{ backgroundColor: "var(--color-neutral-50)", borderBottom: candidates[project.id] ? "1px solid var(--color-border)" : undefined }}>
                      <p className="text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "var(--color-muted-foreground)" }}>
                        AI-Ranked Candidates {candidates[project.id] ? `— ${candidates[project.id].length}` : ""}
                      </p>
                      {!candidates[project.id] && (
                        <button onClick={() => onLoadCandidates(project.id)}
                          disabled={candidateLoading === project.id}
                          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition"
                          style={{ backgroundColor: "var(--color-primary)" }}>
                          {candidateLoading === project.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Star className="h-3.5 w-3.5" />}
                          Load Candidates
                        </button>
                      )}
                    </div>

                    {candidates[project.id] && (
                      <div className="p-4" style={{ backgroundColor: "var(--color-neutral-50)" }}>
                        {candidates[project.id].length === 0 ? (
                          <p className="text-sm py-2 text-center" style={{ color: "var(--color-muted-foreground)" }}>
                            No matching workers found.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {candidates[project.id].map((w, rank) => {
                              const ratingPct = Math.min(100, (w.ratingScore / 10) * 100);
                              const ratingColor = w.ratingScore >= 7 ? "#22c55e" : w.ratingScore >= 4 ? "#f59e0b" : "#ef4444";
                              const medalColors = ["#f59e0b", "#94a3b8", "#b45309"];
                              return (
                                <div key={w.workerId}
                                  className="rounded-xl border p-4 space-y-3 relative overflow-hidden"
                                  style={{
                                    backgroundColor: "var(--color-card)",
                                    borderColor: rank === 0 ? "#f59e0b60" : "var(--color-border)",
                                  }}>
                                  <div className="absolute top-0 right-0 h-7 w-7 flex items-center justify-center rounded-bl-xl text-white text-xs font-bold"
                                    style={{ backgroundColor: medalColors[rank] ?? "var(--color-neutral-400)" }}>
                                    {rank + 1}
                                  </div>
                                  <div className="flex items-center gap-3 pr-6">
                                    <div className="h-11 w-11 rounded-full overflow-hidden flex items-center justify-center text-white font-bold flex-shrink-0"
                                      style={{ backgroundColor: avatarColor(w.workerId) }}>
                                      {w.profileImageUrl
                                        ? <img src={w.profileImageUrl} alt={w.workerName} className="h-full w-full object-cover" />
                                        : initials(w.workerName)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm truncate" style={{ color: "var(--color-foreground)" }}>
                                        {w.workerName}
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <Mail className="h-3 w-3 flex-shrink-0" style={{ color: "var(--color-neutral-400)" }} />
                                        <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>
                                          {w.workerEmail}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <p className="truncate" style={{ color: "var(--color-muted-foreground)" }}>{w.specialization}</p>
                                    <p style={{ color: "var(--color-muted-foreground)" }}>{w.yearsOfExperience} yrs exp</p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                      <span className="flex items-center gap-1" style={{ color: "var(--color-muted-foreground)" }}>
                                        <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                                        AI Rating
                                      </span>
                                      <span style={{ color: ratingColor }}>{w.ratingScore.toFixed(1)}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                                      <div className="h-1.5 rounded-full"
                                        style={{ width: `${ratingPct}%`, backgroundColor: ratingColor }} />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <Award className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                                      <span className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>
                                        {w.rankScore.toFixed(0)}% match
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => onAssign(project.id, w.workerId, w.workerName)}
                                      disabled={assigning === `${project.id}-${w.workerId}`}
                                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition"
                                      style={{ backgroundColor: "#22c55e" }}>
                                      {assigning === `${project.id}-${w.workerId}`
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <UserCheck className="h-3.5 w-3.5" />}
                                      Assign
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SpecItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border px-3 py-2.5"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
      <div className="flex items-center gap-1.5 mb-1" style={{ color: "var(--color-muted-foreground)" }}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
        {children}
      </div>
    </div>
  );
}
