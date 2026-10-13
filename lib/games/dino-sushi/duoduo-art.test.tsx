import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DuoDuoArt, type DuoDuoFace, type DuoDuoMouth } from "./duoduo-art";

vi.stubGlobal("React", React);

const POSES: ReadonlyArray<readonly [DuoDuoFace, DuoDuoMouth]> = [
  ["idle", "closed"],
  ["idle", "open"],
  ["yum", "chew"],
  ["look", "closed"],
  ["love", "closed"],
  ["puff", "laugh"],
  ["sweet", "closed"],
];

const svgs = (html: string) => html.match(/<svg[\s\S]*?<\/svg>/g) ?? [];
const ids = (svg: string) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]!);
const refs = (svg: string) => [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]!);

describe("DuoDuoArt 黏土漸層", () => {
  it("同一頁兩隻多多：漸層 id 不重複，每個 url(#…) 都指向自己這張 SVG 的 defs", () => {
    const html = renderToStaticMarkup(
      <>
        <DuoDuoArt face="idle" mouth="open" />
        <DuoDuoArt face="love" mouth="closed" />
      </>,
    );
    const [a, b] = svgs(html);
    expect(a && b).toBeTruthy();
    expect(ids(a!).filter((id) => ids(b!).includes(id))).toEqual([]);
    for (const svg of [a!, b!]) {
      const own = new Set(ids(svg));
      expect(refs(svg).filter((r) => !own.has(r))).toEqual([]);
    }
  });

  it("不用 SVG filter（低階手機重算成本高）", () => {
    for (const [face, mouth] of POSES) {
      expect(renderToStaticMarkup(<DuoDuoArt face={face} mouth={mouth} />)).not.toMatch(/<filter|filter=/);
    }
  });
});

describe("DuoDuoArt canon", () => {
  it.each(POSES)("%s／%s：六根橘刺、藍側窗、三顆看得到的輪子、粗黑眉都在", (face, mouth) => {
    const svg = renderToStaticMarkup(<DuoDuoArt face={face} mouth={mouth} />);
    expect(svg.match(/stroke="#cf6a1a"/g)).toHaveLength(6);
    expect(svg).toMatch(/<rect x="20" y="54" width="15" height="21"[^>]*stroke="#2f6fb0"/);
    expect(svg.match(/<circle cx="(24|57|100)" cy="9[35]" r="[89]"/g)).toHaveLength(3);
    expect(svg).toMatch(/stroke="#2c2a28" stroke-width="4.2"/);
  });

  it("嚼嚼時兩頰鼓起，畫在吻部前面一層之前（吻部蓋住內半）", () => {
    const svg = renderToStaticMarkup(<DuoDuoArt face="yum" mouth="chew" />);
    const cheeks = svg.indexOf('data-part="cheeks"');
    const muzzle = svg.indexOf('d="M40 54c4-9 20-12 38-12');
    expect(cheeks).toBeGreaterThan(-1);
    expect(cheeks).toBeLessThan(muzzle);
  });
});
