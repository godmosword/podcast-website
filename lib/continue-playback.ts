import type { ContinueState } from "@/lib/progress-store";
import {
  clearContinueInStore,
  loadContinueFromStore,
  saveContinueInStore,
} from "@/lib/progress-store";

export type { ContinueState };

export function saveContinue(state: Omit<ContinueState, "updatedAt">): void {
  if (typeof window === "undefined") return;
  saveContinueInStore(state);
}

export function loadContinue(): ContinueState | null {
  if (typeof window === "undefined") return null;
  return loadContinueFromStore();
}

export function clearContinue(): void {
  if (typeof window === "undefined") return;
  clearContinueInStore();
}
