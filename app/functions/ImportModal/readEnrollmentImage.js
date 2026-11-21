import { parseEnrollment } from "./parseEnrollment";

// Screenshots are scaled to this width before reading: smaller ones are read badly
// and the huge ones from retina screens are slow without being any more accurate
const TARGET_WIDTH = 2000;

// How the OCR engine splits the image: one block of text first, a single column if that fails
const PAGE_SEGMENTATION_MODES = ["6", "4"];

// The engine is shared between imports, it is slow to load
let workerPromise = null;
let isReading = false;
let idleTimer = null;
const IDLE_TIMEOUT = 2 * 60 * 1000;

// The progress callback of the current import, the worker is created only once
let reportProgress = () => {};

const createOcrWorker = async () => {
  // only load the OCR engine when someone actually imports an image
  const { createWorker } = await import("tesseract.js");

  return createWorker("eng", 1, {
    logger: (message) => reportProgress(message),
  });
};

const getWorker = () => {
  if (!workerPromise) {
    workerPromise = createOcrWorker().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
};

const stopWorker = async () => {
  const promise = workerPromise;
  workerPromise = null;
  isReading = false;
  clearTimeout(idleTimer);

  if (promise) {
    try {
      const worker = await promise;
      await worker.terminate();
    } catch (error) {
      // it never started, nothing to stop
    }
  }
};

// Starts loading the engine so it is ready when the screenshot has been picked
export const preloadEnrollmentReader = () => {
  clearTimeout(idleTimer);
  getWorker().catch(() => {});
};

// Stops reading, used when the modal is closed in the middle of it
export const cancelEnrollmentReading = () => {
  if (isReading) {
    stopWorker();
  }
};

const prepareImage = async (file) => {
  const image = await createImageBitmap(file);
  const scale = TARGET_WIDTH / image.width;

  const canvas = document.createElement("canvas");
  canvas.width = TARGET_WIDTH;
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();

  // dark mode screenshots are read better as dark text on a light background
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  let brightness = 0;
  for (let i = 0; i < data.length; i += 64) {
    brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  if (brightness / (data.length / 64) < 110) {
    context.globalCompositeOperation = "difference";
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  return canvas;
};

// Reads the text of an image in the browser, nothing is uploaded anywhere.
// onProgress gets the messages of the OCR engine ({ status, progress })
const readEnrollmentImage = async (file, onProgress) => {
  reportProgress = onProgress;
  isReading = true;
  clearTimeout(idleTimer);

  try {
    const [worker, image] = await Promise.all([
      getWorker(),
      prepareImage(file),
    ]);

    // the best of the attempts is the one where most rows have an occurrence
    let best = { text: "", score: -1 };

    for (const mode of PAGE_SEGMENTATION_MODES) {
      await worker.setParameters({
        tessedit_pageseg_mode: mode,
        preserve_interword_spaces: "1",
      });
      const { data } = await worker.recognize(image);

      const rows = parseEnrollment(data.text);
      const rowsWithOccurrence = rows.filter((row) => row.occurrences.length > 0);

      if (rowsWithOccurrence.length > best.score) {
        best = { text: data.text, score: rowsWithOccurrence.length };
      }
      if (rows.length > 0 && rowsWithOccurrence.length === rows.length) {
        break;
      }
    }

    return best.text;
  } finally {
    isReading = false;
    // free the memory of the engine if it is not used for a while
    idleTimer = setTimeout(stopWorker, IDLE_TIMEOUT);
  }
};

export default readEnrollmentImage;
