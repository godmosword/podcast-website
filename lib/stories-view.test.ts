import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyStoriesView,
  isStoriesView,
  readStoriesViewFromDocument,
  STORIES_CATALOG_COVER_SIZES,
  STORIES_VIEW_ATTRIBUTE,
  STORIES_VIEW_INIT_SCRIPT,
  STORIES_VIEW_LIST,
  STORIES_VIEW_STORAGE_KEY,
} from "./stories-view";

function mockBrowser() {
  const attrs = new Map<string, string>();
  const store = new Map<string, string>();
  vi.stubGlobal("document", {
    documentElement: {
      setAttribute(name: string, value: string) {
        attrs.set(name, value);
      },
      removeAttribute(name: string) {
        attrs.delete(name);
      },
      getAttribute(name: string) {
        return attrs.get(name) ?? null;
      },
      hasAttribute(name: string) {
        return attrs.has(name);
      },
    },
  });
  vi.stubGlobal("localStorage", {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  });
  return { attrs, store };
}

describe("stories-view", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("只接受 grid／list", () => {
    expect(isStoriesView("grid")).toBe(true);
    expect(isStoriesView("list")).toBe(true);
    expect(isStoriesView("cards")).toBe(false);
    expect(isStoriesView(null)).toBe(false);
  });

  it("init script 只在 list 時寫 html 屬性，且含 storage key", () => {
    expect(STORIES_VIEW_INIT_SCRIPT).toContain(STORIES_VIEW_STORAGE_KEY);
    expect(STORIES_VIEW_INIT_SCRIPT).toContain(STORIES_VIEW_ATTRIBUTE);
    expect(STORIES_VIEW_INIT_SCRIPT).toContain(STORIES_VIEW_LIST);
    expect(STORIES_VIEW_INIT_SCRIPT).not.toContain("grid");
  });

  it("套用 list 會寫屬性與 localStorage；grid 會清掉屬性", () => {
    const { attrs, store } = mockBrowser();
    applyStoriesView("list");
    expect(attrs.get(STORIES_VIEW_ATTRIBUTE)).toBe(STORIES_VIEW_LIST);
    expect(store.get(STORIES_VIEW_STORAGE_KEY)).toBe("list");
    expect(readStoriesViewFromDocument()).toBe("list");

    applyStoriesView("grid");
    expect(attrs.has(STORIES_VIEW_ATTRIBUTE)).toBe(false);
    expect(store.get(STORIES_VIEW_STORAGE_KEY)).toBe("grid");
    expect(readStoriesViewFromDocument()).toBe("grid");
  });

  it("目錄封面 sizes 手機維持 80／96，桌機才放大", () => {
    expect(STORIES_CATALOG_COVER_SIZES).toContain("(max-width: 480px) 80px");
    expect(STORIES_CATALOG_COVER_SIZES).toContain("(max-width: 767px) 96px");
    expect(STORIES_CATALOG_COVER_SIZES).toContain("400px");
    expect(STORIES_CATALOG_COVER_SIZES).not.toContain("vw");
  });

  it("root layout 在 theme script 之後掛防閃爍 script", () => {
    const layout = readFileSync(
      join(import.meta.dirname, "../app/layout.tsx"),
      "utf8",
    );
    const themeIdx = layout.indexOf(
      "dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}",
    );
    const storiesIdx = layout.indexOf(
      "dangerouslySetInnerHTML={{ __html: STORIES_VIEW_INIT_SCRIPT }}",
    );
    expect(themeIdx).toBeGreaterThan(-1);
    expect(storiesIdx).toBeGreaterThan(themeIdx);
  });
});
