#!/usr/bin/env tsx
// ============================================================
// 車車遊樂園 — 每集劇情插圖生成 CLI
// ============================================================
// 由字幕切場景 → 生黏土風插圖到暫存 → 人工審 contact sheet → --approve 上線。
// 隱私：送出已公開的劇本文字（非音檔）。需 OPENAI_API_KEY（本機手動跑，CI 不放）。
//
// 用法：
//   npm run illustrate -- ep-9                 # 切場景→生圖→暫存→contact sheet（停在這審圖）
//   npm run illustrate -- ep-9 --segment-only  # 只產 data/scenes/ep-9.json（不生圖、可免 key 配 --deterministic）
//   npm run illustrate -- ep-9 --deterministic # 本機切場景（不呼叫文字模型）
//   npm run illustrate -- ep-9 --scene 4       # 重抽第 4 幕（暫存）
//   npm run illustrate -- ep-9 --approve       # 暫存→public + 寫 pageCount/captionTimes
// ============================================================

import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { getStory } from "../data/stories";
import { ROOT } from "./lib/transcribe-core";
import {
  approve,
  buildContactSheet,
  estimateDuration,
  generateSceneImage,
  publicDirForSlug,
  readScenesFile,
  readSubtitles,
  scenesSidecarPath,
  segmentByOpenAI,
  segmentDeterministic,
  stagingDirForSlug,
  writeScenesFile,
  writeStagingImage,
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

function refImagePath(slug: string): string {
  return join(publicDirForSlug(slug), "01.jpg");
}

async function segment(slug: string, deterministic: boolean): Promise<Scene[]> {
  const subs = readSubtitles(slug);
  const duration = estimateDuration(subs);
  const scenes = deterministic
    ? segmentDeterministic(subs, duration)
    : await segmentByOpenAI(subs, duration, metaForSlug(slug));
  writeScenesFile({
    slug,
    audioDuration: duration,
    model: deterministic ? "deterministic" : (process.env.OPENAI_TEXT_MODEL ?? "gpt-4o"),
    generatedAt: new Date().toISOString(),
    scenes,
  });
  console.log(`✓ ${slug}：切出 ${scenes.length} 幕 → ${rel(scenesSidecarPath(slug))}`);
  return scenes;
}

async function generateAll(slug: string, scenes: Scene[]): Promise<void> {
  const ref = refImagePath(slug);
  if (!existsSync(ref)) {
    console.warn(`⚠ 找不到參考圖 ${rel(ref)}；改用純 prompt 生圖（風格較易飄）。`);
  }
  for (const sc of scenes) {
    process.stderr.write(`  生圖 #${sc.index}/${scenes.length}…`);
    const buf = await generateSceneImage(sc, ref);
    const p = writeStagingImage(slug, sc.index, buf);
    process.stderr.write(` → ${rel(p)}\n`);
  }
  const sheet = buildContactSheet(slug, scenes);
  console.log(`\n✓ ${slug}：${scenes.length} 幕已生到暫存。`);
  console.log(`  審圖：open ${rel(sheet)}`);
  console.log(`  壞幕重抽：npm run illustrate -- ${slug} --scene N`);
  console.log(`  全部 OK：npm run illustrate -- ${slug} --approve`);
}

async function regenScene(slug: string, sceneNo: number): Promise<void> {
  const { scenes } = readScenesFile(slug);
  const sc = scenes.find((s) => s.index === sceneNo);
  if (!sc) fail(`場景檔沒有第 ${sceneNo} 幕（共 ${scenes.length} 幕）`);
  const buf = await generateSceneImage(sc!, refImagePath(slug));
  const p = writeStagingImage(slug, sc!.index, buf);
  buildContactSheet(slug, scenes);
  console.log(`✓ ${slug}：重抽第 ${sceneNo} 幕 → ${rel(p)}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const slugs = args.filter((a) => !a.startsWith("--"));
  const segmentOnly = args.includes("--segment-only");
  const deterministic = args.includes("--deterministic");
  const doApprove = args.includes("--approve");
  const sceneFlagIdx = args.indexOf("--scene");
  const sceneNo = sceneFlagIdx >= 0 ? Number(args[sceneFlagIdx + 1]) : null;

  if (slugs.length === 0) {
    fail("用法：npm run illustrate -- <slug> [--segment-only|--deterministic|--scene N|--approve]");
  }

  for (const slug of slugs) {
    try {
      if (doApprove) {
        const r = approve(slug);
        console.log(`✓ ${slug}：${r.copied} 張進 ${rel(r.publicDir)}`);
        if (r.wiredVia === "overrides") {
          console.log(`  已寫 overrides.${slug}（pageCount + captionTimes）。`);
          console.log(`  下一步：npm run sync:apple && npm run build`);
        }
        continue;
      }
      if (sceneNo != null && Number.isFinite(sceneNo)) {
        await regenScene(slug, sceneNo);
        continue;
      }
      const scenes = await segment(slug, deterministic);
      if (segmentOnly) {
        console.log(`  （--segment-only）審切分後再跑 npm run illustrate -- ${slug} 生圖。`);
        continue;
      }
      await generateAll(slug, scenes);
    } catch (err) {
      fail(`${slug}：${(err as Error).message}`);
    }
  }
}

void main();
