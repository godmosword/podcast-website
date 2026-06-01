const STORAGE_KEY = "chechecar-favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function isFavorite(slug: string): boolean {
  return getFavorites().includes(slug);
}

export function toggleFavorite(slug: string): string[] {
  if (typeof window === "undefined") return [];
  const current = getFavorites();
  const next = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [...current, slug];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
