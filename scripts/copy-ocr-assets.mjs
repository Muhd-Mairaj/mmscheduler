// Copies the self-hosted OCR engine (worker, WASM core, English model) into
// public/ocr so the "paste enrollment screenshot" feature works without any
// third-party CDN. Runs automatically after install / before dev & build.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "ocr");
const nm = (...p) => join(root, "node_modules", ...p);

const files = [
  [nm("tesseract.js", "dist", "worker.min.js"), join(out, "worker.min.js")],
  [nm("@tesseract.js-data", "eng", "4.0.0_best_int", "eng.traineddata.gz"), join(out, "lang", "eng.traineddata.gz")],
  ...[
    "tesseract-core-lstm.wasm.js",
    "tesseract-core-simd-lstm.wasm.js",
    "tesseract-core-relaxedsimd-lstm.wasm.js",
  ].map((f) => [nm("tesseract.js-core", f), join(out, f)]),
];

let copied = 0;
for (const [from, to] of files) {
  if (!existsSync(from)) {
    console.warn(`[ocr] missing ${from} (run npm install)`);
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  copied++;
}
console.log(`[ocr] copied ${copied}/${files.length} assets to public/ocr`);
