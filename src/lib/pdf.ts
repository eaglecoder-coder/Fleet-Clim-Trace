/* Génération PDF — planches d'étiquettes QR A4, rapport d'anomalies signable,
   rapport de réconciliation d'inventaire. */
import { jsPDF } from "jspdf";
import { toPngDataUrl } from "./photos";

/* ---------- QR déterministe (même matrice que l'écran) ---------- */

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function qrMatrix(seed: string): boolean[] {
  const N = 21;
  const rnd = mulberry32(hashStr(seed));
  const inFinder = (r: number, c: number) =>
    (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
  const cells: boolean[] = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (inFinder(r, c)) { cells.push(false); continue; }
      if (r === 8 || c === 8) { cells.push((r + c) % 2 === 0); continue; }
      cells.push(rnd() < 0.46);
    }
  return cells;
}

/** QR → PNG data-URL (dessiné directement sur canvas). */
function qrDataUrl(seed: string, px = 280): string {
  const N = 21;
  const q = 2; // zone de silence
  const canvas = document.createElement("canvas");
  canvas.width = px; canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, px, px);
  const cell = px / (N + q * 2);
  const cells = qrMatrix(seed);
  const finder = (x0: number, y0: number) => {
    ctx.fillStyle = "#0a2a33";
    ctx.fillRect((x0 + q) * cell, (y0 + q) * cell, 7 * cell, 7 * cell);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect((x0 + q + 1) * cell, (y0 + q + 1) * cell, 5 * cell, 5 * cell);
    ctx.fillStyle = "#0a2a33";
    ctx.fillRect((x0 + q + 2) * cell, (y0 + q + 2) * cell, 3 * cell, 3 * cell);
  };
  ctx.fillStyle = "#0a2a33";
  cells.forEach((on, i) => {
    if (!on) return;
    const r = Math.floor(i / N), c = i % N;
    ctx.fillRect((c + q) * cell, (r + q) * cell, cell * 0.94, cell * 0.94);
  });
  finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
  return canvas.toDataURL("image/png");
}

/* ---------- helpers ---------- */

const INK: [number, number, number] = [10, 42, 51];
const TEAL: [number, number, number] = [10, 92, 104];
const MUTE: [number, number, number] = [110, 128, 133];

function header(doc: jsPDF, title: string, sub: string) {
  doc.setFillColor(...INK);
  doc.rect(0, 0, 210, 26, "F");
  doc.setFillColor(127, 216, 228);
  doc.rect(0, 26, 210, 1.4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 10, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(127, 216, 228);
  doc.text(sub, 10, 17.5);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, 200, 11, { align: "right" });
  doc.text("ClimaTrace — Groupe Kelvia", 200, 17.5, { align: "right" });
}

function signBlock(doc: jsPDF, y: number) {
  const w = 92;
  [["Visa du responsable de site", 10], ["Visa du gestionnaire de parc", 108]].forEach(([label, x]) => {
    doc.setDrawColor(170, 185, 185);
    doc.setLineDashPattern([], 0);
    doc.rect(x as number, y, w, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(label as string, (x as number) + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTE);
    doc.text("Nom :", (x as number) + 4, y + 15);
    doc.text("Date :", (x as number) + 4, y + 21);
    doc.text("Signature & cachet :", (x as number) + 4, y + 27);
  });
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) { doc.addPage(); return 32; }
  return y;
}

/* ---------- Planche d'étiquettes A4 ---------- */

export interface LabelItem {
  code: string;
  serial: string;
  brand: string;
  model: string;
  power?: string;
  loc: string;
  photo?: string;
}

export async function labelSheetPdf(items: LabelItem[], fileSuffix: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const cols = 4, cellW = 46.25, cellH = 40, gap = 3, x0 = 8, y0 = 32;
  const rows = 6;

  const qrCache = new Map<string, string>();
  const photoCache = new Map<string, string>();
  await Promise.all(
    items.map(async (it) => {
      qrCache.set(it.code, qrDataUrl(it.code));
      if (it.photo) {
        try { photoCache.set(it.code, await toPngDataUrl(it.photo, 320)); } catch { /* photo illisible — ignorée */ }
      }
    })
  );

  items.forEach((it, idx) => {
    const page = Math.floor(idx / (cols * rows));
    if (idx % (cols * rows) === 0) {
      if (page > 0) doc.addPage();
      header(doc, "PLAQUE D'ÉTIQUETTES QR — PARC CLIMATISATION", `Planche ${page + 1} · ${items.length} étiquette(s) · à découper puis coller sur l'unité intérieure`);
    }
    const i = idx % (cols * rows);
    const x = x0 + (i % cols) * (cellW + gap);
    const y = y0 + Math.floor(i / cols) * (cellH + gap);

    doc.setDrawColor(190, 203, 203);
    doc.setLineDashPattern([1.6, 1.6], 0);
    doc.rect(x, y, cellW, cellH);
    doc.setLineDashPattern([], 0);

    const qr = qrCache.get(it.code)!;
    doc.addImage(qr, "PNG", x + 2.4, y + 2.4, 20.5, 20.5);

    const photo = photoCache.get(it.code);
    if (photo) {
      doc.setDrawColor(210, 220, 220);
      doc.rect(x + 25, y + 2.4, 18.8, 14.5);
      doc.addImage(photo, "PNG", x + 25.4, y + 2.8, 18, 13.7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.8);
      doc.setTextColor(...MUTE);
      doc.text("photo unité", x + 25, y + 20.3);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...TEAL);
      doc.text(it.brand, x + 25, y + 7.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...MUTE);
      doc.text(it.model, x + 25, y + 12);
      doc.text(it.power ?? "", x + 25, y + 16.4);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(it.code, x + 2.4, y + 28.4);
    doc.setFont("courier", "normal");
    doc.setFontSize(6.6);
    doc.setTextColor(60, 80, 86);
    doc.text(`SN ${it.serial.slice(0, 22)}`, x + 2.4, y + 32.4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.setTextColor(...MUTE);
    const locLines = doc.splitTextToSize(it.loc, cellW - 5);
    doc.text(locLines.slice(0, 2), x + 2.4, y + 36.2);
  });

  const n = doc.getNumberOfPages();
  for (let pg = 1; pg <= n; pg++) {
    doc.setPage(pg);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTE);
    doc.text(`Page ${pg}/${n} — scanner le QR ouvre la fiche équipement · climatrice`, 105, 292, { align: "center" });
  }

  doc.save(`climatrice_etiquettes_${fileSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/* ---------- Rapport PDF des anomalies ---------- */

export interface AnomalyPdfRow {
  code: string; type: string; status: string;
  eqCode: string; serial: string;
  expected: string; observed?: string;
  detail: string; resolution?: string;
  declaredBy: string; declaredAt: string;
}

export function anomalyReportPdf(rows: AnomalyPdfRow[], openCount: number) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "RAPPORT DES ANOMALIES — PARC CLIMATISATION",
    `${rows.length} anomalie(s) · ${openCount} ouverte(s) · document de contrôle patrimonial`);

  let y = 36;
  rows.forEach((r) => {
    y = ensureSpace(doc, y, 30);
    const open = r.status === "ouverte";
    doc.setFillColor(244, 248, 248);
    doc.setDrawColor(open ? 214 : 200, open ? 69 : 214, open ? 69 : 206);
    doc.rect(10, y, 190, 0.8, "F");
    doc.setFont("courier", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...(open ? ([158, 51, 39] as [number, number, number]) : ([29, 107, 72] as [number, number, number])));
    doc.text(`${r.code}  ·  ${r.type.toUpperCase()}  ·  ${r.status.toUpperCase()}`, 10, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTE);
    doc.text(`déclarée par ${r.declaredBy} le ${r.declaredAt}`, 200, y + 6, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`${r.eqCode}  —  SN ${r.serial}`, 10, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60, 80, 86);
    doc.text(`Emplacement attendu : ${r.expected}`, 10, y + 17);
    if (r.observed) {
      doc.setTextColor(163, 74, 8);
      doc.text(`Emplacement observé : ${r.observed}`, 110, y + 17);
    }
    doc.setTextColor(...MUTE);
    const dl = doc.splitTextToSize(r.detail, 186);
    doc.text(dl, 10, y + 22);
    y += 22 + dl.length * 3.6 + 3;
    if (r.resolution) {
      y = ensureSpace(doc, y, 8);
      doc.setTextColor(29, 107, 72);
      doc.setFontSize(8);
      doc.text(`Résolution : ${r.resolution}`, 14, y);
      y += 7;
    }
    y += 2;
  });

  y = ensureSpace(doc, y + 6, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("Régularisation — visas", 10, y);
  signBlock(doc, y + 4);

  doc.save(`climatrice_anomalies_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/* ---------- Rapport de réconciliation d'inventaire ---------- */

export interface ReconcilRow { code: string; serial: string; loc: string; result: string }

export function reconciliationPdf(opts: {
  sessionCode: string; site: string; checkedBy: string; startedAt: string; closedAt?: string;
  expected: number; counts: Record<string, number>; notChecked: ReconcilRow[]; gaps: ReconcilRow[];
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, `RAPPORT DE RÉCONCILIATION — ${opts.sessionCode}`,
    `${opts.site} · contrôlé par ${opts.checkedBy} · ${opts.closedAt ? "session clôturée" : "session en cours"}`);

  let y = 38;
  const cells: [string, string][] = [
    ["Attendus", String(opts.expected)],
    ["Contrôlés", String(Object.values(opts.counts).reduce((a, b) => a + b, 0))],
    ["Couverture", `${opts.expected ? Math.round((Object.values(opts.counts).reduce((a, b) => a + b, 0) / opts.expected) * 100) : 0} %`],
    ["Présents", String(opts.counts.present ?? 0)],
    ["Absents", String(opts.counts.absent ?? 0)],
    ["Déplacés", String(opts.counts.deplace ?? 0)],
    ["Endommagés", String(opts.counts.endommage ?? 0)],
    ["Non contrôlés", String(opts.notChecked.length)],
  ];
  cells.forEach(([label, val], i) => {
    const x = 10 + (i % 4) * 47.5;
    const cy = y + Math.floor(i / 4) * 20;
    doc.setDrawColor(200, 212, 212);
    doc.rect(x, cy, 45, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTE);
    doc.text(label.toUpperCase(), x + 3, cy + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...(label === "Absents" && (opts.counts.absent ?? 0) > 0 ? ([158, 51, 39] as [number, number, number]) : label === "Non contrôlés" && opts.notChecked.length > 0 ? ([138, 91, 6] as [number, number, number]) : INK));
    doc.text(val, x + 3, cy + 13.5);
  });
  y += 48;

  const table = (title: string, rows: ReconcilRow[], tone: [number, number, number]) => {
    y = ensureSpace(doc, y, 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(`${title} (${rows.length})`, 10, y);
    y += 6;
    if (rows.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(29, 107, 72);
      doc.text("Aucun écart — conforme.", 14, y);
      y += 8;
      return;
    }
    rows.forEach((r) => {
      y = ensureSpace(doc, y, 7);
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...tone);
      doc.text(r.result.toUpperCase().padEnd(11), 14, y);
      doc.setFont("courier", "normal");
      doc.setTextColor(...INK);
      doc.text(r.code, 40, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTE);
      const locLines = doc.splitTextToSize(`${r.loc}  ·  SN ${r.serial}`, 118);
      doc.text(locLines[0], 68, y);
      y += 6.4;
    });
    y += 4;
  };

  table("Écarts constatés", opts.gaps, [158, 51, 39]);
  table("Unités non contrôlées", opts.notChecked, [138, 91, 6]);

  y = ensureSpace(doc, y + 4, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("Réconciliation — visas", 10, y);
  signBlock(doc, y + 4);

  doc.save(`climatrice_reconciliation_${opts.sessionCode}.pdf`);
}
