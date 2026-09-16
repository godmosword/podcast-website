import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 美術審 H1 第一刀：唯一主鈕底／字色對齊 Landing／留言牆。
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
  {
    file: "components/games/GameEndStation.module.css",
    className: "nextBtn",
  },
] as const;

describe("主鈕最小 alignment（H1 第一刀）", () => {
  it("七處唯一主鈕是暖深墨底＋白字，不再用橘黃漸層當底板", () => {
    for (const { file, className } of PRIMARY) {
      const css = readCss(...file.split("/"));
      const block = paintRule(css, className);
      expect(block, file).toMatch(/background:\s*var\(--landing-brand-ink\)/);
      expect(block, file).toMatch(/color:\s*var\(--on-dark\)/);
      expect(block, file).not.toMatch(/--cta-warm-from/);
      expect(block, file).not.toMatch(/background:\s*linear-gradient/);
    }
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

  it("遊戲「再玩一次」仍是次行動，不跟下一關同色", () => {
    const replay = paintRule(
      readCss("components", "games", "GameEndStation.module.css"),
      "replayBtn",
    );
    expect(replay).toMatch(/--c-lilac/);
    expect(replay).not.toMatch(/--landing-brand-ink/);
  });
});
