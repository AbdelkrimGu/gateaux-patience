// Client-side image resize + re-encode before upload.
// A typical phone photo (4000x3000 @ 8 MB) becomes ~2000x1500 @ ~400 KB
// at quality 0.85 — visually indistinguishable on screens, ~20x smaller.

export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
}

const DEFAULT_MAX_DIMENSION = 2000;
const DEFAULT_QUALITY = 0.85;
const MIN_SIZE_TO_COMPRESS = 200 * 1024; // <200 KB: don't bother

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image"));
    };
    img.src = url;
  });
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxDimension = DEFAULT_MAX_DIMENSION, quality = DEFAULT_QUALITY } = options;

  if (!file.type.startsWith("image/")) return file;
  // GIFs would lose their animation, SVGs lose vector quality — skip both.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  if (file.size < MIN_SIZE_TO_COMPRESS) return file;

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return file;
  }

  const { naturalWidth: w, naturalHeight: h } = img;
  if (!w || !h) return file;

  let targetW = w;
  let targetH = h;
  if (Math.max(w, h) > maxDimension) {
    if (w >= h) {
      targetW = maxDimension;
      targetH = Math.round((h / w) * maxDimension);
    } else {
      targetH = maxDimension;
      targetW = Math.round((w / h) * maxDimension);
    }
  }

  // Already within bounds AND smallish file → not worth re-encoding.
  if (targetW === w && targetH === h && file.size < 1.5 * 1024 * 1024) {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return file;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
  if (!blob) return file;

  // If re-encoding somehow made the file bigger, keep the original.
  if (blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
