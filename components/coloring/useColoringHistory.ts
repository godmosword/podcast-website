"use client";
import { useCallback, useRef, useState } from "react";
import { ColoringHistory, type ColoringPatch } from "@/lib/coloring/history";
import { cropImageDataRect } from "@/lib/coloring/tools";
export function useColoringHistory() {
  const history = useRef(new ColoringHistory());
  const [available, setAvailable] = useState({
    canUndo: false,
    canRedo: false,
  });
  const sync = useCallback(
    () =>
      setAvailable({
        canUndo: history.current.undo.length > 0,
        canRedo: history.current.redo.length > 0,
      }),
    [],
  );
  const push = useCallback(
    (p: ColoringPatch) => {
      history.current.push(p);
      sync();
    },
    [sync],
  );
  const reset = useCallback(() => {
    history.current.clear();
    sync();
  }, [sync]);
  const apply = useCallback(
    (direction: "undo" | "redo", ctx: CanvasRenderingContext2D) => {
      const p = history.current.take(direction, (rect) => ({
        rect,
        pixels: cropImageDataRect(
          ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height),
          rect,
        ),
      }));
      if (p)
        ctx.putImageData(
          new ImageData(p.pixels, p.rect.width, p.rect.height),
          p.rect.x,
          p.rect.y,
        );
      sync();
      return !!p;
    },
    [sync],
  );
  return { ...available, push, reset, apply };
}
