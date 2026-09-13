// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyThemeToDocument,
  LIGHT_THEME,
  LIGHT_THEME_COLOR,
  NIGHT_THEME,
  NIGHT_THEME_COLOR,
} from "./theme";

/**
 * `app/layout.tsx` 的 viewport 會 SSR 出這兩個 meta：首次繪製跟 OS 配色走。
 * 但夜間不只看 OS（睡前時段也算），所以 JS 解出主題後必須由單一 meta 接管。
 */
function renderServerThemeColorMetas(): void {
  document.head.innerHTML = `
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="${LIGHT_THEME_COLOR}">
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="${NIGHT_THEME_COLOR}">
  `;
}

function themeColorMetas(): { media: string | null; content: string }[] {
  return Array.from(
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
  ).map((m) => ({ media: m.getAttribute("media"), content: m.content }));
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.documentElement.removeAttribute("data-theme");
});

describe("applyThemeToDocument 的 theme-color 接管", () => {
  it("夜間：移除兩個 media-scoped meta，只留一個深色的無 media meta", () => {
    renderServerThemeColorMetas();
    applyThemeToDocument(NIGHT_THEME);
    expect(themeColorMetas()).toEqual([
      { media: null, content: NIGHT_THEME_COLOR },
    ]);
  });

  it("日間：同樣收斂為單一 meta", () => {
    renderServerThemeColorMetas();
    applyThemeToDocument(LIGHT_THEME);
    expect(themeColorMetas()).toEqual([
      { media: null, content: LIGHT_THEME_COLOR },
    ]);
  });

  it("OS 亮色 + 睡前轉夜間時，深色不會被 light 的 media meta 蓋掉", () => {
    renderServerThemeColorMetas();
    applyThemeToDocument(NIGHT_THEME);
    const scoped = document.querySelectorAll('meta[name="theme-color"][media]');
    expect(scoped.length).toBe(0);
  });

  it("重複切換不會累積 meta", () => {
    renderServerThemeColorMetas();
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
