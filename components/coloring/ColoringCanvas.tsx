"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ColoringPage } from "@/data/coloring-pages";
import {
  clearColoringDraft,
  loadColoringDraft,
  saveColoringDraft,
} from "@/lib/coloring/draft-storage";
import {
  CRAYON_RADIUS,
  ERASER_RADIUS,
  floodFillPaint,
  hexToRgba,
  stampBrush,
  type ColoringTool,
  type Rgba,
} from "@/lib/coloring/tools";
import { ColoringPalette } from "./ColoringPalette";
import { ColoringToolbar } from "./ColoringToolbar";
import styles from "./ColoringCanvas.module.css";

const MAX_UNDO = 12;
const TRANSPARENT: Rgba = [255, 255, 255, 0];
const SAVE_MS = 600;

type ColoringCanvasProps = {
  page: ColoringPage;
  onBack: () => void;
};

export function ColoringCanvas({ page, onBack }: ColoringCanvasProps) {
  const displayRef = useRef<HTMLCanvasElement>(null);
  const paintRef = useRef<HTMLCanvasElement | null>(null);
  const lineRef = useRef<HTMLCanvasElement | null>(null);
  const lineDataRef = useRef<Uint8ClampedArray | null>(null);
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<ColoringTool>("crayon");
  const [colorHex, setColorHex] = useState("#e85d4c");
  const [showPreview, setShowPreview] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const composite = useCallback(() => {
    const display = displayRef.current;
    const paint = paintRef.current;
    const line = lineRef.current;
    if (!display || !paint || !line) return;
    const ctx = display.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, display.width, display.height);
    ctx.drawImage(paint, 0, 0);
    ctx.drawImage(line, 0, 0);
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const paint = paintRef.current;
      if (!paint) return;
      try {
        saveColoringDraft(page.id, paint.toDataURL("image/png"));
      } catch {
        // ignore
      }
    }, SAVE_MS);
  }, [page.id]);

  const pushUndo = useCallback(() => {
    const paint = paintRef.current;
    if (!paint) return;
    const ctx = paint.getContext("2d");
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, paint.width, paint.height);
    undoStackRef.current.push(snap);
    if (undoStackRef.current.length > MAX_UNDO) {
      undoStackRef.current.shift();
    }
    setCanUndo(true);
  }, []);

  const pointerToCanvas = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = displayRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
      return { x, y };
    },
    [],
  );

  const strokeBetween = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }, color: Rgba, radius: number) => {
      const paint = paintRef.current;
      if (!paint) return;
      const ctx = paint.getContext("2d");
      if (!ctx) return;
      const img = ctx.getImageData(0, 0, paint.width, paint.height);
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const steps = Math.max(1, Math.ceil(dist / (radius * 0.45)));
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        stampBrush(
          img,
          from.x + (to.x - from.x) * t,
          from.y + (to.y - from.y) * t,
          radius,
          color,
          lineDataRef.current ?? undefined,
        );
      }
      ctx.putImageData(img, 0, 0);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    undoStackRef.current = [];
    setCanUndo(false);

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      const w = img.naturalWidth || 1024;
      const h = img.naturalHeight || 1024;

      const display = displayRef.current;
      if (!display) return;
      display.width = w;
      display.height = h;

      const paint = document.createElement("canvas");
      paint.width = w;
      paint.height = h;
      paintRef.current = paint;
      const paintCtx = paint.getContext("2d");
      if (!paintCtx) return;
      paintCtx.clearRect(0, 0, w, h);

      const line = document.createElement("canvas");
      line.width = w;
      line.height = h;
      lineRef.current = line;
      const lineCtx = line.getContext("2d");
      if (!lineCtx) return;
      lineCtx.drawImage(img, 0, 0, w, h);
      lineDataRef.current = lineCtx.getImageData(0, 0, w, h).data;

      const draft = loadColoringDraft(page.id);
      if (draft) {
        const draftImg = new Image();
        draftImg.onload = () => {
          if (cancelled) return;
          paintCtx.drawImage(draftImg, 0, 0, w, h);
          composite();
          setReady(true);
        };
        draftImg.onerror = () => {
          if (cancelled) return;
          composite();
          setReady(true);
        };
        draftImg.src = draft;
      } else {
        composite();
        setReady(true);
      }
    };
    img.onerror = () => {
      if (!cancelled) setReady(false);
    };
    img.src = page.lineArtSrc;

    return () => {
      cancelled = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [page.id, page.lineArtSrc, composite]);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const pt = pointerToCanvas(event);

    if (tool === "bucket") {
      pushUndo();
      const paint = paintRef.current;
      const ctx = paint?.getContext("2d");
      if (!paint || !ctx) return;
      const img = ctx.getImageData(0, 0, paint.width, paint.height);
      floodFillPaint(
        img,
        Math.floor(pt.x),
        Math.floor(pt.y),
        hexToRgba(colorHex),
        lineDataRef.current ?? undefined,
      );
      ctx.putImageData(img, 0, 0);
      composite();
      scheduleSave();
      return;
    }

    pushUndo();
    drawingRef.current = true;
    lastPtRef.current = pt;
    const color = tool === "eraser" ? TRANSPARENT : hexToRgba(colorHex);
    const radius = tool === "eraser" ? ERASER_RADIUS : CRAYON_RADIUS;
    strokeBetween(pt, pt, color, radius);
    composite();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !ready) return;
    const pt = pointerToCanvas(event);
    const last = lastPtRef.current ?? pt;
    const color = tool === "eraser" ? TRANSPARENT : hexToRgba(colorHex);
    const radius = tool === "eraser" ? ERASER_RADIUS : CRAYON_RADIUS;
    strokeBetween(last, pt, color, radius);
    lastPtRef.current = pt;
    composite();
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPtRef.current = null;
    scheduleSave();
  };

  const handleUndo = () => {
    const paint = paintRef.current;
    const ctx = paint?.getContext("2d");
    const snap = undoStackRef.current.pop();
    if (!paint || !ctx || !snap) {
      setCanUndo(false);
      return;
    }
    ctx.putImageData(snap, 0, 0);
    setCanUndo(undoStackRef.current.length > 0);
    composite();
    scheduleSave();
  };

  const handleClear = () => {
    const paint = paintRef.current;
    const ctx = paint?.getContext("2d");
    if (!paint || !ctx) return;
    pushUndo();
    ctx.clearRect(0, 0, paint.width, paint.height);
    clearColoringDraft(page.id);
    composite();
  };

  const handleDownload = () => {
    const display = displayRef.current;
    if (!display) return;
    composite();
    const link = document.createElement("a");
    link.download = `${page.id}-著色.png`;
    link.href = display.toDataURL("image/png");
    link.click();
  };

  return (
    <div className={styles.root}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backPage} onClick={onBack}>
          ← 換一張
        </button>
        <p className={styles.pageTitle}>{page.title}</p>
      </div>

      <div className={styles.stage}>
        <canvas
          ref={displayRef}
          className={styles.canvas}
          role="img"
          aria-label={`${page.title}著色畫布`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
        />
        {showPreview ? (
          // eslint-disable-next-line @next/next/no-img-element -- canvas 旁小預覽
          <img
            src={page.previewSrc}
            alt={`${page.title}原圖參考`}
            className={styles.preview}
          />
        ) : null}
        {!ready ? <p className={styles.loading}>載入線稿中…</p> : null}
      </div>

      <ColoringPalette colorHex={colorHex} onChange={setColorHex} />
      <ColoringToolbar
        tool={tool}
        onToolChange={setTool}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview((v) => !v)}
        canUndo={canUndo}
        onUndo={handleUndo}
        onClear={handleClear}
        onDownload={handleDownload}
      />
    </div>
  );
}
