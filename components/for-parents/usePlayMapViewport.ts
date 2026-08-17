"use client";

import { useCallback, useRef, useState } from "react";
import type {
  PlaygroundBounds,
} from "@/lib/playgrounds-query";

export type PlayMapViewportSnapshot = {
  bounds: PlaygroundBounds;
  zoom: number;
};

export type PlayMapViewportChangeSource = "user" | "programmatic";

const BOUNDS_PRECISION = 1_000;

export function normalizePlayMapBounds(
  bounds: PlaygroundBounds,
): PlaygroundBounds {
  return {
    south: Math.round(bounds.south * BOUNDS_PRECISION) / BOUNDS_PRECISION,
    west: Math.round(bounds.west * BOUNDS_PRECISION) / BOUNDS_PRECISION,
    north: Math.round(bounds.north * BOUNDS_PRECISION) / BOUNDS_PRECISION,
    east: Math.round(bounds.east * BOUNDS_PRECISION) / BOUNDS_PRECISION,
  };
}

export function playMapBoundsKey(bounds: PlaygroundBounds | null): string {
  if (!bounds) return "";
  const normalized = normalizePlayMapBounds(bounds);
  return [
    normalized.south,
    normalized.west,
    normalized.north,
    normalized.east,
  ].join(",");
}

export function arePlayMapBoundsMeaningfullyDifferent(
  first: PlaygroundBounds | null,
  second: PlaygroundBounds | null,
): boolean {
  return playMapBoundsKey(first) !== playMapBoundsKey(second);
}

/**
 * Map viewport 的唯一 state boundary。filter hook 不知道 Leaflet 的 live
 * camera，只收到這裡已 commit 的 bounds，維持兩種語意分離。
 */
export function usePlayMapViewport() {
  const [liveBounds, setLiveBounds] = useState<PlaygroundBounds | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [committedSearchBounds, setCommittedSearchBounds] =
    useState<PlaygroundBounds | null>(null);
  const [hasPendingViewportSearch, setHasPendingViewportSearch] =
    useState(false);
  const baselineRef = useRef<PlaygroundBounds | null>(null);

  const handleViewportSettled = useCallback(
    (
      snapshot: PlayMapViewportSnapshot,
      source: PlayMapViewportChangeSource,
    ) => {
      const bounds = normalizePlayMapBounds(snapshot.bounds);
      setLiveBounds((current) =>
        playMapBoundsKey(current) === playMapBoundsKey(bounds) ? current : bounds,
      );
      setZoom((current) => (current === snapshot.zoom ? current : snapshot.zoom));

      if (source === "programmatic") {
        baselineRef.current = bounds;
        setHasPendingViewportSearch(false);
        return;
      }

      if (!baselineRef.current) {
        baselineRef.current = bounds;
        setHasPendingViewportSearch(true);
        return;
      }

      setHasPendingViewportSearch(
        arePlayMapBoundsMeaningfullyDifferent(baselineRef.current, bounds),
      );
    },
    [],
  );

  const handleCommitViewportSearch = useCallback(() => {
    if (!liveBounds) return;
    const bounds = normalizePlayMapBounds(liveBounds);
    setCommittedSearchBounds(bounds);
    baselineRef.current = bounds;
    setHasPendingViewportSearch(false);
  }, [liveBounds]);

  const handleClearViewportSearch = useCallback(() => {
    setCommittedSearchBounds(null);
    baselineRef.current = liveBounds;
    setHasPendingViewportSearch(false);
  }, [liveBounds]);

  const handleResetForMajorFilter = useCallback(() => {
    setCommittedSearchBounds(null);
    baselineRef.current = liveBounds;
    setHasPendingViewportSearch(false);
  }, [liveBounds]);

  return {
    liveBounds,
    zoom,
    committedSearchBounds,
    hasPendingViewportSearch,
    handleViewportSettled,
    handleCommitViewportSearch,
    handleClearViewportSearch,
    handleResetForMajorFilter,
  };
}
