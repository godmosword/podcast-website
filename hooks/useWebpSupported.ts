"use client";

import { useEffect, useState } from "react";

/** 偵測瀏覽器是否支援 WebP（SSR 預設 false → PNG fallback）。 */
export function useWebpSupported(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    setSupported(canvas.toDataURL("image/webp").startsWith("data:image/webp"));
  }, []);

  return supported;
}
