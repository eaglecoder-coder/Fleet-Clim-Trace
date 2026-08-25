/* Compression et rasterisation d'images — les photos sont stockées en
   data-URL dans le localStorage (parc offline-first). */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible"));
    img.src = src;
  });
}

/** Fichier utilisateur → JPEG compressé (max 1000 px, ~60-120 Ko). */
export async function compressImage(file: File, maxDim = 1000, quality = 0.72): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Le fichier n'est pas une image.");
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponible");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** N'importe quelle source (data-URL JPEG ou SVG) → PNG raster pour jsPDF. */
export async function toPngDataUrl(src: string, maxDim = 480): Promise<string> {
  const img = await loadImage(src);
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 640, img.naturalHeight || 420));
  const w = Math.max(1, Math.round((img.naturalWidth || 640) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || 420) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/png");
}
