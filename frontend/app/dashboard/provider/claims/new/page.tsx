"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, X, MessageSquare, Camera, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { claimService, type MessageEvidenceItem } from "@/lib/claimService";
import { projectService, type ProjectResponse } from "@/lib/projectService";


const schema = z.object({
  description: z.string().min(20, "Please provide a detailed description (at least 20 characters)"),
});

type FormData = z.infer<typeof schema>;

export default function FileClaimPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [ghostImages, setGhostImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const [msgFrom, setMsgFrom] = useState("");
  const [msgTo, setMsgTo] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [fetchedMessages, setFetchedMessages] = useState<MessageEvidenceItem[] | null>(null);
  const [msgExpanded, setMsgExpanded] = useState(false);
  const [msgSectionOpen, setMsgSectionOpen] = useState(false);
  const [ghostSectionOpen, setGhostSectionOpen] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (projectId) {
      projectService.getProject(projectId).then(setProject).catch(() => {});
    }
  }, [projectId]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const onGhostFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setGhostImages(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));
  const removeGhostImage = (index: number) => setGhostImages(prev => prev.filter((_, i) => i !== index));

  const fetchMessages = async () => {
    if (!project?.assignedWorkerId) {
      toast.error("No worker assigned to this project.");
      return;
    }
    if (!msgFrom || !msgTo) {
      toast.error("Please select both from and to dates.");
      return;
    }
    setMsgLoading(true);
    try {
      const fromDt = msgFrom + "T00:00:00";
      const toDt = msgTo + "T23:59:59";
      const messages = await claimService.getMessageRange(
        project.assignedWorkerId, fromDt, toDt
      );
      setFetchedMessages(messages);
      if (messages.length === 0) {
        toast.info("No messages found in this date range.");
      }
    } catch {
      toast.error("Failed to fetch messages.");
    } finally {
      setMsgLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!projectId) { toast.error("No project selected."); return; }
    setLoading(true);
    try {
      const messageEvidenceJson = fetchedMessages && fetchedMessages.length > 0
        ? JSON.stringify(fetchedMessages)
        : null;

      const claim = await claimService.fileClaim(
        projectId,
        data.description,
        files,
        ghostImages,
        messageEvidenceJson
      );
      toast.success("Claim filed successfully!");
      router.push(`/dashboard/provider/claims/${claim.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to file claim.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isConstruction = project?.category === "CONSTRUCTION";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/dashboard/provider/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: "var(--color-muted-foreground)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to project
        </Link>
        <h3 style={{ color: "var(--color-primary-800)" }}>File a Claim</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Describe the failure and attach supporting evidence.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-6"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Description of Failure
            </label>
            <textarea {...register("description")} rows={5}
              placeholder="Describe what went wrong, how the worker failed to deliver, and any supporting context..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
              style={{
                borderColor: errors.description ? "#ef4444" : "var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-foreground)",
              }} />
            {errors.description && (
              <p className="text-xs" style={{ color: "#ef4444" }}>{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Proof Documents
            </label>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              Upload screenshots, contracts, or photos. JPEG photos with GPS data will have location automatically extracted.
            </p>
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed p-4 transition"
              style={{ borderColor: "var(--color-border)" }}>
              <Upload className="h-5 w-5" style={{ color: "var(--color-neutral-400)" }} />
              <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                Click to upload files
              </span>
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx"
                onChange={onFileChange} className="hidden" />
            </label>
            {files.length > 0 && (
              <div className="space-y-2 mt-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-sm truncate" style={{ color: "var(--color-foreground)" }}>{f.name}</span>
                    <button type="button" onClick={() => removeFile(i)}>
                      <X className="h-4 w-4" style={{ color: "var(--color-neutral-400)" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Additional Evidence
            </p>

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
              <button
                type="button"
                onClick={() => setMsgSectionOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition hover:opacity-80"
                style={{ backgroundColor: "var(--color-neutral-50)" }}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" style={{ color: "var(--color-primary-600)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                    Add Message Evidence
                  </span>
                  {fetchedMessages && fetchedMessages.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                      style={{ backgroundColor: "var(--color-primary)" }}>
                      {fetchedMessages.length} messages
                    </span>
                  )}
                </div>
                {msgSectionOpen ? <ChevronUp className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
                  : <ChevronDown className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />}
              </button>

              <AnimatePresence>
                {msgSectionOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                      <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                        Select a date range to fetch the messages you exchanged with the worker during that period.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>From</label>
                          <input type="date" value={msgFrom}
                            onChange={e => setMsgFrom(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>To</label>
                          <input type="date" value={msgTo}
                            onChange={e => setMsgTo(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }} />
                        </div>
                      </div>
                      <button type="button" onClick={fetchMessages} disabled={msgLoading}
                        className="rounded-lg px-4 py-2 text-sm font-medium transition"
                        style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
                        {msgLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Fetching…
                          </span>
                        ) : "Fetch Messages"}
                      </button>

                      {fetchedMessages !== null && (
                        <div className="space-y-2">
                          {fetchedMessages.length === 0 ? (
                            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                              No messages found in this date range.
                            </p>
                          ) : (
                            <>
                              <button type="button" onClick={() => setMsgExpanded(v => !v)}
                                className="text-xs font-medium"
                                style={{ color: "var(--color-primary-600)" }}>
                                {msgExpanded ? "Hide" : "Preview"} {fetchedMessages.length} message{fetchedMessages.length > 1 ? "s" : ""}
                              </button>
                              <AnimatePresence>
                                {msgExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border p-2"
                                      style={{ borderColor: "var(--color-border)" }}>
                                      {fetchedMessages.map(m => (
                                        <div key={m.id} className="text-xs">
                                          <span className="font-medium" style={{ color: "var(--color-foreground)" }}>
                                            {m.senderName}
                                          </span>
                                          <span className="ml-2" style={{ color: "var(--color-muted-foreground)" }}>
                                            {new Date(m.sentAt).toLocaleString()}
                                          </span>
                                          <p className="mt-0.5" style={{ color: "var(--color-foreground)" }}>{m.text}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              <p className="text-xs" style={{ color: "var(--color-primary-700)" }}>
                                These messages will be included as evidence in the claim.
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isConstruction && (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <button
                  type="button"
                  onClick={() => setGhostSectionOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition hover:opacity-80"
                  style={{ backgroundColor: "var(--color-neutral-50)" }}
                >
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" style={{ color: "#ef4444" }} />
                    <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                      Ghost Project Images
                    </span>
                    {ghostImages.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                        style={{ backgroundColor: "#ef4444" }}>
                        {ghostImages.length} image{ghostImages.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {ghostSectionOpen ? <ChevronUp className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
                    : <ChevronDown className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />}
                </button>

                <AnimatePresence>
                  {ghostSectionOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                        <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                          Upload photos of the wrongly-constructed place. The AI will automatically analyse the images to verify whether they match the project location.
                        </p>

                        <label className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed p-4 transition"
                          style={{ borderColor: "#fca5a5" }}>
                          <Camera className="h-5 w-5" style={{ color: "#ef4444" }} />
                          <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                            Click to upload construction site photos
                          </span>
                          <input type="file" multiple accept="image/*"
                            onChange={onGhostFileChange} className="hidden" />
                        </label>

                        {ghostImages.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {ghostImages.map((f, i) => (
                              <div key={i} className="relative rounded-lg overflow-hidden border"
                                style={{ borderColor: "var(--color-border)" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={URL.createObjectURL(f)} alt="" className="w-full h-24 object-cover" />
                                <button type="button" onClick={() => removeGhostImage(i)}
                                  className="absolute top-1 right-1 rounded-full p-0.5"
                                  style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                                  <X className="h-3 w-3 text-white" />
                                </button>
                                <p className="text-[10px] truncate px-1 py-0.5"
                                  style={{ color: "var(--color-muted-foreground)" }}>{f.name}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            style={{ backgroundColor: "#ef4444" }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Submitting…
              </span>
            ) : "Submit Claim"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
