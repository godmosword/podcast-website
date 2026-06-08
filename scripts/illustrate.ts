#!/usr/bin/env tsx
// ============================================================
// 車車遊樂園 — 每集劇情插圖生成 CLI
// ============================================================
// 字幕切場景（含角色辨識）→ 新角色生定裝照 → 每幕帶角色定裝照生黏土風插圖
// → 暫存 + contact sheet 人工審 → --approve 進 public + 登記角色名冊。
// 隱私：送出已公開的劇本文字（非音檔）。需 OPENAI_API_KEY（本機手動，CI 不放）。
//
// 用法：
//   npm run illustrate -- ep-9                 # 切場景→生定裝照+生圖→暫存→contact sheet（停在這審）
//   npm run illustrate -- ep-9 --segment-only  # 只產 data/scenes/ep-9.json（不生圖）
//   npm run illustrate -- ep-9 --deterministic # 本機切場景（不呼叫文字模型、無角色辨識）
//   npm run illustrate -- ep-9 --scene 4       # 重抽第 4 幕
//   npm run illustrate -- ep-9 --char 多多      # 重抽某新角色定裝照
//   npm run illustrate -- ep-9 --approve       # 暫存→public + 登記角色 + 寫 pageCount/captionTimes
// ============================================================

import { existsSync } from "node:fs";
import { relative } from "node:path";
import { getStory } from "../data/stories";
import { ROOT } from "./lib/transcribe-core";
import {
  approve,
  buildContactSheet,
  estimateDuration,
  generateCharacterPortrait,
  generateSceneImage,
  readCharacters,
  readScenesFile,
  readSubtitles,
  resolveSceneRefs,
  scenesSidecarPath,
  segmentByOpenAI,
  segmentDeterministic,
  stagingPortraitPath,
  writeScenesFile,
  writeStagingImage,
  writeStagingPortrait,
  type NewCharacter,
  type Scene,
  type StoryMeta,
} from "./lib/illustrate-core";

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
function rel(p: string): string {
  return relative(ROOT, p);
}
function metaForSlug(slug: string): StoryMeta {
  const story = getStory(slug);
  return { title: story?.title, vehicle: story?.vehicle };
}

/** 名稱 → 外觀描述（名冊既有 + 本集新角色）。 */
function descMap(newCharacters: NewCharacter[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const c of readCharacters()) m.set(c.name, c.desc);
  for (const c of newCharacters) m.set(c.name, c.desc);
  return m;
}

async function segment(
  slug: string,
  deterministic: boolean,
): Promise<{ scenes: Scene[]; newCharacters: NewCharacter[] }> {
  const subs = readSubtitles(slug);
  const duration = estimateDuration(subs);
  const out = deterministic
    ? segmentDeterministic(subs, duration)
    : await segmentByOpenAI(subs, duration, metaForSlug(slug));
  writeScenesFile({
    slug,
    audioDuration: duration,
    model: deterministic ? "deterministic" : (process.env.OPENAI_TEXT_MODEL ?? "gpt-4o"),
    generatedAt: new Date().toISOString(),
    scenes: out.scenes,
    newCharacters: out.newCharacters,
  });
  const charNote = out.newCharacters.length
    ? `，新角色 ${out.newCharacters.map((c) => c.name).join("、")}`
    : "";
  console.log(
    `✓ ${slug}：切出 ${out.scenes.length} 幕${charNote} → ${rel(scenesSidecarPath(slug))}`,
  );
  return out;
}

/** 為本集新角色生定裝照（已有暫存或已登記者跳過）。 */
async function ensurePortraits(slug: string, newCharacters: NewCharacter[]): Promise<void> {
  const registered = new Set(readCharacters().map((c) => c.name));
  for (const nc of newCharacters) {
    if (registered.has(nc.name)) continue; // 已有 canonical 定裝照
    if (existsSync(stagingPortraitPath(slug, nc.name))) continue;
    process.stderr.write(`  定裝照 ${nc.name}…`);
    const buf = await generateCharacterPortrait(nc);
    const p = writeStagingPortrait(slug, nc.name, buf);
    process.stderr.write(` → ${rel(p)}\n`);
  }
}

async function generateAll(
  slug: string,
  scenes: Scene[],
  newCharacters: NewCharacter[],
): Promise<void> {
  await ensurePortraits(slug, newCharacters);
  const descs = descMap(newCharacters);
  for (const sc of scenes) {
    const { paths, descs: cdescs } = resolveSceneRefs(slug, sc, descs);
    process.stderr.write(`  生圖 #${sc.index}/${scenes.length}（${sc.characters.join("、") || "封面參考"}）…`);
    const buf = await generateSceneImage(sc, paths, cdescs);
    const p = writeStagingImage(slug, sc.index, buf);
    process.stderr.write(` → ${rel(p)}\n`);
  }
  const sheet = buildContactSheet(slug, scenes, newCharacters);
  console.log(`\n✓ ${slug}：${scenes.length} 幕已生到暫存。`);
  console.log(`  審圖：open ${rel(sheet)}`);
  console.log(`  壞幕重抽：npm run illustrate -- ${slug} --scene N`);
  if (newCharacters.length) {
    console.log(`  角色定裝照重抽：npm run illustrate -- ${slug} --char 名字`);
  }
  console.log(`  全部 OK：npm run illustrate -- ${slug} --approve`);
}

async function regenScene(slug: string, sceneNo: number): Promise<void> {
  const file = readScenesFile(slug);
  file.newCharacters ??= [];
  const sc = file.scenes.find((s) => s.index === sceneNo);
  if (!sc) fail(`場景檔沒有第 ${sceneNo} 幕（共 ${file.scenes.length} 幕）`);
  const { paths, descs } = resolveSceneRefs(slug, sc!, descMap(file.newCharacters));
  const buf = await generateSceneImage(sc!, paths, descs);
  const p = writeStagingImage(slug, sc!.index, buf);
  buildContactSheet(slug, file.scenes, file.newCharacters);
  console.log(`✓ ${slug}：重抽第 ${sceneNo} 幕 → ${rel(p)}`);
}

async function regenChar(slug: string, name: string): Promise<void> {
  const file = readScenesFile(slug);
  file.newCharacters ??= [];
  const nc = file.newCharacters.find((c) => c.name === name);
  if (!nc) fail(`場景檔的新角色沒有「${name}」（有：${file.newCharacters.map((c) => c.name).join("、") || "無"}）`);
  const buf = await generateCharacterPortrait(nc!);
  const p = writeStagingPortrait(slug, name, buf);
  buildContactSheet(slug, file.scenes, file.newCharacters);
  console.log(`✓ ${slug}：重抽定裝照「${name}」→ ${rel(p)}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const slugs = args.filter((a) => !a.startsWith("--"));
  const segmentOnly = args.includes("--segment-only");
  const deterministic = args.includes("--deterministic");
  const doApprove = args.includes("--approve");
  const sceneIdx = args.indexOf("--scene");
  const sceneNo = sceneIdx >= 0 ? Number(args[sceneIdx + 1]) : null;
  const charIdx = args.indexOf("--char");
  const charName = charIdx >= 0 ? args[charIdx + 1] : null;

  // --scene N / --char 名 的值會被當成 slug，需排除
  const realSlugs = slugs.filter(
    (s) => s !== String(sceneNo) && s !== charName,
  );
  if (realSlugs.length === 0) {
    fail("用法：npm run illustrate -- <slug> [--segment-only|--deterministic|--scene N|--char 名|--approve]");
  }

  for (const slug of realSlugs) {
    try {
      if (doApprove) {
        const r = approve(slug);
        console.log(`✓ ${slug}：${r.copied} 張進 ${rel(r.publicDir)}`);
        if (r.registered.length) console.log(`  登記新角色：${r.registered.join("、")}`);
        if (r.wiredVia === "overrides") {
          console.log(`  已寫 overrides.${slug}（pageCount + captionTimes）。`);
          console.log(`  下一步：npm run build（或 npm run sync:apple && npm run build）`);
        }
        continue;
      }
      if (charName != null) {
        await regenChar(slug, charName);
        continue;
      }
      if (sceneNo != null && Number.isFinite(sceneNo)) {
        await regenScene(slug, sceneNo);
        continue;
      }
      const out = await segment(slug, deterministic);
      if (segmentOnly) {
        console.log(`  （--segment-only）審切分後再跑 npm run illustrate -- ${slug} 生圖。`);
        continue;
      }
      await generateAll(slug, out.scenes, out.newCharacters);
    } catch (err) {
      fail(`${slug}：${(err as Error).message}`);
    }
  }
}

void main();
