import { PDFDocument } from "pdf-lib";

export interface CompressionOptions {
  enabled: boolean;
  /** Max width or height in px for embedded images. */
  maxDimension: number;
  /** JPEG quality 0..1 */
  quality: number;
}

export const COMPRESSION_PRESETS: Record<"high" | "medium" | "low", CompressionOptions> = {
  high: { enabled: true, maxDimension: 1080, quality: 0.6 },
  medium: { enabled: true, maxDimension: 1600, quality: 0.75 },
  low: { enabled: true, maxDimension: 2200, quality: 0.85 },
};

export async function fileToArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

export function downloadBlob(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function imageFileToPdfPage(
  pdf: PDFDocument,
  file: File,
  compression?: CompressionOptions,
): Promise<void> {
  const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");

  if (compression?.enabled) {
    const jpegBytes = await recompressImageFile(file, compression);
    const img = await pdf.embedJpg(jpegBytes);
    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    return;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const img = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
  const page = pdf.addPage([img.width, img.height]);
  page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
}

/**
 * Downscale an image File and return JPEG bytes using a canvas in the browser.
 */
export async function recompressImageFile(
  file: File,
  options: CompressionOptions,
): Promise<Uint8Array> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("画像の読み込みに失敗"));
      el.src = url;
    });
    const { naturalWidth: w, naturalHeight: h } = img;
    const scale = Math.min(1, options.maxDimension / Math.max(w, h));
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas未対応");
    // White background avoids black behind transparent PNGs when re-encoding to JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("JPEGエンコード失敗"))),
        "image/jpeg",
        options.quality,
      ),
    );
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface MergeItem {
  id: string;
  file: File;
  kind: "pdf" | "image";
}

export async function mergeFiles(
  items: MergeItem[],
  onProgress?: (p: number) => void,
  compression?: CompressionOptions,
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind === "pdf") {
      const src = await PDFDocument.load(await it.file.arrayBuffer(), {
        ignoreEncryption: true,
      });
      const indices = src.getPageIndices();
      const copied = await out.copyPages(src, indices);
      copied.forEach((p) => out.addPage(p));
    } else {
      await imageFileToPdfPage(out, it.file, compression);
    }
    onProgress?.((i + 1) / items.length);
  }
  return await out.save({ useObjectStreams: true });
}

export async function extractPages(
  file: File,
  pageIndices: number[],
  onProgress?: (p: number) => void,
): Promise<Uint8Array> {
  const src = await PDFDocument.load(await file.arrayBuffer(), {
    ignoreEncryption: true,
  });
  const out = await PDFDocument.create();
  const sorted = [...pageIndices].sort((a, b) => a - b);
  const copied = await out.copyPages(src, sorted);
  for (let i = 0; i < copied.length; i++) {
    out.addPage(copied[i]);
    onProgress?.((i + 1) / copied.length);
  }
  return await out.save();
}

export async function getPageCount(file: File): Promise<number> {
  const src = await PDFDocument.load(await file.arrayBuffer(), {
    ignoreEncryption: true,
  });
  return src.getPageCount();
}

/**
 * Render a lightweight text-based "thumbnail" SVG for each page.
 * We avoid heavy pdf.js dep by rendering a placeholder card with size info.
 * For real visual previews we extract the page into its own single-page PDF
 * and use a data: URL preview surface.
 */
export async function renderPageThumbnails(
  file: File,
  onProgress?: (p: number) => void,
): Promise<{ index: number; width: number; height: number }[]> {
  const src = await PDFDocument.load(await file.arrayBuffer(), {
    ignoreEncryption: true,
  });
  const pages = src.getPages();
  const result = pages.map((p, i) => {
    onProgress?.((i + 1) / pages.length);
    const { width, height } = p.getSize();
    return { index: i, width, height };
  });
  return result;
}