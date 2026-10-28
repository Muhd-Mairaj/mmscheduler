/** Resolves after the browser has painted the latest render. */
export const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/**
 * Render a DOM element to a PNG and hand it to the user: the share sheet on
 * touch devices (iOS handles plain downloads badly), a download elsewhere.
 */
export default async function exportElementAsPng(element, filename = "timetable.png") {
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: getComputedStyle(document.body).backgroundColor,
    useCORS: true,
  });
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("empty canvas"))), "image/png")
  );
  const file = new File([blob], filename, { type: "image/png" });

  if (window.matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "My timetable" });
      return;
    } catch (err) {
      if (err.name === "AbortError") return; // user closed the sheet
      // anything else: fall back to a download
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
