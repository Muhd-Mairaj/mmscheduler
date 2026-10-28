"use client";

import { useEffect } from "react";

const firstImage = (files) => [...(files ?? [])].find((f) => f.type?.startsWith("image/"));

/** Calls `onImage(file)` when an image is pasted or dropped anywhere on the page. */
export default function useImageDrop(onImage) {
  useEffect(() => {
    const onPaste = (e) => {
      const file = firstImage(e.clipboardData?.files);
      if (!file) return;
      e.preventDefault();
      onImage(file);
    };
    const onDragOver = (e) => {
      // must cancel dragover for the drop event to fire
      if ([...(e.dataTransfer?.items ?? [])].some((i) => i.type.startsWith("image/"))) e.preventDefault();
    };
    const onDrop = (e) => {
      const file = firstImage(e.dataTransfer?.files);
      if (!file) return;
      e.preventDefault();
      onImage(file);
    };
    document.addEventListener("paste", onPaste);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, [onImage]);
}
