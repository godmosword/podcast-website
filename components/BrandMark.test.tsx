import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import BrandMark from "./BrandMark";

vi.stubGlobal("React", React);

const imgs = (html: string) => html.match(/<img\b[^>]*>/g) ?? [];

describe("BrandMark", () => {
  it("章上的 Spotify：日間黑色版、夜間白色版各一張，裝飾用", () => {
    const html = renderToStaticMarkup(<BrandMark id="spotify" surface="chip" />);
    const [day, night] = imgs(html);
    expect(imgs(html)).toHaveLength(2);
    expect(day).toContain('src="/brand/spotify-icon-black.png"');
    expect(night).toContain('src="/brand/spotify-icon-white.png"');
    for (const img of [day, night]) {
      expect(img).toContain('alt=""');
      expect(img).toContain('width="30"');
      expect(img).toContain('height="30"');
    }
    expect(html).toContain('aria-hidden="true"');
  });

  it("文字列上的 Spotify 日間用黑色版", () => {
    const html = renderToStaticMarkup(<BrandMark id="spotify" surface="row" />);
    expect(imgs(html)[0]).toContain('src="/brand/spotify-icon-black.png"');
  });

  it("日夜同一個檔時只輸出一張圖", () => {
    const html = renderToStaticMarkup(<BrandMark id="apple" surface="chip" />);
    expect(imgs(html)).toHaveLength(1);
    expect(imgs(html)[0]).toContain('src="/brand/apple-podcasts-icon.png"');
  });

  it("KKBOX 字標 38px 寬、依原比例算高", () => {
    const html = renderToStaticMarkup(<BrandMark id="kkbox" surface="chip" />);
    expect(imgs(html)[0]).toContain('width="38"');
    expect(imgs(html)[0]).toMatch(/height="7\.9\d*"/);
  });

  it("Instagram 用官方漸層圖示，日夜同一張", () => {
    const html = renderToStaticMarkup(<BrandMark id="instagram" surface="chip" />);
    expect(imgs(html)).toHaveLength(1);
    expect(imgs(html)[0]).toContain('src="/brand/instagram-glyph-gradient.png"');
    expect(html).not.toContain("youtube-icon.svg");
    expect(html).not.toContain("spotify-icon-green.png");
  });
});
