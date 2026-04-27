import { jsPDF } from "jspdf";
import { DEJAVU_SANS_REGULAR_BASE64, DEJAVU_SANS_BOLD_BASE64 } from "@/assets/pdf-fonts";
import { IDSS_SCHOOL } from "@/lib/idssRegulations";

/**
 * Centralized PDF theme & layout helpers for IDSS documents.
 * - Embeds DejaVu Sans (full Bosnian diacritics: č ć š ž đ Č Ć Š Ž Đ).
 * - Provides branded header/footer matching the official IDSS letterhead
 *   (see reference: Saglasnost roditelja Zagreb/Plitvice/Postojna 2026).
 */

// === Brand tokens (IDSS visual identity) ===
export const PDF_THEME = {
  // A4 portrait, 20mm margins
  page: { width: 210, height: 297 },
  margin: { top: 22, bottom: 26, left: 20, right: 20 },
  // Brand colors (RGB) — matched to the app's orange primary
  color: {
    primary: [230, 126, 34] as [number, number, number],
    primaryDark: [196, 96, 18] as [number, number, number],
    text: [33, 37, 41] as [number, number, number],
    muted: [110, 110, 110] as [number, number, number],
    subtle: [150, 150, 150] as [number, number, number],
    rule: [220, 220, 220] as [number, number, number],
    rowAlt: [248, 248, 248] as [number, number, number],
    cardBg: [252, 247, 240] as [number, number, number],
    danger: [185, 50, 50] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  },
  font: { family: "DejaVu" },
} as const;

let fontsRegistered = new WeakSet<jsPDF>();

/** Register DejaVu Sans on a jsPDF instance and set as default. */
export function registerIdssFonts(doc: jsPDF) {
  if (fontsRegistered.has(doc)) return;
  doc.addFileToVFS("DejaVuSans.ttf", DEJAVU_SANS_REGULAR_BASE64);
  doc.addFont("DejaVuSans.ttf", "DejaVu", "normal");
  doc.addFileToVFS("DejaVuSans-Bold.ttf", DEJAVU_SANS_BOLD_BASE64);
  doc.addFont("DejaVuSans-Bold.ttf", "DejaVu", "bold");
  // jsPDF doesn't have native italic for our subset — alias to regular.
  doc.addFont("DejaVuSans.ttf", "DejaVu", "italic");
  doc.setFont("DejaVu", "normal");
  fontsRegistered.add(doc);
}

/** Create a new branded A4 portrait PDF with fonts registered. */
export function createIdssPdf(): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerIdssFonts(doc);
  return doc;
}

/** Set RGB fill color from theme tuple. */
export function setFill(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}
/** Set RGB text color from theme tuple. */
export function setText(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}
/** Set RGB draw color from theme tuple. */
export function setDraw(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

/**
 * Draws the IDSS letterhead (legal name + address line + accent rule).
 * Returns the y position where content can start.
 */
export function drawHeader(doc: jsPDF): number {
  const { margin, color } = PDF_THEME;
  const cx = PDF_THEME.page.width / 2;

  // Top brand bar (thin)
  setFill(doc, color.primary);
  doc.rect(0, 0, PDF_THEME.page.width, 4, "F");

  // Legal name
  doc.setFont(PDF_THEME.font.family, "bold");
  doc.setFontSize(11);
  setText(doc, color.text);
  doc.text(IDSS_SCHOOL.legalName, cx, margin.top - 8, { align: "center" });

  // Contact line
  doc.setFont(PDF_THEME.font.family, "normal");
  doc.setFontSize(8.5);
  setText(doc, color.muted);
  doc.text(
    `${IDSS_SCHOOL.fullAddress}  ·  tel ${IDSS_SCHOOL.phone}  ·  ${IDSS_SCHOOL.email}`,
    cx,
    margin.top - 3,
    { align: "center" }
  );

  // Accent underline
  setDraw(doc, color.primary);
  doc.setLineWidth(0.4);
  doc.line(margin.left, margin.top, PDF_THEME.page.width - margin.right, margin.top);

  setText(doc, color.text);
  return margin.top + 6;
}

/** Draws the branded footer with bank info + page numbers. */
export function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const { color, margin } = PDF_THEME;
  const cx = PDF_THEME.page.width / 2;
  const baseY = PDF_THEME.page.height - 18;

  setDraw(doc, color.rule);
  doc.setLineWidth(0.3);
  doc.line(margin.left, baseY - 2, PDF_THEME.page.width - margin.right, baseY - 2);

  doc.setFont(PDF_THEME.font.family, "normal");
  doc.setFontSize(7);
  setText(doc, color.muted);

  const line1 = `${IDSS_SCHOOL.fullAddress}  |  tel ${IDSS_SCHOOL.phone}  ·  mob ${IDSS_SCHOOL.mobile}`;
  const line2 = `${IDSS_SCHOOL.bank.name} — ${IDSS_SCHOOL.bank.account}  |  IBAN: ${IDSS_SCHOOL.bank.iban}  |  SWIFT (BIC): ${IDSS_SCHOOL.bank.swift}`;
  const line3 = `ID broj: ${IDSS_SCHOOL.registration.idNumber}  |  REG broj: ${IDSS_SCHOOL.registration.regNumber}`;
  const line4 = `${IDSS_SCHOOL.website}  |  ${IDSS_SCHOOL.email}   ·   Stranica ${pageNum} od ${totalPages}`;

  doc.text(line1, cx, baseY + 1, { align: "center" });
  doc.text(line2, cx, baseY + 4.5, { align: "center" });
  doc.text(line3, cx, baseY + 8, { align: "center" });
  doc.text(line4, cx, baseY + 11.5, { align: "center" });

  setText(doc, PDF_THEME.color.text);
}

/** Apply header + footer on every page after content has been written. */
export function paginate(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawHeader(doc);
    drawFooter(doc, i, total);
  }
}

/** Returns a y value with a new page if `needed` mm won't fit. */
export function ensureSpace(
  doc: jsPDF,
  y: number,
  needed: number
): number {
  if (y + needed > PDF_THEME.page.height - PDF_THEME.margin.bottom) {
    doc.addPage();
    return PDF_THEME.margin.top + 6;
  }
  return y;
}

/** Draws an h1-style section title with an orange accent bar. */
export function drawSectionTitle(
  doc: jsPDF,
  text: string,
  y: number,
  opts: { fontSize?: number } = {}
): number {
  const { margin, color } = PDF_THEME;
  const fs = opts.fontSize ?? 13;
  y = ensureSpace(doc, y, fs * 0.5 + 4);
  setFill(doc, color.primary);
  doc.rect(margin.left, y - fs * 0.45, 3, fs * 0.55, "F");
  doc.setFont(PDF_THEME.font.family, "bold");
  doc.setFontSize(fs);
  setText(doc, color.text);
  doc.text(text, margin.left + 6, y);
  return y + fs * 0.5 + 3;
}

/** Draws a horizontal divider rule. */
export function drawDivider(doc: jsPDF, y: number): number {
  const { margin, color, page } = PDF_THEME;
  setDraw(doc, color.rule);
  doc.setLineWidth(0.3);
  doc.line(margin.left, y, page.width - margin.right, y);
  return y + 4;
}

/** Wraps text and writes it. Returns new y. */
export function writeWrapped(
  doc: jsPDF,
  text: string,
  y: number,
  opts: { fontSize?: number; bold?: boolean; italic?: boolean; color?: readonly [number, number, number]; indent?: number } = {}
): number {
  const fs = opts.fontSize ?? 9.5;
  const lh = fs * 0.45 + 1.4;
  const indent = opts.indent ?? 0;
  const maxW = PDF_THEME.page.width - PDF_THEME.margin.left - PDF_THEME.margin.right - indent;
  doc.setFont(PDF_THEME.font.family, opts.bold ? "bold" : opts.italic ? "italic" : "normal");
  doc.setFontSize(fs);
  setText(doc, opts.color ?? PDF_THEME.color.text);
  const lines = doc.splitTextToSize(text, maxW) as string[];
  for (const line of lines) {
    y = ensureSpace(doc, y, lh);
    doc.text(line, PDF_THEME.margin.left + indent, y);
    y += lh;
  }
  setText(doc, PDF_THEME.color.text);
  return y;
}

/** Key/value row, label bold. */
export function writeKeyValue(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  opts: { labelWidth?: number } = {}
): number {
  const lw = opts.labelWidth ?? 42;
  const fs = 9.5;
  const lh = fs * 0.45 + 1.6;
  y = ensureSpace(doc, y, lh + 1);
  doc.setFont(PDF_THEME.font.family, "bold");
  doc.setFontSize(fs);
  setText(doc, PDF_THEME.color.text);
  doc.text(label, PDF_THEME.margin.left, y);
  doc.setFont(PDF_THEME.font.family, "normal");
  const valX = PDF_THEME.margin.left + lw;
  const maxW = PDF_THEME.page.width - PDF_THEME.margin.right - valX;
  const lines = doc.splitTextToSize(value, maxW) as string[];
  lines.forEach((line, i) => {
    if (i > 0) {
      y += lh;
      y = ensureSpace(doc, y, lh);
    }
    doc.text(line, valX, y);
  });
  return y + lh;
}

/** Draws a checkbox at (x, y baseline) with label to the right. */
export function drawCheckbox(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  opts: { fontSize?: number; italic?: boolean } = {}
) {
  const fs = opts.fontSize ?? 9;
  setDraw(doc, PDF_THEME.color.text);
  doc.setLineWidth(0.3);
  doc.rect(x, y - fs * 0.4, 3.2, 3.2);
  doc.setFont(PDF_THEME.font.family, opts.italic ? "italic" : "normal");
  doc.setFontSize(fs);
  setText(doc, PDF_THEME.color.text);
  doc.text(label, x + 5, y);
}

export const PDF = PDF_THEME;
