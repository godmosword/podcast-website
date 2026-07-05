"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { GameKitGameId } from "@/lib/gamekit/types";
import { viewportFor } from "@/lib/gamekit/runtime/constants";
import { PixelRenderer } from "@/lib/gamekit/runtime/renderer";

export type UsePixelRendererOptions = {
  background?: string;
  maxScale?: number;
};

export type PixelGameSurface = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  displayRef: React.RefObject<HTMLCanvasElement | null>;
  rendererRef: React.RefObject<PixelRenderer | null>;
  present: () => void;
  viewport: { width: number; height: number };
};

const PixelGameSurfaceContext = createContext<PixelGameSurface | null>(null);

export function usePixelGameSurface(): PixelGameSurface {
  const ctx = useContext(PixelGameSurfaceContext);
  if (!ctx) {
    throw new Error("usePixelGameSurface 須在 PixelGameCanvas 內使用");
  }
  return ctx;
}

export function usePixelRenderer(
  gameId: GameKitGameId,
  options: UsePixelRendererOptions = {},
): PixelGameSurface {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PixelRenderer | null>(null);
  const viewport = viewportFor(gameId);
  const { width: viewportWidth, height: viewportHeight } = viewport;

  const present = useCallback(() => {
    const container = containerRef.current;
    const renderer = rendererRef.current;
    if (!container || !renderer) return;
    const rect = container.getBoundingClientRect();
    const layout = renderer.resize(rect.width, rect.height);
    renderer.blit(layout);
  }, []);

  useEffect(() => {
    const renderer = new PixelRenderer({
      viewport: { width: viewportWidth, height: viewportHeight },
      background: options.background,
      maxScale: options.maxScale,
    });
    rendererRef.current = renderer;

    const canvas = displayRef.current;
    if (canvas) {
      renderer.attachDisplay(canvas);
    }

    present();

    const container = containerRef.current;
    if (!container) return undefined;

    const ro = new ResizeObserver(() => present());
    ro.observe(container);
    return () => ro.disconnect();
  }, [gameId, options.background, options.maxScale, present, viewportHeight, viewportWidth]);

  return {
    containerRef,
    displayRef,
    rendererRef,
    present,
    viewport,
  };
}

export { PixelGameSurfaceContext };
