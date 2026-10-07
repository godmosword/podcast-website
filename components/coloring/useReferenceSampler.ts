"use client";

import { useCallback, useEffect, useRef } from "react";
import { pickPaletteHex } from "@/lib/coloring/reference-pick";

type Pixels = { data: Uint8ClampedArray; width: number; height: number };

/** 把參考彩圖讀進記憶體；回傳 (0–1 座標) → 色盤 hex，圖還沒好或點到線上回 null。 */
export function useReferenceSampler(src: string) {
  const pixels = useRef<Pixels | null>(null);

  useEffect(() => {
    let cancelled = false;
    pixels.current = null;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      pixels.current = {
        data: ctx.getImageData(0, 0, canvas.width, canvas.height).data,
        width: canvas.width,
        height: canvas.height,
      };
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return useCallback((nx: number, ny: number): string | null => {
    const p = pixels.current;
    if (!p) return null;
    return pickPaletteHex(p.data, p.width, p.height, nx * p.width, ny * p.height);
  }, []);
}
