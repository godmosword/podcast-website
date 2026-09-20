import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 美術審 H1 第一刀／綁別名：唯一主鈕底／字色走 --cta-solid-*
 *（計算值仍等於 Landing／留言牆的 --landing-brand-ink／--on-dark）。
 * 以選擇器清單切規則——同一 class 可能先出現在共用高度規則，
 * 再出現在真正上色的規則；只看帶 `background:` 的那一條。
 */

const ROOT = join(import.meta.dirname, "..");

const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "");

const readCss = (...parts: string[]) =>
  readFileSync(join(ROOT, ...parts), "utf8");

const paintRule = (css: string, className: string): string => {
  const stripped = stripComments(css);
  let searchFrom = 0;
  while (searchFrom < stripped.length) {
    const brace = stripped.indexOf("{", searchFrom);
    if (brace === -1) break;
    const end = stripped.indexOf("}", brace);
    if (end === -1) break;
    const prevEnd = stripped.lastIndexOf("}", brace);
    const selector = stripped.slice(prevEnd + 1, brace);
    const names = selector.split(",").map((part) => part.trim());
    const body = stripped.slice(brace, end + 1);
    if (names.includes(`.${className}`) && /background\s*:/.test(body)) {
      return body;
    }
    searchFrom = end + 1;
  }
  return "";
};

const PRIMARY = [
  {
    file: "components/universe/HotspotDetail.module.css",
    className: "cta",
  },
  {
    file: "components/for-parents/ParentGate.module.css",
    className: "submit",
  },
  {
    file: "components/for-parents/PlayMap.module.css",
    className: "navButton",
  },
  {
    file: "app/for-parents/page.module.css",
    className: "toolCta",
  },
  {
    file: "app/for-parents/play-map/[placeId]/page.module.css",
    className: "primaryAction",
  },
  {
    file: "components/games/GameLoadOverlay.module.css",
    className: "startBtn",
  },
  // K-12（2026-09-20）：結束站主鈕改成單顆大 icon 圓鈕 .mainBtn（原 .nextBtn）
  {
    file: "components/games/GameEndStation.module.css",
    className: "mainBtn",
  },
  // H1 收尾（2026-09-16）：/stories 唯一主行動，原本是 story.color 22% 淡紫 pill
  {
    file: "components/LatestHero.module.css",
    className: "cta",
  },
] as const;

describe("主鈕最小 alignment（H1 第一刀）", () => {
  it("七處唯一主鈕綁 --cta-solid-*，不再用橘黃漸層當底板", () => {
    for (const { file, className } of PRIMARY) {
      const css = readCss(...file.split("/"));
      const block = paintRule(css, className);
      expect(block, file).toMatch(/background:\s*var\(--cta-solid-bg\)/);
      expect(block, file).toMatch(/color:\s*var\(--cta-solid-fg\)/);
      expect(block, file).not.toMatch(/--landing-brand-ink/);
      expect(block, file).not.toMatch(/--cta-warm-from/);
      expect(block, file).not.toMatch(/background:\s*linear-gradient/);
    }
  });

  it("Landing 分區 CTA 與留言送出仍直接寫品牌 token，不改綁 solid 別名", () => {
    const landing = paintRule(
      readCss("components", "landing", "LandingSegment.module.css"),
      "cta",
    );
    expect(landing).toMatch(/background:\s*var\(--landing-brand-ink\)/);
    expect(landing).toMatch(/color:\s*var\(--on-dark\)/);
    expect(landing).not.toMatch(/--cta-solid-/);

    const submit = paintRule(
      readCss("components", "feedback", "FeedbackForm.module.css"),
      "submit",
    );
    expect(submit).toMatch(/background:\s*var\(--landing-brand-ink\)/);
    expect(submit).toMatch(/color:\s*var\(--on-dark\)/);
    expect(submit).not.toMatch(/--cta-solid-/);
  });

  it("不改 --cta-warm token（貼紙／夜色仍用舊字色）", () => {
    const globals = readCss("app", "globals.css");
    expect(globals).toMatch(/--cta-warm-from:\s*#ffe889/);
    expect(globals).toMatch(/--cta-warm-to:\s*#ffbd6f/);
    expect(globals).toMatch(/--cta-warm-fg:\s*#614018/);

    const sticker = paintRule(
      readCss("components", "for-parents", "parent-dashboard.module.css"),
      "sticker",
    );
    expect(sticker).toMatch(/color:\s*var\(--cta-warm-fg\)/);
  });

  it("遊戲結束站的小 icon 鈕（再玩／去下一站）仍是次行動，不跟主鈕同色", () => {
    const replay = paintRule(
      readCss("components", "games", "GameEndStation.module.css"),
      "sideBtn",
    );
    expect(replay).toMatch(/background:\s*var\(--cta-soft-bg\)/);
    expect(replay).toMatch(/color:\s*var\(--cta-soft-fg\)/);
    expect(replay).not.toMatch(/--landing-brand-ink/);
    expect(replay).not.toMatch(/--cta-solid-/);
    expect(replay).not.toMatch(/--c-lilac/);
    expect(replay).not.toMatch(/--cta-warm-from/);
  });
});

const SOFT = [
  {
    file: "components/games/GameEndStation.module.css",
    className: "sideBtn",
  },
  {
    file: "components/games/GameLoadOverlay.module.css",
    className: "secondaryBtn",
  },
  {
    file: "components/for-parents/PlayMap.module.css",
    className: "placeLink",
  },
  {
    file: "app/for-parents/play-map/[placeId]/page.module.css",
    className: "secondaryAction",
  },
  {
    file: "app/not-found.module.css",
    className: "ctaSecondary",
  },
  // H1 收尾（2026-09-16）：育兒小筆記「另開 Threads」原本是 --warm-accent 描邊
  {
    file: "app/for-parents/page.module.css",
    className: "threadsLink",
  },
] as const;

const QUIET = [
  {
    file: "components/feedback/FeedbackForm.module.css",
    className: "mailtoButton",
  },
  {
    file: "components/universe/HotspotModal.module.css",
    className: "backBtn",
  },
  // K-12：.nextSoft（「或去玩 …」文字連結）已刪，次要去下一站改為 .sideBtn（soft）
  {
    file: "components/games/GameEndStation.module.css",
    className: "hubLink",
  },
] as const;

describe("CTA 三階（H1 第二刀 soft／quiet）", () => {
  it("globals 有 solid／soft／quiet token，且不改 --cta-warm 字面值", () => {
    const globals = readCss("app", "globals.css");
    expect(globals).toMatch(/--cta-solid-bg:\s*var\(--landing-brand-ink\)/);
    expect(globals).toMatch(/--cta-solid-fg:\s*var\(--on-dark\)/);
    expect(globals).toMatch(/--cta-soft-bg:\s*var\(--card\)/);
    expect(globals).toMatch(/--cta-soft-fg:\s*var\(--ink\)/);
    expect(globals).toMatch(
      /--cta-soft-line:\s*color-mix\(in srgb, var\(--ink\) 22%, transparent\)/,
    );
    expect(globals).toMatch(/--cta-quiet-fg:\s*var\(--accent-ink\)/);
    expect(globals).toMatch(/--cta-warm-from:\s*#ffe889/);
    expect(globals).toMatch(/--cta-warm-to:\s*#ffbd6f/);
    expect(globals).toMatch(/--cta-warm-fg:\s*#614018/);
  });

  it("次行動吃 soft：卡片底、深墨字、細線、elev-1，無玻璃／橘黃", () => {
    for (const { file, className } of SOFT) {
      const css = readCss(...file.split("/"));
      const block = paintRule(css, className);
      expect(block, file).toMatch(/background:\s*var\(--cta-soft-bg\)/);
      expect(block, file).toMatch(/color:\s*var\(--cta-soft-fg\)/);
      expect(block, file).toMatch(/border:[^;]*var\(--cta-soft-line\)/);
      expect(block, file).toMatch(/box-shadow:\s*var\(--elev-1\)/);
      expect(block, file).not.toMatch(/backdrop-filter/);
      expect(block, file).not.toMatch(/--cta-warm-from/);
      expect(block, file).not.toMatch(/--c-lilac/);
    }
  });

  it("三次／備援出口吃 quiet：透明底、底線、quiet 字色", () => {
    for (const { file, className } of QUIET) {
      const css = readCss(...file.split("/"));
      const block = paintRule(css, className);
      expect(block, file).toMatch(/background:\s*transparent/);
      expect(block, file).toMatch(/color:\s*var\(--cta-quiet-fg\)/);
      expect(block, file).toMatch(/text-decoration:\s*underline/);
      expect(block, file).toMatch(/min-height:\s*(44|48)px/);
    }

    const retry = readCss(
      "components",
      "for-parents",
      "ParentGate.module.css",
    );
    expect(retry).toMatch(/\.retry\s*\{[\s\S]*?color:\s*var\(--cta-quiet-fg\)/);
  });

  it("full sheet 次要出口維持 quiet 文字連結，不跟 compact 軟鈕同底板", () => {
    const css = readCss("components", "for-parents", "PlayMap.module.css");
    expect(css).toMatch(
      /\.sheetSecondaryActions \.placeLink[\s\S]*?background:\s*transparent/,
    );
    expect(css).toMatch(
      /\.sheetSecondaryActions \.placeLink[\s\S]*?color:\s*var\(--cta-quiet-fg\)/,
    );
  });

  it("不碰遊戲內 Chrome／方塊次鈕、也不把 404 主鈕改 soft", () => {
    const chrome = paintRule(
      readCss("components", "games", "GameChrome.module.css"),
      "secondaryBtn",
    );
    expect(chrome).toMatch(/background:\s*color-mix/);
    expect(chrome).not.toMatch(/--cta-soft-/);

    const notFoundPrimary = paintRule(
      readCss("app", "not-found.module.css"),
      "cta",
    );
    expect(notFoundPrimary).not.toMatch(/--cta-soft-/);
    expect(notFoundPrimary).toMatch(/background:\s*var\(--card\)/);
  });
});

describe("subscribeCta 去玻璃（H1 壓圖次鈕）", () => {
  it("不透明白底＋暖深墨字，無 backdrop-filter／text-shadow／rgba 玻璃", () => {
    const css = readCss("components", "landing", "LandingSegment.module.css");
    const block = paintRule(css, "subscribeCta");
    expect(block).toMatch(/background:\s*var\(--on-dark\)/);
    expect(block).toMatch(/color:\s*var\(--landing-brand-ink\)/);
    expect(block).toMatch(/min-height:\s*44px/);
    expect(block).toMatch(/font-size:\s*var\(--fs-control\)/);
    expect(block).toMatch(/box-shadow:\s*var\(--elev-1\)/);
    expect(block).toMatch(
      /border:\s*1px\s+solid\s+color-mix\(in srgb,\s*var\(--landing-brand-ink\)\s+22%/,
    );
    expect(block).not.toMatch(/backdrop-filter/);
    expect(block).not.toMatch(/-webkit-backdrop-filter/);
    expect(block).not.toMatch(/text-shadow/);
    expect(block).not.toMatch(/rgba\(/);
    expect(block).not.toMatch(/--cta-soft-/);
    expect(block).not.toMatch(/--cta-solid-/);
    expect(block).not.toMatch(/var\(--gloss\)/);
  });
});
