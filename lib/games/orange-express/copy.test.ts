import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COPY,
  GRADE_TEXT,
  GRADE_WORD,
  brakeLampLabel,
  brakeValueText,
  brakeWord,
  pointsResultText,
  powerLampLabel,
  powerValueText,
  powerWord,
} from "@/lib/games/orange-express/copy";
import { powerNotches } from "@/lib/games/orange-express/reducer";
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

describe("桿上的字", () => {
  it("兩根桿歸零都叫「鬆」：是狀態不是命令；「停」只留給煞車", () => {
    expect(powerWord(0)).toBe("鬆");
    expect(brakeWord(0)).toBe("鬆");
    expect(powerValueText(0)).toBe("動力 P0，鬆");
    for (const notch of [0, 1, 2, 3, 4] as const) {
      expect(powerWord(notch)).not.toBe("停");
    }
    expect(brakeWord(3)).toBe("停");
  });

  it("低齡桿面照格子的位置寫字、讀屏只說字，不寫 P／B 代碼", () => {
    for (const course of ["look", "little"] as const) {
      const notches = powerNotches(course);
      expect(notches.map((n) => powerLampLabel(n, notches))).toEqual(["鬆", "慢", "快"]);
      expect(notches.map((n) => powerValueText(n, notches))).toEqual(["動力，鬆", "動力，慢", "動力，快"]);
    }
    expect([0, 3, 5].map((n) => brakeLampLabel(n as 0 | 3 | 5, true))).toEqual(["鬆", "停", "緊急"]);
    expect(brakeValueText(3, true)).toBe("煞車，停");
    // 大司機、小站長照舊寫代碼。
    expect(powerLampLabel(3)).toBe("P3");
    expect(powerValueText(3)).toBe("動力 P3，快");
  });
});
