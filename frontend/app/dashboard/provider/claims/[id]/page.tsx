"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, FileText, MessageSquare, Pencil, Trash2, X, Upload, Loader2, AlertTriangle, Download } from "lucide-react";
import { toast } from "react-toastify";
import { claimService, ClaimResponse } from "@/lib/claimService";
import { authService } from "@/lib/authService";
import { generateClaimReportPdf } from "@/lib/pdfReport";

const statusColor: Record<string, string> = {
  PENDING: "#f59e0b", UNDER_REVIEW: "#3b82f6", APPROVED: "#22c55e", REJECTED: "#ef4444",
};

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [claim, setClaim] = useState<ClaimResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [newProofFiles, setNewProofFiles] = useState<File[]>([]);
  const [newGhostFiles, setNewGhostFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const proofInputRef = useRef<HTMLInputElement>(null);
  const ghostInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    claimService.getClaim(id)
      .then(setClaim)
      .catch(() => toast.error("Claim not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    if (!claim) return;
    setEditDesc(claim.description);
    setNewProofFiles([]);
    setNewGhostFiles([]);
    setEditing(true);
  };

  const handleDelete = async () => {
    if (!claim) return;
    setDeleting(true);
    try {
      await claimService.deleteClaim(claim.id);
      toast.success("Claim deleted.");
      router.push("/dashboard/provider/claims");
    } catch {
      toast.error("Failed to delete claim.");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!claim) return;
    setGeneratingPdf(true);
    try {
      const session = authService.getSession();
      await generateClaimReportPdf(claim, {
        fullName: session?.fullName ?? "Unknown User",
        role: session?.role ?? "USER",
      });
    } catch {
      toast.error("Failed to generate PDF report.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setNewProofFiles([]);
    setNewGhostFiles([]);
  };

  const handleSave = async () => {
    if (!claim || !editDesc.trim()) return;
    setSaving(true);
    try {
      const updated = await claimService.updateClaim(
        claim.id,
        editDesc.trim(),
        newProofFiles,
        newGhostFiles,
        claim.messageEvidence ?? null
      );
      setClaim(updated);
      setEditing(false);
      toast.success("Claim updated.");
    } catch {
      toast.error("Failed to update claim.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--color-primary)" }} />
    </div>
  );

  if (!claim) return null;

  const isPending = claim.status === "PENDING";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/dashboard/provider/claims"
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: "var(--color-muted-foreground)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to claims
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 style={{ color: "var(--color-primary-800)" }}>Claim #{claim.id.slice(0, 8)}</h3>
            <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
              Filed {new Date(claim.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ backgroundColor: statusColor[claim.status] + "20", color: statusColor[claim.status] }}>
              {claim.status.replace("_", " ")}
            </span>
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-muted)", color: "var(--color-foreground)", border: "1px solid var(--color-border)" }}>
              {generatingPdf
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                : <><Download className="h-3.5 w-3.5" /> Download PDF Report</>}
            </button>
            {isPending && !editing && (
              <>
                <button
                  onClick={openEdit}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                  style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                  style={{ backgroundColor: "#ef444420", color: "#ef4444" }}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmingDelete && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl border-2 p-5 space-y-3"
            style={{ backgroundColor: "var(--color-card)", borderColor: "#ef4444" }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: "#ef4444" }} />
              <h5 className="font-semibold" style={{ color: "#ef4444" }}>Delete Claim Permanently?</h5>
            </div>
            <p className="text-sm" style={{ color: "var(--color-foreground)" }}>
              This action cannot be undone. The claim and all uploaded evidence will be permanently removed.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                style={{ backgroundColor: "#ef4444" }}>
                {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</> : <><Trash2 className="h-4 w-4" /> Delete Permanently</>}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="rounded-lg border px-4 py-2 text-sm transition hover:opacity-70"
                style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit form */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl border p-5 space-y-4"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-primary)", borderWidth: "2px" }}
          >
            <div className="flex items-center justify-between">
              <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>Edit Claim</h5>
              <button onClick={cancelEdit} style={{ color: "var(--color-muted-foreground)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>Description</label>
              <textarea
                rows={4}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-foreground)",
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                Replace Proof Documents
                <span className="font-normal ml-1" style={{ color: "var(--color-muted-foreground)" }}>
                  (leave empty to keep existing)
                </span>
              </label>
              <input
                ref={proofInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setNewProofFiles(Array.from(e.target.files ?? []))}
              />
              <button
                onClick={() => proofInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:opacity-80"
                style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                <Upload className="h-4 w-4" />
                {newProofFiles.length > 0 ? `${newProofFiles.length} file(s) selected` : "Upload new proof documents"}
              </button>
              {newProofFiles.length > 0 && (
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  {newProofFiles.map(f => f.name).join(", ")}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                Replace Ghost Project Images
                <span className="font-normal ml-1" style={{ color: "var(--color-muted-foreground)" }}>
                  (leave empty to keep existing)
                </span>
              </label>
              <input
                ref={ghostInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => setNewGhostFiles(Array.from(e.target.files ?? []))}
              />
              <button
                onClick={() => ghostInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:opacity-80"
                style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                <Upload className="h-4 w-4" />
                {newGhostFiles.length > 0 ? `${newGhostFiles.length} image(s) selected` : "Upload new ghost project images"}
              </button>
              {newGhostFiles.length > 0 && (
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  {newGhostFiles.map(f => f.name).join(", ")}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !editDesc.trim()}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save Changes"}
              </button>
              <button
                onClick={cancelEdit}
                className="rounded-lg border px-4 py-2 text-sm transition hover:opacity-70"
                style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Description */}
      <Section title="Description">
        <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{claim.description}</p>
      </Section>

      {claim.proofDocumentUrls.length > 0 && (
        <Section title={`Proof Documents (${claim.proofDocumentUrls.length})`}>
          <div className="space-y-2">
            {claim.proofDocumentUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--color-primary)" }}>
                <FileText className="h-4 w-4" />
                Document {i + 1}
              </a>
            ))}
          </div>
        </Section>
      )}

      {claim.ghostProjectImageUrls && claim.ghostProjectImageUrls.length > 0 && (
        <Section title={`Ghost Project Images (${claim.ghostProjectImageUrls.length})`}>
          <div className="grid grid-cols-3 gap-2">
            {claim.ghostProjectImageUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-24 object-cover rounded-lg border"
                  style={{ borderColor: "var(--color-border)" }} />
              </a>
            ))}
          </div>
        </Section>
      )}

      {(claim.extractedLat || claim.extractedLon) && (
        <Section title="Geotagged Photo Verification">
          <div className="space-y-2">
            {claim.geotagPhotoUrl && (
              <a href={claim.geotagPhotoUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm" style={{ color: "var(--color-primary)" }}>
                View photo
              </a>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" style={{ color: "var(--color-neutral-400)" }} />
              <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
                {claim.extractedLat?.toFixed(6)}, {claim.extractedLon?.toFixed(6)}
              </span>
            </div>
            {claim.extractedPhotoTimestamp && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: "var(--color-neutral-400)" }} />
                <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
                  {claim.extractedPhotoTimestamp}
                </span>
              </div>
            )}
          </div>
        </Section>
      )}

      {claim.workerResponse && (
        <Section title="Worker Response">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-0.5" style={{ color: "var(--color-neutral-400)" }} />
            <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{claim.workerResponse}</p>
          </div>
        </Section>
      )}

      {claim.aiMediationReport && (
        <Section title="AI Mediation Report">
          <p className="text-sm" style={{ color: "var(--color-foreground)" }}>{claim.aiMediationReport}</p>
        </Section>
      )}

      {isPending && (
        <p className="text-xs text-center pb-2" style={{ color: "var(--color-muted-foreground)" }}>
          You can edit this claim while it is still pending review.
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-5 space-y-3"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>{title}</h5>
      {children}
    </motion.div>
  );
}
