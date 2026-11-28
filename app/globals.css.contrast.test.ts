import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AA_NORMAL_TEXT, contrastRatio, parseHex } from "@/lib/contrast";

const css = readFileSync(join(import.meta.dirname, "globals.css"), "utf8");

/**
 * 只讀 `:root` 區塊裡的字面 hex。`color-mix()`／`var()` 衍生值不在這裡驗——
 * 那些要嘛在夜間區塊（已另行實測），要嘛得先跑 CSS 引擎才解得出來。
 */
function rootToken(name: string): string {
  const root = css.slice(0, css.indexOf('[data-theme="night"]'));
  const match = root.match(
    new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`),
  );
  if (!match) throw new Error(`:root 找不到字面 hex 的 --${name}`);
  return match[1]!;
}

/** 夜間區塊裡的字面 hex（本頁 --pm-* 夜間值刻意寫成字面值，才能在這裡驗）。 */
function nightToken(name: string): string {
  const start = css.indexOf('[data-theme="night"] {');
  const night = css.slice(start, css.indexOf("}", start));
  const match = night.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`));
  if (!match) throw new Error(`夜間區塊找不到字面 hex 的 --${name}`);
  return match[1]!;
}

describe("親子遊樂地圖 --pm-* 對比門檻（日夜）", () => {
  it("理由行對卡片達 AA 內文、選中框對卡片 ≥3:1", () => {
    const cases = [
      ["日間", rootToken, rootToken("card")],
      ["夜間", nightToken, nightToken("card")],
    ] as const;
    for (const [label, token, card] of cases) {
      const reason = contrastRatio(token("pm-reason"), card);
      expect(reason, `${label} --pm-reason = ${reason.toFixed(2)}`).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      const selected = contrastRatio(token("pm-selected"), card);
      expect(selected, `${label} --pm-selected = ${selected.toFixed(2)}`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("globals.css 日間色彩對比門檻", () => {
  it("--support-fg 對 --support-from／--support-to 皆達 AA 內文", () => {
    const fg = rootToken("support-fg");
    for (const stop of ["support-from", "support-to"]) {
      const ratio = contrastRatio(fg, rootToken(stop));
      expect(ratio, `--support-fg on --${stop} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(
        AA_NORMAL_TEXT,
      );
    }
  });

  it("--ink 與 --ink-soft 對 --bg／--card 皆達 AA 內文", () => {
    for (const ink of ["ink", "ink-soft"]) {
      for (const surface of ["bg", "card"]) {
        const ratio = contrastRatio(rootToken(ink), rootToken(surface));
        expect(
          ratio,
          `--${ink} on --${surface} = ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      }
    }
  });

  it("--accent-ink 對 --card 達 AA 內文（--accent 本身刻意不當文字色）", () => {
    const ratio = contrastRatio(rootToken("accent-ink"), rootToken("card"));
    expect(ratio, `--accent-ink on --card = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });
});

/** sRGB `color-mix`：第一個顏色的權重是 0–100，其餘給第二個顏色。 */
function mixHex(first: string, firstPercent: number, second: string): string {
  const a = parseHex(first);
  const b = parseHex(second);
  const weight = firstPercent / 100;
  const channels = [a.r, a.g, a.b].map((channel, index) => {
    const other = [b.r, b.g, b.b][index]!;
    return Math.round(channel * weight + other * (1 - weight));
  });
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function themeBlock(which: "root" | "night"): string {
  const marker = css.indexOf('[data-theme="night"]');
  if (which === "root") return css.slice(0, marker);
  const open = css.indexOf('[data-theme="night"] {');
  return css.slice(open, css.indexOf("}", open));
}

/** 字面 hex，或區塊裡那一行 `color-mix(in srgb, var(--a) N%, var(--b))`。 */
function surface(which: "root" | "night", name: string): string {
  const block = themeBlock(which);
  const literal = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`));
  if (literal) return literal[1]!;
  const mix = block.match(
    new RegExp(
      `--${name}:\\s*color-mix\\(\\s*in srgb\\s*,\\s*var\\(--([\\w-]+)\\)\\s*(\\d+(?:\\.\\d+)?)%\\s*,\\s*var\\(--([\\w-]+)\\)(?:\\s*(\\d+(?:\\.\\d+)?)%)?\\s*\\)`,
    ),
  );
  if (!mix) throw new Error(`${which} 找不到 --${name}`);
  const resolve = (tokenName: string): string => {
    if (which === "night") {
      const nightLiteral = themeBlock("night").match(
        new RegExp(`--${tokenName}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`),
      );
      if (nightLiteral) return nightLiteral[1]!;
    }
    return rootToken(tokenName);
  };
  const firstPercent = Number(mix[2]);
  const secondPercent = mix[4] != null ? Number(mix[4]) : 100 - firstPercent;
  return mixHex(
    resolve(mix[1]!),
    (firstPercent / (firstPercent + secondPercent)) * 100,
    resolve(mix[3]!),
  );
}

describe("次要文字 --ink-soft 對實際背景達 AA 4.5:1", () => {
  const daySurfaces = [
    "bg",
    "bg-2",
    "card",
    "card-2",
    "pm-page",
    "landing-nav-cta-bg",
    "surface-game",
    "page-warm-from",
    "page-warm-mid",
    "page-warm-to",
    "warm-surface",
    "warm-surface-2",
  ] as const;

  const nightSurfaces = [
    "bg",
    "bg-2",
    "card",
    "card-2",
    "pm-page",
    "nav-panel-bg",
    "page-warm-from",
    "page-warm-mid",
    "page-warm-to",
    "warm-surface",
    "warm-surface-2",
  ] as const;

  it("日間 --ink-soft 與遊戲鎖日色對頁面、卡片、暖色表面皆 ≥ 4.5", () => {
    const fg = rootToken("ink-soft");
    expect(rootToken("game-day-ink-soft"), "遊戲夜間鎖回的次要字必須等於日間 --ink-soft").toBe(fg);
    for (const name of daySurfaces) {
      const bg = surface("root", name);
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `日間 --ink-soft ${fg} on --${name} ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(
        AA_NORMAL_TEXT,
      );
    }
  });

  it("夜間 --ink-soft 對頁面、卡片、暖色表面皆 ≥ 4.5", () => {
    const fg = nightToken("ink-soft");
    for (const name of nightSurfaces) {
      const bg = surface("night", name);
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `夜間 --ink-soft ${fg} on --${name} ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(
        AA_NORMAL_TEXT,
      );
    }
  });

  it("釘死日間次要字的複本與 token 同色", () => {
    const fg = rootToken("ink-soft");
    const root = join(import.meta.dirname, "..");
    const read = (path: string) => readFileSync(join(root, path), "utf8");
    expect(read("components/games/CandyMatchPlay.module.css")).toContain(`--ink-soft: ${fg};`);
    expect(read("components/games/DinoSushiView.module.css")).toContain(`--ink-soft: ${fg};`);
    expect(read("lib/gamekit/react/tutorial-overlay.module.css")).toContain(`var(--ink-soft, ${fg})`);
    expect(read("lib/story-og.tsx")).toContain(`const INK_SOFT = "${fg}"`);
    expect(read("lib/universe/og.tsx")).toContain(`const INK_SOFT = "${fg}"`);
    expect(read("lib/games/og.tsx")).toContain(`inkSoft: "${fg}"`);
  });
});
