import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COPY, GRADE_TEXT, GRADE_WORD, pointsResultText } from "@/lib/games/orange-express/copy";
import { stationsFor } from "@/lib/games/orange-express/routes";

const BANNED = [
  "新幹線",
  "shinkansen",
  "のぞみ",
  "nozomi",
  "hikari",
  "kodama",
  "hayabusa",
  "n700",
  "東海道",
  "北陸",
  "白山",
  "jr",
  "台灣高鐵",
  "臺灣高鐵",
  "thsr",
  "atc",
  "km/h",
  "320",
];

/** 家長在遊戲設定打開數字刻度時才畫出來的單位，只准出現在速度表的常數檔。 */
const PARENT_ONLY: Record<string, string> = {
  "km/h": "lib/games/orange-express/gauge.ts",
};

/** 點陣圖與音檔是二進位，當文字讀會隨機湊出「jr」這種短詞；SVG 與 SOURCES.md 照樣掃。 */
const BINARY_ASSET = /\.(webp|png|jpe?g|avif|gif|m4a|mp3)$/i;

function filesIn(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      out.push(...filesIn(path));
      continue;
    }
    if (name.endsWith(".test.ts") || name.endsWith(".test.tsx")) continue;
    if (BINARY_ASSET.test(name)) continue;
    out.push(path);
  }
  return out;
}

describe("小橘特快車文案", () => {
  it("站名過禁詞", () => {
    const names = ["look", "drive", "captain"]
      .flatMap((level) => stationsFor(level as "look").map((station) => `${station.id} ${station.name}`))
      .join("\n");
    for (const word of BANNED) {
      expect(names.toLowerCase()).not.toContain(word);
    }
  });

  it("畫面上的句子與遊戲原始碼沒有禁詞", () => {
    const roots = [
      join(import.meta.dirname),
      join(import.meta.dirname, "../../../components/games"),
      join(import.meta.dirname, "../../../app/games/orange-express"),
      join(import.meta.dirname, "../../../public/games/v2/orange-express"),
    ];
    const files: { path: string; text: string }[] = [{ path: "COPY", text: Object.values(COPY).join("\n") }];
    for (const root of roots) {
      for (const file of filesIn(root)) {
        if (!file.includes("orange-express") && !file.includes("OrangeExpress")) continue;
        files.push({ path: file, text: readFileSync(file, "utf8") });
      }
    }
    for (const word of BANNED) {
      const allowed = PARENT_ONLY[word];
      const haystack = files
        .filter((file) => !allowed || !file.path.endsWith(allowed))
        .map((file) => file.text)
        .join("\n")
        .toLowerCase();
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = /[a-z0-9]/i.test(word)
        ? new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i")
        : new RegExp(escaped, "i");
      expect(haystack, word).not.toMatch(pattern);
    }
  });
});

describe("每站停車等級與結算小字", () => {
  it("等級只說停在哪一區，不說幾顆星；黃區也算停好了", () => {
    for (const text of [...Object.values(GRADE_TEXT), ...Object.values(GRADE_WORD)]) {
      expect(text).not.toMatch(/星|★/);
    }
    expect(GRADE_WORD).toEqual({ green: "剛剛好", yellow: "停到了" });
    expect(GRADE_TEXT.yellow).not.toContain("差一點");
  });

  it("指差確認只數做到的次數", () => {
    expect(pointsResultText(1)).toBe("指差確認 1 次");
  });
});
