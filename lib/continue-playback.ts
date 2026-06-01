const STORAGE_KEY = "chechecar-continue";

export type ContinueState = {
  slug: string;
  page: number;
  time: number;
  updatedAt: number;
};

export function saveContinue(state: Omit<ContinueState, "updatedAt">): void {
  if (typeof window === "undefined") return;
  const payload: ContinueState = { ...state, updatedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadContinue(): ContinueState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ContinueState;
  } catch {
    return null;
  }
}

export function clearContinue(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
