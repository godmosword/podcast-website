"use client";

import { createContext, useContext, type RefObject } from "react";

type LandingScrollContextValue = {
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  scrollToSegment: (anchorId: string) => void;
};

export const LandingScrollContext =
  createContext<LandingScrollContextValue | null>(null);

export function useLandingScroll() {
  return useContext(LandingScrollContext);
}
