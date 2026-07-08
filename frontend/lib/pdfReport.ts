import { jsPDF } from "jspdf";

export interface ReportableClaim {
  id: string;
  projectId: string;
  description: string;
  status: string;
  proofDocumentUrls: string[];
  ghostProjectImageUrls: string[];
  messageEvidence: string | null;
  extractedLat: number | null;
  extractedLon: number | null;
  extractedPhotoTimestamp: string | null;
  workerResponse: string | null;
  aiMediationReport: string | null;
  projectBudget: number | null;
  createdAt: string;
  updatedAt: string;
}

const BRAND_PURPLE: [number, number, number] = [91, 79, 229];
const TEXT_DARK: [number, number, number] = [15, 23, 42];
const TEXT_MUTED: [number, number, number] = [100, 116, 139];
const BORDER: [number, number, number] = [226, 232, 240];

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = PAGE_HEIGHT - 14;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REFUND_INITIATED: "Refund Initiated",
  REFUNDED: "Refunded",
};

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/ced.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

interface GeneratedBy {
  fullName: string;
  role: string;
}

export async function generateClaimReportPdf(
  claim: ReportableClaim,
  generatedBy: GeneratedBy
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadLogoDataUrl();
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > FOOTER_Y - 4) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const divider = (color: [number, number, number] = BORDER) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  };

  // ── Header ──
  if (logo) {
    try {
      doc.addImage(logo, "PNG", MARGIN, y, 20, 20);
    } catch {
      // ignore malformed image, continue without it
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_DARK);
  doc.text("RG Partners", MARGIN + 24, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Financial Services & Investment Advisory", MARGIN + 24, y + 12.5);
  doc.text("Service Failure Refund System (SSFRS)", MARGIN + 24, y + 17.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Generated: ${new Date().toLocaleString()}`, PAGE_WIDTH - MARGIN, y + 7, { align: "right" });

  y += 24;
  divider(BRAND_PURPLE);
  y += 10;

  // ── Title ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Refund Claim Report", MARGIN, y);
  y += 8;

  // ── Meta info grid ──
  const metaRows: [string, string][] = [
    ["Claim ID", claim.id],
    ["Status", STATUS_LABEL[claim.status] ?? claim.status],
    ["Project ID", claim.projectId],
    ["Filed", new Date(claim.createdAt).toLocaleString()],
    ["Last Updated", new Date(claim.updatedAt).toLocaleString()],
  ];
  if (claim.projectBudget != null) {
    metaRows.push(["Refund Amount", currency(claim.projectBudget)]);
  }

  doc.setFontSize(10);
  for (const [label, value] of metaRows) {
    ensureSpace(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(`${label}:`, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_MUTED);
    const wrapped = doc.splitTextToSize(value, CONTENT_WIDTH - 38);
    doc.text(wrapped, MARGIN + 38, y);
    y += 5 * Math.max(1, wrapped.length);
  }
  y += 4;

  // ── Section helper ──
  const addSection = (title: string, body: string | string[]) => {
    ensureSpace(14);
    divider();
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND_PURPLE);
    doc.text(title, MARGIN, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT_DARK);

    const lines = Array.isArray(body) ? body : doc.splitTextToSize(body, CONTENT_WIDTH);
    for (const line of lines) {
      ensureSpace(5);
      doc.text(line, MARGIN, y);
      y += 5;
    }
    y += 2;
  };

  addSection("Claim Description", claim.description);

  if (claim.workerResponse) {
    addSection("Worker Response", claim.workerResponse);
  }

  if (claim.aiMediationReport) {
    addSection("AI Mediation Report", claim.aiMediationReport);
  }

  if (claim.messageEvidence) {
    try {
      const messages = JSON.parse(claim.messageEvidence) as {
        senderName: string;
        text: string;
        sentAt: string;
      }[];
      if (messages.length > 0) {
        const lines = messages.flatMap((m) => {
          const header = `${m.senderName} — ${new Date(m.sentAt).toLocaleString()}`;
          const wrapped = doc.splitTextToSize(m.text, CONTENT_WIDTH - 4);
          return [header, ...wrapped.map((w: string) => `  ${w}`), ""];
        });
        addSection(`Message Evidence (${messages.length})`, lines);
      }
    } catch {
      // malformed message evidence JSON, skip section
    }
  }

  if (claim.proofDocumentUrls.length > 0) {
    const lines = claim.proofDocumentUrls.map((_, i) => `Document ${i + 1} — attached (see original claim record)`);
    addSection(`Proof Documents (${claim.proofDocumentUrls.length})`, lines);
  }

  if (claim.ghostProjectImageUrls && claim.ghostProjectImageUrls.length > 0) {
    const lines = claim.ghostProjectImageUrls.map((_, i) => `Image ${i + 1} — attached (see original claim record)`);
    addSection(`Ghost Project Images (${claim.ghostProjectImageUrls.length})`, lines);
  }

  if (claim.extractedLat != null || claim.extractedLon != null) {
    const lines: string[] = [];
    if (claim.extractedLat != null && claim.extractedLon != null) {
      lines.push(`Coordinates: ${claim.extractedLat.toFixed(6)}, ${claim.extractedLon.toFixed(6)}`);
    }
    if (claim.extractedPhotoTimestamp) {
      lines.push(`Photo Timestamp: ${claim.extractedPhotoTimestamp}`);
    }
    addSection("Geotagged Photo Verification", lines);
  }

  // ── Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, FOOTER_Y - 4, PAGE_WIDTH - MARGIN, FOOTER_Y - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      `Generated by ${generatedBy.fullName} (${generatedBy.role})`,
      MARGIN,
      FOOTER_Y
    );
    doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - MARGIN, FOOTER_Y, { align: "right" });
    doc.text("SSFRS · Confidential", PAGE_WIDTH / 2, FOOTER_Y, { align: "center" });
  }

  doc.save(`refund-claim-${claim.id.slice(0, 8)}.pdf`);
}
