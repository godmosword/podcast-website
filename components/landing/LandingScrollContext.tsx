"use client";

import { createContext, useContext } from "react";

type LandingScrollContextValue = {
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  scrollToSegment: (anchorId: string) => void;
};

export const LandingScrollContext =
  createContext<LandingScrollContextValue | null>(null);

export function useLandingScroll() {
  return useContext(LandingScrollContext);
}
