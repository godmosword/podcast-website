/** 著色本頁面查詢（選圖列表／單頁）。 */
import {
  COLORING_PAGES,
  type ColoringPage,
  type ColoringPageKind,
} from "@/data/coloring-pages";
import type { ZoneId } from "@/data/universe-zones";

const byId = new Map(COLORING_PAGES.map((page) => [page.id, page]));

export function listColoringPages(kind?: ColoringPageKind): readonly ColoringPage[] {
  if (!kind) return COLORING_PAGES;
  return COLORING_PAGES.filter((page) => page.kind === kind);
}

export function getColoringPage(id: string): ColoringPage | undefined {
  return byId.get(id);
}

export function listColoringPagesByZone(zoneId: ZoneId): readonly ColoringPage[] {
  return COLORING_PAGES.filter((page) => page.zoneId === zoneId);
}
