import { candidateCodes, extractRows, resolveRows } from "./enrollment.mjs";

/** Draw the image to a canvas at a size OCR likes; invert dark-mode screenshots. */
const prepare = async (file) => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(2.5, Math.max(1, 1600 / bitmap.width));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  // Average brightness of a sample: dark background => invert so text is dark on light.
  const sample = ctx.getImageData(0, 0, canvas.width, Math.min(canvas.height, 200)).data;
  let sum = 0;
  for (let i = 0; i < sample.length; i += 16) sum += (sample[i] + sample[i + 1] + sample[i + 2]) / 3;
  const mean = sum / (sample.length / 16);
  if (mean < 110) {
    const full = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < full.data.length; i += 4) {
      full.data[i] = 255 - full.data[i];
      full.data[i + 1] = 255 - full.data[i + 1];
      full.data[i + 2] = 255 - full.data[i + 2];
    }
    ctx.putImageData(full, 0, 0);
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read the image"))), "image/png")
  );
};

/** Runs OCR entirely in the browser using the self-hosted engine in /ocr. */
export const readText = async (file, onProgress) => {
  const image = await prepare(file);
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr",
    langPath: "/ocr/lang",
    gzip: true,
    logger: (m) => {
      if (m.status === "recognizing text") onProgress?.(m.progress);
    },
  });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
    const { data } = await worker.recognize(image);
    return data.text;
  } finally {
    await worker.terminate();
  }
};

/** OCR an enrollment screenshot and match it against the timetable data. */
export const importFromImage = async (file, onProgress) => {
  const text = await readText(file, onProgress);
  const rows = extractRows(text);
  if (rows.length === 0) return { items: [], text };

  const codes = candidateCodes(rows);
  const res = await fetch("/api/get-courses-by-ids?query=" + encodeURIComponent(codes.join(",")));
  if (!res.ok) throw new Error("Could not look up modules");
  const courseData = await res.json();
  return { items: resolveRows(rows, courseData), text };
};
