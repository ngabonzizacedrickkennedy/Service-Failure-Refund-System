"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ImagePlus, X, Edit3, ChevronDown, MapPin } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { projectService, PROJECT_CATEGORIES, type ProjectCategoryValue } from "@/lib/projectService";

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  scopeOfWork: z.string().min(10, "Please describe the scope of work"),
  requiredSkills: z.string().min(2, "Required skills are needed"),
  deadline: z.string().min(1, "Deadline is required"),
  budget: z.number({ error: "Budget must be a number" }).positive("Budget must be greater than 0"),
});

type FormData = z.infer<typeof schema>;

interface ImageEntry {
  id: string;
  file: File;
  preview: string;
  description: string;
}

const inputBase =
  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 transition";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ProjectCategoryValue | "">("");
  const [categoryError, setCategoryError] = useState("");
  const [constructionLocation, setConstructionLocation] = useState("");
  const [locationError, setLocationError] = useState("");
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const border = (hasError: boolean) => ({
    borderColor: hasError ? "#ef4444" : "var(--color-border)",
    backgroundColor: "var(--color-background)",
    color: "var(--color-foreground)",
  });

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newEntries: ImageEntry[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      description: "",
    }));
    setImageEntries((prev) => [...prev, ...newEntries]);
    e.target.value = "";
  };

  const updateDescription = (id: string, desc: string) => {
    setImageEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, description: desc } : e))
    );
  };

  const removeImage = (id: string) => {
    setImageEntries((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter((e) => e.id !== id);
    });
    if (editingId === id) setEditingId(null);
  };

  const onSubmit = async (data: FormData) => {
    if (!category) {
      setCategoryError("Please select a field of expertise.");
      return;
    }
    setCategoryError("");

    if (category === "CONSTRUCTION" && !constructionLocation.trim()) {
      setLocationError("Construction location is required for construction projects.");
      return;
    }
    setLocationError("");

    setLoading(true);
    try {
      await projectService.createProject({
        ...data,
        category: category as ProjectCategoryValue,
        constructionLocation: category === "CONSTRUCTION" ? constructionLocation.trim() : undefined,
        images: imageEntries.map((e) => ({
          file: e.file,
          description: e.description.trim() || `Supporting image`,
        })),
      });
      toast.success("Project posted successfully!");
      router.push("/dashboard/provider/projects");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to post project.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/dashboard/provider/projects"
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <h3 style={{ color: "var(--color-primary-800)" }}>Post a Project</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Fill in the details and optionally attach supporting images.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-6"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Field label="Project Title" error={errors.title?.message}>
            <input
              {...register("title")}
              placeholder="e.g. Build a mobile app"
              className={inputBase}
              style={border(!!errors.title)}
            />
          </Field>

          <Field label="Scope of Work" error={errors.scopeOfWork?.message}>
            <textarea
              {...register("scopeOfWork")}
              rows={4}
              placeholder="Describe what needs to be done in detail…"
              className={inputBase + " resize-none"}
              style={border(!!errors.scopeOfWork)}
            />
          </Field>

          <Field label="Required Skills" error={errors.requiredSkills?.message}>
            <input
              {...register("requiredSkills")}
              placeholder="e.g. React, Node.js, PostgreSQL"
              className={inputBase}
              style={border(!!errors.requiredSkills)}
            />
          </Field>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Field of Expertise <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              Only workers whose expertise matches this field will be shown as candidates.
            </p>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as ProjectCategoryValue | "");
                  if (e.target.value) setCategoryError("");
                  if (e.target.value !== "CONSTRUCTION") {
                    setConstructionLocation("");
                    setLocationError("");
                  }
                }}
                className={inputBase + " appearance-none pr-8"}
                style={border(!!categoryError)}
              >
                <option value="">— Select the project field —</option>
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: "var(--color-muted-foreground)" }}
              />
            </div>
            {categoryError && (
              <p className="text-xs" style={{ color: "#ef4444" }}>{categoryError}</p>
            )}
          </div>

          <AnimatePresence>
            {category === "CONSTRUCTION" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-xl border p-4 space-y-3"
                  style={{
                    borderColor: locationError ? "#ef4444" : "var(--color-primary-200)",
                    backgroundColor: "color-mix(in srgb, var(--color-primary-50) 60%, transparent)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" style={{ color: "var(--color-primary-600)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--color-primary-800)" }}>
                      Construction Site Location
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                    Required for construction projects. Provide the address or description of the construction site.
                  </p>
                  <input
                    value={constructionLocation}
                    onChange={(e) => {
                      setConstructionLocation(e.target.value);
                      if (e.target.value.trim()) setLocationError("");
                    }}
                    placeholder="e.g. 123 Main Street, Kigali, Rwanda"
                    className={inputBase}
                    style={border(!!locationError)}
                  />
                  {locationError && (
                    <p className="text-xs" style={{ color: "#ef4444" }}>{locationError}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Deadline" error={errors.deadline?.message}>
              <input
                {...register("deadline")}
                type="date"
                className={inputBase}
                style={border(!!errors.deadline)}
              />
            </Field>
            <Field label="Budget ($)" error={errors.budget?.message}>
              <input
                {...register("budget", { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="5000"
                className={inputBase}
                style={border(!!errors.budget)}
              />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                  Supporting Images
                  <span className="ml-1 text-xs font-normal" style={{ color: "var(--color-muted-foreground)" }}>
                    (optional)
                  </span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                  Add images that give workers visual context. Describe what each one shows.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-foreground)",
                  backgroundColor: "var(--color-background)",
                }}
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Add Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilePick}
                className="hidden"
              />
            </div>

            <AnimatePresence>
              {imageEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex gap-3 rounded-xl border p-3"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-neutral-50)" }}
                  >
                    <div className="relative flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden"
                      style={{ border: "1px solid var(--color-border)" }}>
                      <img
                        src={entry.preview}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium truncate"
                          style={{ color: "var(--color-muted-foreground)" }}>
                          {entry.file.name}
                        </p>
                        <button type="button" onClick={() => removeImage(entry.id)}
                          className="flex-shrink-0 rounded p-0.5 transition"
                          style={{ color: "var(--color-neutral-400)" }}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {editingId === entry.id ? (
                        <input
                          autoFocus
                          value={entry.description}
                          onChange={(e) => updateDescription(entry.id, e.target.value)}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                          placeholder="Describe what this image shows…"
                          className="mt-2 w-full rounded-md border px-2 py-1 text-xs focus:outline-none"
                          style={{
                            borderColor: "var(--color-border)",
                            backgroundColor: "var(--color-background)",
                            color: "var(--color-foreground)",
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingId(entry.id)}
                          className="mt-2 flex items-center gap-1 text-left w-full group"
                        >
                          <Edit3 className="h-3 w-3 flex-shrink-0"
                            style={{ color: "var(--color-neutral-400)" }} />
                          <span className="text-xs truncate"
                            style={{
                              color: entry.description
                                ? "var(--color-foreground)"
                                : "var(--color-neutral-400)",
                            }}>
                            {entry.description || "Click to add a description…"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {imageEntries.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition"
                style={{ borderColor: "var(--color-border)" }}
              >
                <ImagePlus className="h-5 w-5" style={{ color: "var(--color-neutral-300)" }} />
                <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  Click to add supporting images
                </span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Posting…
              </span>
            ) : (
              `Post Project${imageEntries.length > 0 ? ` with ${imageEntries.length} image${imageEntries.length > 1 ? "s" : ""}` : ""}`
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}
