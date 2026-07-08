"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Calendar, DollarSign, ChevronLeft, ChevronRight, X, Images } from "lucide-react";
import { toast } from "react-toastify";
import { projectService, ProjectResponse, ProjectImageResponse } from "@/lib/projectService";

const statusColor: Record<string, string> = {
  OPEN: "#22c55e", ASSIGNED: "#3b82f6", COMPLETED: "#8b5cf6", FAILED: "#ef4444",
};

export default function WorkerProjectsPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: ProjectImageResponse[]; index: number } | null>(null);

  useEffect(() => {
    projectService.getAssignedProjects()
      .then(setProjects)
      .catch(() => toast.error("Failed to load projects."))
      .finally(() => setLoading(false));
  }, []);

  // Keyboard nav
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setLightbox(lb => lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : null);
      if (e.key === "ArrowLeft") setLightbox(lb => lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : null);
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>My Assigned Projects</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Projects you have been assigned to deliver.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-primary)" }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <Briefcase className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-neutral-300)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            No projects assigned yet
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Submit your CV to get matched with projects.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p, i) => {
            const images = p.images ?? [];
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>

                {/* Banner image strip (if images exist) */}
                {images.length > 0 && (
                  <div className="flex gap-0.5 overflow-hidden" style={{ height: "120px" }}>
                    {images.slice(0, 4).map((img, idx) => (
                      <button key={img.id}
                        onClick={() => setLightbox({ images, index: idx })}
                        className="relative flex-1 overflow-hidden group"
                        style={{ minWidth: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.imageUrl} alt={img.description}
                          className="h-full w-full object-cover transition group-hover:scale-105 duration-300" />
                        {/* +N overlay on last visible if more */}
                        {idx === 3 && images.length > 4 && (
                          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                            +{images.length - 4}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>{p.title}</h5>
                    <div className="flex items-center gap-2">
                      {images.length > 0 && (
                        <button onClick={() => setLightbox({ images, index: 0 })}
                          className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border transition"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}>
                          <Images className="h-3 w-3" />
                          {images.length}
                        </button>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: statusColor[p.status] + "20", color: statusColor[p.status] }}>
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                    {p.scopeOfWork}
                  </p>

                  <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Deadline: {new Date(p.deadline).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {Number(p.budget).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                      REQUIRED SKILLS
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: "var(--color-foreground)" }}>
                      {p.requiredSkills}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
            onClick={() => setLightbox(null)}>
            <button className="absolute top-4 right-4 text-white z-10 p-1 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              onClick={() => setLightbox(null)}>
              <X className="h-5 w-5" />
            </button>
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/70">
              {lightbox.index + 1} / {lightbox.images.length}
            </p>
            {lightbox.images.length > 1 && (
              <button className="absolute left-4 text-white p-2 rounded-full z-10"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                onClick={(e) => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : null); }}>
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <motion.div key={lightbox.index}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center gap-3 px-16 max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightbox.images[lightbox.index].imageUrl}
                alt={lightbox.images[lightbox.index].description}
                className="max-h-[75vh] max-w-full rounded-xl object-contain" />
              <div className="text-center">
                <p className="text-sm font-medium text-white">{lightbox.images[lightbox.index].description}</p>
                <p className="text-xs mt-0.5 text-white/50">Image {lightbox.index + 1} of {lightbox.images.length}</p>
              </div>
            </motion.div>
            {lightbox.images.length > 1 && (
              <button className="absolute right-4 text-white p-2 rounded-full z-10"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                onClick={(e) => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : null); }}>
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
