#!/usr/bin/env tsx
/**
 * 為名冊角色生定裝照 → public/characters/<name>.jpg
 *
 * 用法：
 *   npm run illustrate --env-file-if-exists=.env.local -- tsx scripts/generate-character-portraits.ts 消防車圈圈 消防車點點
 *   npx tsx --env-file-if-exists=.env.local scripts/generate-character-portraits.ts --all-missing
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CLAY_NEGATIVE,
  CLAY_STYLE_PREFIX,
  characterRefFsPath,
  generateCharacterPortrait,
  getImageModel,
  readCharacters,
  type Character,
} from "./lib/illustrate-core";
import { ROOT } from "./lib/transcribe-core";

async function portraitFromCoverRef(
  char: Character,
  coverPath: string,
): Promise<Buffer> {
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();
  const isolateHint = char.name.includes("圈圈")
    ? "isolate the red twin fire engine labeled 「圈圈」 on its cab"
    : char.name.includes("點點")
      ? "isolate the red twin fire engine labeled 「點點」 on its cab"
      : char.name === "水泥車阿尼"
        ? "isolate the yellow cement mixer truck with the blue-and-white spiral mixing drum"
        : char.name === "自動駕駛計程車知知"
          ? "isolate the white modern autonomous robotaxi with neon-blue LED eyes and the white roof LiDAR sensor pod — NOT any yellow checker taxi"
          : `isolate the main character 「${char.name}」`;
  const prompt =
    `${CLAY_STYLE_PREFIX}Character model sheet based on the reference image: ${isolateHint}. ` +
    `${char.desc} ` +
    `Single character only, centered, front three-quarter view, full body, neutral happy pose, plain soft off-white background. ` +
    `Match exact clay style, colors, face and proportions from the reference. ${CLAY_NEGATIVE}`;

  const file = await toFile(readFileSync(coverPath), "cover.jpg", {
    type: "image/jpeg",
  });
  const res = await client.images.edit({
    model: getImageModel(),
    image: file,
    prompt,
    size: "1024x1024",
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error(`圖像模型未回傳影像（${char.name}）`);
  const sharp = (await import("sharp")).default;
  return sharp(Buffer.from(b64, "base64"))
    .resize(1400, 1400, { fit: "cover" })
    .jpeg({ quality: 88 })
    .toBuffer();
}

async function generateOne(char: Character, coverRef?: string): Promise<string> {
  const dest = characterRefFsPath(char.name);
  process.stderr.write(`  定裝照 ${char.name}…`);
  const buf =
    coverRef && existsSync(coverRef)
      ? await portraitFromCoverRef(char, coverRef)
      : await generateCharacterPortrait({
          name: char.name,
          aliases: char.aliases,
          vehicle: char.vehicle,
          desc: char.desc,
        });
  writeFileSync(dest, buf);
  process.stderr.write(` → ${dest.replace(ROOT + "/", "")}\n`);
  return dest;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const allMissing = args.includes("--all-missing");
  const names = args.filter((a) => !a.startsWith("--"));
  const roster = readCharacters();
  const byName = new Map(roster.map((c) => [c.name, c]));

  let targets: Character[];
  if (allMissing) {
    targets = roster.filter((c) => !existsSync(characterRefFsPath(c.name)));
  } else if (names.length === 0) {
    console.error("用法：tsx scripts/generate-character-portraits.ts <角色名…> | --all-missing");
    process.exit(1);
  } else {
    targets = names.map((n) => {
      const c = byName.get(n);
      if (!c) throw new Error(`名冊找不到角色「${n}」`);
      return c;
    });
  }

  const ep14Cover = join(ROOT, "public", "stories", "ep-14", "01.jpg");
  const ep20Cover = join(ROOT, "public", "stories", "ep-20", "01.jpg");
  const ep21Cover = join(ROOT, "public", "stories", "ep-21", "01.jpg");
  for (const char of targets) {
    let cover: string | undefined;
    if (
      char.firstSeen === "ep-14" &&
      char.vehicle === "fire engine" &&
      existsSync(ep14Cover)
    ) {
      cover = ep14Cover;
    } else if (char.name === "水泥車阿尼" && existsSync(ep20Cover)) {
      cover = ep20Cover;
    } else if (char.name === "自動駕駛計程車知知" && existsSync(ep21Cover)) {
      cover = ep21Cover;
    }
    await generateOne(char, cover);
  }

  // 同步 ref 路徑
  const updated = roster.map((c) => {
    if (!targets.some((t) => t.name === c.name)) return c;
    const safe = c.name.replace(/[^\p{L}\p{N}_-]/gu, "").slice(0, 40);
    return { ...c, ref: `characters/${safe}.jpg` };
  });
  writeFileSync(
    join(ROOT, "data", "characters.json"),
    `${JSON.stringify(updated, null, 2)}\n`,
  );
  console.log(`✓ 完成 ${targets.length} 張定裝照`);
}

void main().catch((err) => {
  console.error(`✗ ${(err as Error).message}`);
  process.exit(1);
});
