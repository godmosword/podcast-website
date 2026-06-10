import {
  getFavoritesFromStore,
  isFavoriteInStore,
  toggleFavoriteInStore,
} from "@/lib/progress-store";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  return getFavoritesFromStore();
}

export function isFavorite(slug: string): boolean {
  if (typeof window === "undefined") return false;
  return isFavoriteInStore(slug);
}

export function toggleFavorite(slug: string): string[] {
  if (typeof window === "undefined") return [];
  return toggleFavoriteInStore(slug);
}
