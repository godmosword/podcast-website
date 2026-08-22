"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GameEndStation } from "@/components/games/GameEndStation";
import type { ColoringPage } from "@/data/coloring-pages";
import {
  clearColoringDraft,
  loadColoringDraft,
  saveColoringDraft,
} from "@/lib/coloring/draft-storage";
import { COLORING_DONE_CTA } from "@/lib/coloring/flow";
import {
  BRUSH_SIZES,
  ERASER_RADIUS_BONUS,
  cropImageDataRect,
  floodFillPaint,
  hexToRgba,
  stampBrush,
  unionDirtyRect,
  type BrushSizeId,
  type ColoringTool,
  type DirtyRect,
  type Rgba,
} from "@/lib/coloring/tools";
import { ColoringPalette } from "./ColoringPalette";
import { ColoringToolbar } from "./ColoringToolbar";
import styles from "./ColoringCanvas.module.css";

const MAX_UNDO = 12;
const TRANSPARENT: Rgba = [255, 255, 255, 0];
const SAVE_MS = 600;
const MIN_SCALE = 1;
const MAX_SCALE = 4;
/** 油漆桶：pointerup 前位移超過此值（螢幕 px）視為手勢，不填色。 */
const BUCKET_MOVE_TOLERANCE = 10;

type UndoPatch = { rect: DirtyRect; pixels: Uint8ClampedArray<ArrayBuffer> };
type ViewState = { scale: number; tx: number; ty: number };
type Point = { x: number; y: number };

const DEFAULT_VIEW: ViewState = { scale: 1, tx: 0, ty: 0 };
const PREVIEW_CORNERS = ["cornerBr", "cornerBl", "cornerTl", "cornerTr"] as const;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** 限制縮放平移，canvas 永遠鋪滿 stage（base 尺寸 = stage 尺寸）。 */
function clampView(view: ViewState, stageW: number, stageH: number): ViewState {
  const scale = clamp(view.scale, MIN_SCALE, MAX_SCALE);
  return {
    scale,
    tx: clamp(view.tx, stageW * (1 - scale), 0),
    ty: clamp(view.ty, stageH * (1 - scale), 0),
  };
}

type ColoringCanvasProps = {
  page: ColoringPage;
  onBack: () => void;
};

export function ColoringCanvas({ page, onBack }: ColoringCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const paintRef = useRef<HTMLCanvasElement | null>(null);
  const lineRef = useRef<HTMLCanvasElement | null>(null);
  const lineDataRef = useRef<Uint8ClampedArray | null>(null);

  // 筆觸期間共用的像素 buffer（getImageData 只在落筆時做一次）
  const strokeImgRef = useRef<ImageData | null>(null);
  const strokeBaseRef = useRef<ImageData | null>(null);
  const strokeDirtyRef = useRef<DirtyRect | null>(null);
  const strokeColorRef = useRef<Rgba>(TRANSPARENT);
  const strokeRadiusRef = useRef(10);
  const drawingRef = useRef(false);
  const lastPtRef = useRef<Point | null>(null);

  const undoStackRef = useRef<UndoPatch[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 清空／換頁時遞增，讓在飛行中的 toBlob 回呼作廢（防舊內容復活）
  const saveSeqRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // 雙指縮放平移
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const viewRef = useRef<ViewState>(DEFAULT_VIEW);
  const gestureRef = useRef<{
    startDist: number;
    startMid: Point;
    startView: ViewState;
  } | null>(null);
  const bucketStartRef = useRef<Point | null>(null);
  const bucketMovedRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<ColoringTool>("crayon");
  const [colorHex, setColorHex] = useState("#e85d4c");
  const [brushSize, setBrushSize] = useState<BrushSizeId>("medium");
  const [showPreview, setShowPreview] = useState(false);
  const [previewCorner, setPreviewCorner] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [viewActive, setViewActive] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);

  const composite = useCallback(() => {
    const display = displayRef.current;
    const paint = paintRef.current;
    const line = lineRef.current;
    if (!display || !paint || !line) return;
    const ctx = display.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, display.width, display.height);
    ctx.drawImage(paint, 0, 0);
    // 線稿 PNG 為不透明白底：multiply 讓白底透出塗色、黑線保持黑
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(line, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }, []);

  /** 每幀最多合成一次；連續 pointermove 不再逐事件全畫布重繪。 */
  const requestComposite = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      composite();
    });
  }, [composite]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const paint = paintRef.current;
      if (!paint) return;
      const seq = saveSeqRef.current;
      paint.toBlob((blob) => {
        if (!blob || seq !== saveSeqRef.current) return;
        saveColoringDraft(page.id, blob)
          .then(() => setSaveError(null))
          .catch(() => {
            setSaveError("草稿沒有存起來，離開頁面會消失；可用「下載」保存作品。");
          });
      }, "image/png");
    }, SAVE_MS);
  }, [page.id]);

  const pushUndoPatch = useCallback((patch: UndoPatch) => {
    undoStackRef.current.push(patch);
    if (undoStackRef.current.length > MAX_UNDO) {
      undoStackRef.current.shift();
    }
    setCanUndo(true);
  }, []);

  const pointerToCanvas = useCallback((client: Point): Point => {
    const canvas = displayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((client.x - rect.left) / rect.width) * canvas.width,
      y: ((client.y - rect.top) / rect.height) * canvas.height,
    };
  }, []);

  /** 螢幕 px → canvas px 的倍率（含 pinch 縮放；放大後筆刷更細，好塗細節）。 */
  const canvasScale = useCallback((): number => {
    const canvas = displayRef.current;
    if (!canvas) return 1;
    const rect = canvas.getBoundingClientRect();
    return rect.width > 0 ? canvas.width / rect.width : 1;
  }, []);

  const brushDisplayRadius = useCallback(
    (forTool: ColoringTool): number => {
      const preset =
        BRUSH_SIZES.find((s) => s.id === brushSize) ?? BRUSH_SIZES[1]!;
      return forTool === "eraser"
        ? preset.displayRadius + ERASER_RADIUS_BONUS
        : preset.displayRadius;
    },
    [brushSize],
  );

  const applyView = useCallback((next: ViewState) => {
    const stage = stageRef.current;
    const canvas = displayRef.current;
    if (!stage || !canvas) return;
    const rect = stage.getBoundingClientRect();
    const view = clampView(next, rect.width, rect.height);
    viewRef.current = view;
    canvas.style.transform = `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`;
    setViewActive(view.scale !== 1 || view.tx !== 0 || view.ty !== 0);
  }, []);

  const stampSegment = useCallback((from: Point, to: Point) => {
    const img = strokeImgRef.current;
    if (!img) return;
    const radius = strokeRadiusRef.current;
    const color = strokeColorRef.current;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(dist / Math.max(1, radius * 0.45)));
    let dirty: DirtyRect | null = null;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const rect = stampBrush(
        img,
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t,
        radius,
        color,
        lineDataRef.current ?? undefined,
      );
      dirty = unionDirtyRect(dirty, rect);
    }
    if (!dirty) return;
    strokeDirtyRef.current = unionDirtyRect(strokeDirtyRef.current, dirty);
    const ctx = paintRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(img, 0, 0, dirty.x, dirty.y, dirty.width, dirty.height);
    requestComposite();
  }, [requestComposite]);

  const beginStroke = useCallback(
    (pt: Point) => {
      const paint = paintRef.current;
      const ctx = paint?.getContext("2d");
      if (!paint || !ctx) return;
      const img = ctx.getImageData(0, 0, paint.width, paint.height);
      strokeImgRef.current = img;
      strokeBaseRef.current = new ImageData(
        new Uint8ClampedArray(img.data),
        img.width,
        img.height,
      );
      strokeDirtyRef.current = null;
      strokeColorRef.current = tool === "eraser" ? TRANSPARENT : hexToRgba(colorHex);
      strokeRadiusRef.current = Math.max(
        1,
        Math.round(brushDisplayRadius(tool) * canvasScale()),
      );
      drawingRef.current = true;
      lastPtRef.current = pt;
      stampSegment(pt, pt);
    },
    [tool, colorHex, brushDisplayRadius, canvasScale, stampSegment],
  );

  /** 丟棄未完成筆觸（雙指手勢起手用）：還原像素、不進 undo、不存檔。 */
  const cancelStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPtRef.current = null;
    const base = strokeBaseRef.current;
    const dirty = strokeDirtyRef.current;
    const ctx = paintRef.current?.getContext("2d");
    if (base && dirty && ctx) {
      ctx.putImageData(base, 0, 0, dirty.x, dirty.y, dirty.width, dirty.height);
      requestComposite();
    }
    strokeImgRef.current = null;
    strokeBaseRef.current = null;
    strokeDirtyRef.current = null;
  }, [requestComposite]);

  const finishStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPtRef.current = null;
    const base = strokeBaseRef.current;
    const dirty = strokeDirtyRef.current;
    if (base && dirty) {
      pushUndoPatch({ rect: dirty, pixels: cropImageDataRect(base, dirty) });
      scheduleSave();
    }
    strokeImgRef.current = null;
    strokeBaseRef.current = null;
    strokeDirtyRef.current = null;
  }, [pushUndoPatch, scheduleSave]);

  const runBucket = useCallback(
    (pt: Point) => {
      const paint = paintRef.current;
      const ctx = paint?.getContext("2d");
      if (!paint || !ctx) return;
      const img = ctx.getImageData(0, 0, paint.width, paint.height);
      const base = new ImageData(
        new Uint8ClampedArray(img.data),
        img.width,
        img.height,
      );
      const { rect } = floodFillPaint(
        img,
        Math.floor(pt.x),
        Math.floor(pt.y),
        hexToRgba(colorHex),
        lineDataRef.current ?? undefined,
      );
      if (!rect) return;
      pushUndoPatch({ rect, pixels: cropImageDataRect(base, rect) });
      ctx.putImageData(img, 0, 0, rect.x, rect.y, rect.width, rect.height);
      requestComposite();
      scheduleSave();
    },
    [colorHex, pushUndoPatch, requestComposite, scheduleSave],
  );

  const startGestureIfTwoPointers = useCallback(() => {
    const pts = [...pointersRef.current.values()];
    if (pts.length !== 2) return;
    cancelStroke(); // 第一指的誤觸墨點直接還原，不 commit
    bucketStartRef.current = null;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    gestureRef.current = {
      startDist: Math.max(1, Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y)),
      startMid: {
        x: (pts[0]!.x + pts[1]!.x) / 2 - rect.left,
        y: (pts[0]!.y + pts[1]!.y) / 2 - rect.top,
      },
      startView: viewRef.current,
    };
  }, [cancelStroke]);

  const applyGesture = useCallback(() => {
    const gesture = gestureRef.current;
    const stage = stageRef.current;
    const pts = [...pointersRef.current.values()];
    if (!gesture || !stage || pts.length !== 2) return;
    const rect = stage.getBoundingClientRect();
    const dist = Math.max(1, Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y));
    const mid = {
      x: (pts[0]!.x + pts[1]!.x) / 2 - rect.left,
      y: (pts[0]!.y + pts[1]!.y) / 2 - rect.top,
    };
    const { startView } = gesture;
    const scale = clamp(
      startView.scale * (dist / gesture.startDist),
      MIN_SCALE,
      MAX_SCALE,
    );
    // 讓手勢起點下方的畫面點跟著中點移動
    const anchorX = (gesture.startMid.x - startView.tx) / startView.scale;
    const anchorY = (gesture.startMid.y - startView.ty) / startView.scale;
    applyView({
      scale,
      tx: mid.x - anchorX * scale,
      ty: mid.y - anchorY * scale,
    });
  }, [applyView]);

  const moveCursorRing = useCallback(
    (client: Point, pointerType: string) => {
      const ring = cursorRef.current;
      const stage = stageRef.current;
      if (!ring || !stage) return;
      // 觸控時圈被手指遮住只剩雜訊；手勢中兩指間跳動也隱藏
      if (tool === "bucket" || pointerType === "touch" || gestureRef.current) {
        ring.style.display = "none";
        return;
      }
      const rect = stage.getBoundingClientRect();
      const d = brushDisplayRadius(tool) * 2;
      ring.style.display = "block";
      ring.style.width = `${d}px`;
      ring.style.height = `${d}px`;
      ring.style.left = `${client.x - rect.left}px`;
      ring.style.top = `${client.y - rect.top}px`;
    },
    [tool, brushDisplayRadius],
  );

  useEffect(() => {
    let cancelled = false;
    const pointers = pointersRef.current;
    saveSeqRef.current += 1;
    setReady(false);
    setSaveError(null);
    undoStackRef.current = [];
    setCanUndo(false);
    applyView(DEFAULT_VIEW);

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

      const finishLoad = () => {
        if (cancelled) return;
        composite();
        setReady(true);
      };

      loadColoringDraft(page.id)
        .then((draft) => {
          if (cancelled || draft == null) {
            finishLoad();
            return;
          }
          const objectUrl =
            typeof draft === "string" ? null : URL.createObjectURL(draft);
          const draftImg = new Image();
          draftImg.onload = () => {
            if (!cancelled) paintCtx.drawImage(draftImg, 0, 0, w, h);
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            finishLoad();
          };
          draftImg.onerror = () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            finishLoad();
          };
          draftImg.src = objectUrl ?? (draft as string);
        })
        .catch(finishLoad);
    };
    img.onerror = () => {
      if (!cancelled) setReady(false);
    };
    img.src = page.lineArtSrc;

    return () => {
      cancelled = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      pointers.clear();
      gestureRef.current = null;
      drawingRef.current = false;
    };
  }, [page.id, page.lineArtSrc, composite, applyView]);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // 合成事件（測試）無 active pointer 時忽略
    }
    const client = { x: event.clientX, y: event.clientY };
    pointersRef.current.set(event.pointerId, client);

    if (pointersRef.current.size === 2) {
      startGestureIfTwoPointers();
      return;
    }
    if (pointersRef.current.size > 2 || gestureRef.current) return;

    const pt = pointerToCanvas(client);
    if (tool === "bucket") {
      // 延到 pointerup 才填色，避免雙指縮放的第一指誤觸
      bucketStartRef.current = client;
      bucketMovedRef.current = false;
      return;
    }
    beginStroke(pt);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const client = { x: event.clientX, y: event.clientY };
    moveCursorRing(client, event.pointerType);
    if (!ready) return;
    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, client);
    }
    if (gestureRef.current) {
      applyGesture();
      return;
    }
    const bucketStart = bucketStartRef.current;
    if (bucketStart) {
      if (
        Math.hypot(client.x - bucketStart.x, client.y - bucketStart.y) >
        BUCKET_MOVE_TOLERANCE
      ) {
        bucketMovedRef.current = true;
      }
      return;
    }
    if (!drawingRef.current) return;
    const native = event.nativeEvent;
    const samples =
      typeof native.getCoalescedEvents === "function"
        ? native.getCoalescedEvents()
        : [native];
    for (const sample of samples.length > 0 ? samples : [native]) {
      const pt = pointerToCanvas({ x: sample.clientX, y: sample.clientY });
      stampSegment(lastPtRef.current ?? pt, pt);
      lastPtRef.current = pt;
    }
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (gestureRef.current && pointersRef.current.size < 2) {
      gestureRef.current = null;
    }
    const bucketStart = bucketStartRef.current;
    if (bucketStart && event.type === "pointerup" && !bucketMovedRef.current) {
      runBucket(pointerToCanvas({ x: event.clientX, y: event.clientY }));
    }
    bucketStartRef.current = null;
    finishStroke();
  };

  const hideCursorRing = () => {
    const ring = cursorRef.current;
    if (ring) ring.style.display = "none";
  };

  const handleUndo = () => {
    const paint = paintRef.current;
    const ctx = paint?.getContext("2d");
    const patch = undoStackRef.current.pop();
    if (!paint || !ctx || !patch) {
      setCanUndo(false);
      return;
    }
    ctx.putImageData(
      new ImageData(patch.pixels, patch.rect.width, patch.rect.height),
      patch.rect.x,
      patch.rect.y,
    );
    setCanUndo(undoStackRef.current.length > 0);
    composite();
    scheduleSave();
  };

  const handleClear = () => {
    const paint = paintRef.current;
    const ctx = paint?.getContext("2d");
    if (!paint || !ctx) return;
    const rect: DirtyRect = { x: 0, y: 0, width: paint.width, height: paint.height };
    const current = ctx.getImageData(0, 0, paint.width, paint.height);
    pushUndoPatch({ rect, pixels: cropImageDataRect(current, rect) });
    ctx.clearRect(0, 0, paint.width, paint.height);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveSeqRef.current += 1;
    void clearColoringDraft(page.id);
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

  const playDoneTone = () => {
    try {
      const AudioCtx = window.AudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const start = ctx.currentTime + i * 0.12;
        osc.start(start);
        osc.stop(start + 0.18);
      });
    } catch {
      // 無音效環境略過
    }
  };

  const handleDone = () => {
    composite();
    playDoneTone();
    setDoneOpen(true);
  };

  return (
    <div className={styles.root}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backPage} onClick={onBack}>
          ← 換一張
        </button>
        <p className={styles.pageTitle}>{page.title}</p>
        <button
          type="button"
          className={styles.doneBtn}
          onClick={handleDone}
          disabled={!ready}
        >
          {COLORING_DONE_CTA}
        </button>
      </div>

      <p className={styles.guide}>
        先選顏色，再用蠟筆塗一塗；想填滿一大片就用油漆桶。兩指可以放大找細節！
      </p>

      <div className={styles.stage} ref={stageRef}>
        <canvas
          ref={displayRef}
          className={styles.canvas}
          role="img"
          aria-label={`${page.title}著色畫布`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onPointerLeave={hideCursorRing}
        />
        <div ref={cursorRef} className={styles.cursorRing} aria-hidden="true" />
        {showPreview ? (
          <button
            type="button"
            className={`${styles.preview} ${styles[PREVIEW_CORNERS[previewCorner % PREVIEW_CORNERS.length]!]}`}
            onClick={() => setPreviewCorner((c) => (c + 1) % PREVIEW_CORNERS.length)}
            aria-label="原圖參考換角落"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- canvas 旁小預覽 */}
            <img src={page.previewSrc} alt={`${page.title}原圖參考`} />
          </button>
        ) : null}
        {!ready ? <p className={styles.loading}>載入線稿中…</p> : null}
      </div>

      <p role="status" aria-live="polite" className={styles.saveNotice}>
        {saveError}
      </p>

      <ColoringPalette colorHex={colorHex} onChange={setColorHex} />
      <ColoringToolbar
        tool={tool}
        onToolChange={setTool}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview((v) => !v)}
        canUndo={canUndo}
        onUndo={handleUndo}
        onClear={handleClear}
        onDownload={handleDownload}
        viewActive={viewActive}
        onResetView={() => applyView(DEFAULT_VIEW)}
      />

      {doneOpen ? (
        <div className={styles.doneOverlay} role="presentation">
          <GameEndStation
            mood="win"
            title="塗好了！"
            summary={`${page.title} · 可以繼續調色或換一張`}
            gameSlug="coloring-book"
            onReplay={() => setDoneOpen(false)}
            replayLabel="再塗這一張"
            mainAction={{ label: "換一張塗", onClick: onBack }}
          />
        </div>
      ) : null}
    </div>
  );
}
