import { describe, expect, it } from "vitest";
import { listGlyphKeys, playgroundTypeGlyphSvg } from "./playground-type-glyph";
import { PLAYGROUND_TYPE_VISUAL_KEYS } from "./playground-type-visual";

describe("playgroundTypeGlyphSvg", () => {
  it("七種類型都有剪影，沒有類型漏掉", () => {
    expect(listGlyphKeys()).toEqual(PLAYGROUND_TYPE_VISUAL_KEYS);
    for (const key of PLAYGROUND_TYPE_VISUAL_KEYS) {
      const svg = playgroundTypeGlyphSvg(key);
      expect(svg, `${key} 應產生 svg`).toMatch(/^<svg[\s>]/);
      expect(svg).toMatch(/<\/svg>$/);
      expect(svg.length, `${key} 剪影不得為空殼`).toBeGreaterThan(60);
    }
  });

  it("每個類型的剪影互不相同（形狀要能區分類型）", () => {
    const bodies = PLAYGROUND_TYPE_VISUAL_KEYS.map((key) =>
      playgroundTypeGlyphSvg(key),
    );
    expect(new Set(bodies).size).toBe(PLAYGROUND_TYPE_VISUAL_KEYS.length);
  });

  it("顏色一律交給 CSS：不得寫死色碼，只用 currentColor", () => {
    for (const key of PLAYGROUND_TYPE_VISUAL_KEYS) {
      const svg = playgroundTypeGlyphSvg(key);
      expect(svg, `${key} 不得出現 hex 色碼`).not.toMatch(/#[0-9a-fA-F]{3,8}/);
      expect(svg, `${key} 不得引用 --c-* token`).not.toContain("var(--");
      expect(svg).toContain("currentColor");
    }
  });

  /*
   * 室內樂園的門是用 evenodd 挖出來的負空間。若日後有人清理 SVG 屬性把它拿掉，
   * 門會被填實，室內樂園會靜默變成一個實心五角形＝農場，而其他測試全數綠燈。
   */
  it("室內樂園的門靠 evenodd 挖空，屬性不得被清掉", () => {
    expect(playgroundTypeGlyphSvg("indoor-park")).toContain(
      'fill-rule="evenodd"',
    );
  });

  it("剪影為裝飾，語意由外層 button 的 aria-label 承擔", () => {
    for (const key of PLAYGROUND_TYPE_VISUAL_KEYS) {
      expect(playgroundTypeGlyphSvg(key)).toContain('aria-hidden="true"');
    }
  });

  it("不含可被 innerHTML 誤讀的內容（靜態常數、無外部輸入）", () => {
    for (const key of PLAYGROUND_TYPE_VISUAL_KEYS) {
      const svg = playgroundTypeGlyphSvg(key);
      expect(svg).not.toContain("<script");
      expect(svg).not.toMatch(/\son[a-z]+=/i);
    }
  });
});
