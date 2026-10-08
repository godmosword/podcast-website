"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ColoringPage } from "@/data/coloring-pages";
import { COLORING_DONE_CTA } from "@/lib/coloring/flow";
import { playSfx } from "@/lib/sfx";
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
import { ColoringDoneSheet } from "./ColoringDoneSheet";
import { ColoringHint } from "./ColoringHint";
import { ColoringLeaveSheet } from "./ColoringLeaveSheet";
import { ColoringPalette } from "./ColoringPalette";
import { ColoringReference, ColoringReferencePeek } from "./ColoringReference";
import { ColoringToolbar } from "./ColoringToolbar";
import styles from "./ColoringCanvas.module.css";
import { useColoringHistory } from "./useColoringHistory";
import { hasColoringPaint } from "@/lib/coloring/bitmap";
import {
  loadColoringPreferences,
  saveColoringPreferences,
} from "@/lib/coloring/preferences";
import { ColoringRegions } from "@/lib/coloring/regions";
import { useColoringArtworkSave } from "./useColoringArtworkSave";
import { useColoringExport } from "./useColoringExport";
import { useColoringLeave } from "./useColoringLeave";
import {
  useColoringGesture,
  DEFAULT_COLORING_VIEW as DEFAULT_VIEW,
} from "./useColoringGesture";
import { useReferenceSampler } from "./useReferenceSampler";
import { paletteName } from "@/lib/coloring/reference-pick";

const TRANSPARENT: Rgba = [255, 255, 255, 0];

/** 油漆桶：pointerup 前位移超過此值（螢幕 px）視為手勢，不填色。 */
const BUCKET_MOVE_TOLERANCE = 10;

type Point = { x: number; y: number };

type ColoringCanvasProps = {
  page: ColoringPage;
  onBack: () => void;
};

export function ColoringCanvas({
  page,
  onBack,
}: ColoringCanvasProps) {
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
  /** G-L3：本筆觸的「不出線」遮罩（蠟筆起筆時算，收筆清掉） */
  const strokeMaskRef = useRef<Uint8Array | null>(null);
  const strokeColorRef = useRef<Rgba>(TRANSPARENT);
  const strokeRadiusRef = useRef(10);
  const drawingRef = useRef(false);
  const lastPtRef = useRef<Point | null>(null);

  const history = useColoringHistory();
  const {
    push: pushUndoPatch,
    reset: resetHistory,
    apply: applyHistory,
    canUndo,
    canRedo,
  } = history;
  const regionsRef = useRef<ColoringRegions | null>(null);
  const rafRef = useRef<number | null>(null);

  const {
    pointersRef,
    gestureRef,
    viewActive,
    applyView,
    startGesture,
    applyGesture,
  } = useColoringGesture(stageRef, displayRef);
  const bucketStartRef = useRef<Point | null>(null);
  const bucketMovedRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<ColoringTool>("crayon");
  const [colorHex, setColorHex] = useState("#e85d4c");
  const [brushSize, setBrushSize] = useState<BrushSizeId>("medium");
  const [peek, setPeek] = useState(false);
  const [pickStatus, setPickStatus] = useState("");
  const peekTriggerRef = useRef<HTMLButtonElement>(null);
  const sampleReference = useReferenceSampler(page.referenceSrc);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [guided, setGuided] = useState(true);
  const [colorGroup, setColorGroup] = useState<"all" | "rainbow" | "forest">(
    "all",
  );
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState("");
  const [actionError, setActionError] = useState("");
  const artwork = useColoringArtworkSave(page);
  const { notePaint } = artwork;
  const [doneOpen, setDoneOpen] = useState(false);
  const [doneBusy, setDoneBusy] = useState(false);
  const doneBusyRef = useRef(false);
  const [doneSnapshotUrl, setDoneSnapshotUrl] = useState<string | null>(null);
  const doneSnapshotUrlRef = useRef<string | null>(null);
  const snapshotAliveRef = useRef(true);
  const doneRequestRef = useRef(0);
  const [hasPainted, setHasPainted] = useState(false);
  const [usedBucket, setUsedBucket] = useState(false);

  const revokeDoneSnapshot = useCallback(() => {
    if (doneSnapshotUrlRef.current) {
      URL.revokeObjectURL(doneSnapshotUrlRef.current);
      doneSnapshotUrlRef.current = null;
    }
    setDoneSnapshotUrl(null);
  }, []);

  const markPainted = useCallback(() => {
    const p = paintRef.current;
    if (!p) return;
    const painted = hasColoringPaint(
      p.getContext("2d")!.getImageData(0, 0, p.width, p.height).data,
    );
    setHasPainted(painted);
    notePaint(painted);
  }, [notePaint]);

  useEffect(() => {
    const p = loadColoringPreferences();
    setTool(p.tool);
    setColorHex(p.colorHex);
    setBrushSize(p.brushSize);
    setGuided(p.guided);
    setUsedBucket(p.usedBucket);
    setPreferencesReady(true);
  }, []);
  useEffect(() => {
    if (preferencesReady)
      saveColoringPreferences({
        tool,
        colorHex,
        brushSize,
        guided,
        usedBucket,
      });
  }, [tool, colorHex, brushSize, guided, usedBucket, preferencesReady]);

  /** 從彩圖拿顏色；拿著橡皮擦時順便換回蠟筆，點下去才看得到顏色。 */
  const pickReferenceColor = useCallback((hex: string) => {
    setColorHex(hex);
    setTool((current) => (current === "eraser" ? "crayon" : current));
    setPickStatus(`換成${paletteName(hex)}了`);
    playSfx("tap");
  }, []);
  const closePeek = useCallback(() => {
    setPeek(false);
    peekTriggerRef.current?.focus({ preventScroll: true });
  }, []);

  const closeDoneOverlay = useCallback(() => {
    setDoneOpen(false);
    revokeDoneSnapshot();
  }, [revokeDoneSnapshot]);

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

  const stampSegment = useCallback(
    (from: Point, to: Point) => {
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
          strokeMaskRef.current,
        );
        dirty = unionDirtyRect(dirty, rect);
      }
      if (!dirty) return;
      strokeDirtyRef.current = unionDirtyRect(strokeDirtyRef.current, dirty);
      const ctx = paintRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.putImageData(img, 0, 0, dirty.x, dirty.y, dirty.width, dirty.height);
      requestComposite();
    },
    [requestComposite],
  );

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
      strokeColorRef.current =
        tool === "eraser" ? TRANSPARENT : hexToRgba(colorHex);
      strokeRadiusRef.current = Math.max(
        1,
        Math.round(brushDisplayRadius(tool) * canvasScale()),
      );
      // G-L3：蠟筆自動不出線——起筆點所在的封閉區域當遮罩；橡皮擦不限（要能擦掉出界的舊筆觸）
      strokeMaskRef.current =
        tool === "crayon" && guided
          ? (regionsRef.current?.resolve(pt.x, pt.y, 4 * canvasScale()) ?? null)
          : null;
      if (tool === "crayon" && guided && !strokeMaskRef.current) {
        strokeImgRef.current = null;
        strokeBaseRef.current = null;
        return;
      }
      drawingRef.current = true;
      lastPtRef.current = pt;
      stampSegment(pt, pt);
    },
    [tool, colorHex, guided, brushDisplayRadius, canvasScale, stampSegment],
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
    strokeMaskRef.current = null;
  }, [requestComposite]);

  const finishStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPtRef.current = null;
    const base = strokeBaseRef.current;
    const dirty = strokeDirtyRef.current;
    if (base && dirty) {
      pushUndoPatch({ rect: dirty, pixels: cropImageDataRect(base, dirty) });
      markPainted();
    }
    strokeImgRef.current = null;
    strokeBaseRef.current = null;
    strokeDirtyRef.current = null;
    strokeMaskRef.current = null;
  }, [pushUndoPatch, markPainted]);

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
      setUsedBucket(true);
      playSfx("tap");
      ctx.putImageData(img, 0, 0, rect.x, rect.y, rect.width, rect.height);
      markPainted();
      requestComposite();
    },
    [colorHex, pushUndoPatch, markPainted, requestComposite],
  );

  const startGestureIfTwoPointers = useCallback(() => {
    cancelStroke();
    bucketStartRef.current = null;
    startGesture();
  }, [cancelStroke, startGesture]);

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
    [tool, brushDisplayRadius, gestureRef],
  );

  useEffect(() => {
    let cancelled = false;
    const pointers = pointersRef.current;
    setReady(false);
    setLoadError(null);
    setDoneOpen(false);
    revokeDoneSnapshot();
    setHasPainted(false);

    resetHistory();
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
      regionsRef.current = new ColoringRegions(lineDataRef.current, w, h);

      if (!cancelled) {
        composite();
        setReady(true);
      }
    };
    img.onerror = () => {
      if (!cancelled) setLoadError("線稿暫時打不開，請重試或換一張。");
    };
    img.src = page.lineArtSrc;

    return () => {
      cancelled = true;

      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      pointers.clear();
      gestureRef.current = null;
      drawingRef.current = false;
    };
  }, [
    page.id,
    page.lineArtSrc,
    composite,
    applyView,
    revokeDoneSnapshot,
    resetHistory,
    retry,
    gestureRef,
    pointersRef,
  ]);

  useEffect(() => {
    snapshotAliveRef.current = true;
    return () => {
      snapshotAliveRef.current = false;
      doneRequestRef.current += 1;
      revokeDoneSnapshot();
    };
  }, [revokeDoneSnapshot]);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!ready || doneBusyRef.current) return;
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

  const handleHistory = (direction: "undo" | "redo") => {
    if (doneBusyRef.current) return;
    const ctx = paintRef.current?.getContext("2d");
    if (!ctx || !applyHistory(direction, ctx)) return;
    composite();
    markPainted();
  };
  const handleUndo = () => handleHistory("undo");
  const handleRedo = () => handleHistory("redo");

  const handleClear = () => {
    if (doneBusyRef.current) return;
    const paint = paintRef.current;
    const ctx = paint?.getContext("2d");
    if (!paint || !ctx) return;
    const rect: DirtyRect = {
      x: 0,
      y: 0,
      width: paint.width,
      height: paint.height,
    };
    const current = ctx.getImageData(0, 0, paint.width, paint.height);
    pushUndoPatch({ rect, pixels: cropImageDataRect(current, rect) });
    ctx.clearRect(0, 0, paint.width, paint.height);
    markPainted();
    composite();
  };

  const getComposited = useCallback(() => {
    composite();
    return displayRef.current;
  }, [composite]);
  const exporter = useColoringExport({
    title: page.title,
    getComposited,
    onError: setActionError,
  });

  const handleDone = async () => {
    if (!ready || !hasPainted || doneBusyRef.current) return;
    doneBusyRef.current = true;
    setDoneBusy(true);
    finishStroke();
    composite();
    const display = displayRef.current;
    if (!display) {
      doneBusyRef.current = false;
      setDoneBusy(false);
      return;
    }
    const request = ++doneRequestRef.current;
    try {
      const captured = await artwork.capture(display);
      if (!snapshotAliveRef.current || request !== doneRequestRef.current)
        return;
      revokeDoneSnapshot();
      const url = URL.createObjectURL(captured.snapshot);
      doneSnapshotUrlRef.current = url;
      setDoneSnapshotUrl(url);
      try {
        await artwork.save(captured);
        setCollectionStatus("作品已收藏在這台裝置");
      } catch {
        setCollectionStatus("作品尚未收藏，請下載保存，或重試收藏。");
      }
      if (!snapshotAliveRef.current || request !== doneRequestRef.current)
        return;
      setDoneOpen(true);
      playSfx("collect");
    } catch {
      setActionError("作品圖片暫時無法產生，請再試一次。");
    } finally {
      doneBusyRef.current = false;
      if (snapshotAliveRef.current) setDoneBusy(false);
    }
  };
  const startNew = () => {
    handleClear();
    closeDoneOverlay();
    artwork.forgetSaved();
  };

  const leave = useColoringLeave({
    unsaved: artwork.unsaved,
    getDisplay: getComposited,
    onBack,
    saveNow: async () => {
      finishStroke();
      const display = getComposited();
      if (!display) throw new Error("畫布尚未載入");
      await artwork.save(await artwork.capture(display));
    },
  });

  return (
    <div className={styles.root}>
      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.backPage}
          onClick={() => leave.requestLeave("picker")}
        >
          ← 換一張
        </button>
        <p className={styles.pageTitle}>{page.title}</p>
        {hasPainted ? (
          <button
            type="button"
            className={styles.doneBtn}
            onClick={handleDone}
            disabled={doneBusy}
          >
            {COLORING_DONE_CTA}
          </button>
        ) : null}
      </div>

      <div className={styles.reference}>
        <ColoringReference
          ref={peekTriggerRef}
          page={page}
          sample={sampleReference}
          onPick={pickReferenceColor}
          onPeek={() => setPeek(true)}
          status={pickStatus}
        />
      </div>

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
        {peek ? (
          <ColoringReferencePeek
            page={page}
            sample={sampleReference}
            onPick={pickReferenceColor}
            onClose={closePeek}
          />
        ) : null}
        {!ready ? (
          <div className={styles.loading} role="status">
            <span>{loadError ?? "載入線稿中…"}</span>
            {loadError ? (
              <div>
                <button type="button" onClick={() => setRetry((n) => n + 1)}>
                  重試
                </button>
                <button type="button" onClick={onBack}>
                  換一張
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {actionError ? (
        <p role="status" aria-live="polite" className={styles.saveNotice}>
          {actionError}
        </p>
      ) : null}

      {!usedBucket ? (
        <ColoringHint
          className={styles.openHint}
          step={hasPainted ? "fill" : "draw"}
          colorHex={colorHex}
        />
      ) : null}
      {/* G-H3：色盤＋工具列黏在視窗底（手機）／畫布右欄（桌機），畫布可見時一定搆得到 */}
      <div className={styles.controls} data-testid="coloring-controls">
        <ColoringPalette
          colorHex={colorHex}
          onChange={setColorHex}
          group={colorGroup}
        />
        <ColoringToolbar
          tool={tool}
          onToolChange={setTool}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          ready={ready && !doneBusy}
          colorGroup={colorGroup}
          onColorGroupChange={setColorGroup}
          guided={guided}
          onGuidedChange={setGuided}
          canRedo={canRedo}
          onRedo={handleRedo}
          onPrint={() => void exporter.print(page.lineArtSrc)}
          canUndo={canUndo}
          onUndo={handleUndo}
          onClear={handleClear}
          onDownload={exporter.download}
          viewActive={viewActive}
          onResetView={() => applyView(DEFAULT_VIEW)}
          cueTool={hasPainted && !usedBucket ? "bucket" : null}
        />
      </div>

      {doneOpen ? (
        <ColoringDoneSheet
          page={page}
          snapshotUrl={doneSnapshotUrl}
          collectionStatus={collectionStatus}
          saveFailed={collectionStatus.startsWith("作品尚未")}
          unsaved={artwork.unsaved}
          onReplay={closeDoneOverlay}
          onChangePage={() => leave.requestLeave("picker")}
          onRetrySave={() => void handleDone()}
          onDownload={exporter.download}
          onShare={exporter.share}
          onPrint={exporter.printArtwork}
          onStartNew={startNew}
        />
      ) : null}

      {leave.sheet ? <ColoringLeaveSheet {...leave.sheet} /> : null}
    </div>
  );
}
