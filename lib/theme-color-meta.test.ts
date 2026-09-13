// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { PROGRESS_STORAGE_KEY } from "./progress-keys";
import {
  applyThemeToDocument,
  LIGHT_THEME,
  LIGHT_THEME_COLOR,
  NIGHT_THEME,
  NIGHT_THEME_COLOR,
  THEME_INIT_SCRIPT,
} from "./theme";

function themeColorMetas(): { media: string | null; content: string }[] {
  return Array.from(
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
  ).map((m) => ({ media: m.getAttribute("media"), content: m.content }));
}

/**
 * init script 在 `<head>` 裡同步執行，拿不到模組作用域，只能注入依賴。
 * 這裡給它真的 jsdom `document`，才驗得到它建出來的 meta。
 */
function runInitScript(themeMode: string, prefersDark = false, hour = 12): void {
  const store = new Map<string, string>([
    [PROGRESS_STORAGE_KEY, JSON.stringify({ preferences: { theme: themeMode } })],
  ]);
  const MockDate = class extends globalThis.Date {
    constructor(...args: unknown[]) {
      if (args.length === 0) super(2026, 0, 15, hour, 0, 0);
      else super(...(args as ConstructorParameters<DateConstructor>));
    }
  };
  new Function("localStorage", "document", "window", "Date", THEME_INIT_SCRIPT)(
    { getItem: (k: string) => store.get(k) ?? null },
    document,
    { matchMedia: () => ({ matches: prefersDark }) },
    MockDate,
  );
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-bedtime");
});

describe("THEME_INIT_SCRIPT 的 theme-color", () => {
  it("首次繪製前就建好 meta，且只有一個", () => {
    runInitScript("night");
    expect(themeColorMetas()).toEqual([
      { media: null, content: NIGHT_THEME_COLOR },
    ]);
  });

  it("使用者選日間時寫淺色", () => {
    runInitScript("light");
    expect(themeColorMetas()).toEqual([
      { media: null, content: LIGHT_THEME_COLOR },
    ]);
  });

  it("OS 亮色但落在睡前時段時直接寫深色（media query 給不出這個答案）", () => {
    runInitScript("system", false, 21);
    expect(document.documentElement.getAttribute("data-theme")).toBe("night");
    expect(themeColorMetas()).toEqual([
      { media: null, content: NIGHT_THEME_COLOR },
    ]);
  });
});

describe("applyThemeToDocument 的 theme-color", () => {
  it("沿用 init script 建好的同一個節點，不另外新增", () => {
    runInitScript("light");
    const before = document.querySelector('meta[name="theme-color"]');
    applyThemeToDocument(NIGHT_THEME);
    expect(document.querySelector('meta[name="theme-color"]')).toBe(before);
    expect(themeColorMetas()).toEqual([
      { media: null, content: NIGHT_THEME_COLOR },
    ]);
  });

  it("永不移除既有節點——移掉 React 擁有的 <head> meta 會讓整個路由切換中斷", () => {
    document.head.innerHTML =
      '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000">';
    const owned = document.querySelector('meta[name="theme-color"]')!;
    applyThemeToDocument(NIGHT_THEME);
    expect(owned.isConnected).toBe(true);
  });

  it("重複切換不會累積 meta", () => {
    runInitScript("light");
    applyThemeToDocument(NIGHT_THEME);
    applyThemeToDocument(LIGHT_THEME);
    applyThemeToDocument(NIGHT_THEME);
    expect(themeColorMetas()).toEqual([
      { media: null, content: NIGHT_THEME_COLOR },
    ]);
  });

  it("head 原本沒有任何 theme-color 時會補建一個", () => {
    applyThemeToDocument(NIGHT_THEME);
    expect(themeColorMetas()).toEqual([
      { media: null, content: NIGHT_THEME_COLOR },
    ]);
  });

  it("同時把 data-theme 寫上／移除", () => {
    applyThemeToDocument(NIGHT_THEME);
    expect(document.documentElement.getAttribute("data-theme")).toBe("night");
    applyThemeToDocument(LIGHT_THEME);
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });
});
