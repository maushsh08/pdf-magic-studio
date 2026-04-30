import { PDFDocument } from "pdf-lib";

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
): Promise<void> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
  const img = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
  const page = pdf.addPage([img.width, img.height]);
  page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
}

export interface MergeItem {
  id: string;
  file: File;
  kind: "pdf" | "image";
}

export async function mergeFiles(
  items: MergeItem[],
  onProgress?: (p: number) => void,
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
      await imageFileToPdfPage(out, it.file);
    }
    onProgress?.((i + 1) / items.length);
  }
  return await out.save();
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