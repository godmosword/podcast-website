import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COPY } from "@/lib/games/orange-express/copy";
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

function filesIn(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      out.push(...filesIn(path));
      continue;
    }
    if (name.endsWith(".test.ts") || name.endsWith(".test.tsx")) continue;
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
    const chunks = [Object.values(COPY).join("\n")];
    for (const root of roots) {
      for (const file of filesIn(root)) {
        if (!file.includes("orange-express") && !file.includes("OrangeExpress")) continue;
        chunks.push(readFileSync(file, "utf8"));
      }
    }
    const haystack = chunks.join("\n").toLowerCase();
    for (const word of BANNED) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = /[a-z0-9]/i.test(word)
        ? new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i")
        : new RegExp(escaped, "i");
      expect(haystack, word).not.toMatch(pattern);
    }
  });
});
