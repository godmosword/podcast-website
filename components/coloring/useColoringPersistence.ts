"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ColoringPage } from "@/data/coloring-pages";
import {
  canvasBlob,
  composeColoring,
  hasColoringPaint,
  thumbnailCanvas,
} from "@/lib/coloring/bitmap";
import {
  draftRecordKey,
  saveColoringDraftRecord,
} from "@/lib/coloring/draft-storage";

export function useColoringPersistence(
  page: ColoringPage,
  paint: { current: HTMLCanvasElement | null },
  line: { current: HTMLCanvasElement | null },
) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serial = useRef<Promise<boolean>>(Promise.resolve(true));
  const dirty = useRef(false);
  const revision = useRef(0);
  const alive = useRef(true);
  const flush = useCallback((): Promise<boolean> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!dirty.current) return serial.current;
    const p = paint.current,
      l = line.current;
    if (!p || !l) return Promise.resolve(false);
    const token = revision.current;
    const pixels = p.getContext("2d")!.getImageData(0, 0, p.width, p.height);
    const hasPaint = hasColoringPaint(pixels.data);
    // Capture both bitmaps now, before another stroke mutates the source canvas.
    const captured = Promise.all([
      canvasBlob(p),
      canvasBlob(thumbnailCanvas(composeColoring(p, l, p.width, p.height))),
    ]);
    // Attach a rejection handler immediately; serialization may await an older write.
    const snapshot = captured.then(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    dirty.current = false;
    if (alive.current) setStatus("saving");
    serial.current = serial.current.then(async () => {
      try {
        const snap = await snapshot;
        if ("error" in snap) throw snap.error;
        const [paintBlob, thumbnailBlob] = snap.value;
        await saveColoringDraftRecord({
          key: draftRecordKey(page.id, page.lineArtRevision),
          pageId: page.id,
          lineArtRevision: page.lineArtRevision,
          paintBlob,
          thumbnailBlob,
          updatedAt: Date.now(),
          hasPaint,
        });
        if (alive.current && token === revision.current) setStatus("saved");
        return true;
      } catch {
        if (token === revision.current) {
          dirty.current = true;
          if (alive.current) setStatus("error");
        }
        return false;
      }
    });
    return serial.current;
  }, [page.id, page.lineArtRevision, paint, line]);
  const schedule = useCallback(() => {
    dirty.current = true;
    revision.current += 1;
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flush();
    }, 600);
  }, [flush]);
  useEffect(() => {
    alive.current = true;
    const background = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const pagehide = () => {
      void flush();
    };
    document.addEventListener("visibilitychange", background);
    window.addEventListener("pagehide", pagehide);
    return () => {
      alive.current = false;
      void flush();
      document.removeEventListener("visibilitychange", background);
      window.removeEventListener("pagehide", pagehide);
    };
  }, [flush]);
  return { flush, schedule, status };
}
