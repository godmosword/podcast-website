import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import rawCharacters from "../data/characters.json";
import { getStories } from "../data/content";
import { getSiteUrl } from "../lib/site-url";
import { storyDefinitionSummary } from "../lib/story-geo";

type RawCharacter = {
  name: string;
  firstSeen?: string;
  alsoIn?: string[];
};

type BuildOptions = {
  siteUrl?: string;
  generatedAt?: string;
};

const LLMS_PATH = resolve(process.cwd(), "public/llms.txt");
const LLMS_FULL_PATH = resolve(process.cwd(), "public/llms-full.txt");

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

function readLlmsIntro(): string {
  const text = readFileSync(LLMS_PATH, "utf8");
  const marker = "\n## 主要路由地圖";
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error("public/llms.txt missing ## 主要路由地圖 marker");
  }
  return text.slice(0, markerIndex).trim();
}

function characterLine(character: RawCharacter, siteUrl: string): string {
  const appearances = [
    ...(character.firstSeen ? [character.firstSeen] : []),
    ...(character.alsoIn ?? []),
  ];
  const appearanceText =
    appearances.length > 0
      ? `首次或登場故事：${Array.from(new Set(appearances)).join("、")}`
      : "登場故事請見角色頁";
  return `- ${character.name}：原創 Q 版黏土車車角色，${appearanceText}。角色頁：${siteUrl}/characters`;
}

export function buildLlmsFullText(options: BuildOptions = {}): string {
  const siteUrl = normalizeSiteUrl(options.siteUrl ?? getSiteUrl());
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const stories = getStories();
  const characters = rawCharacters as RawCharacter[];

  const storySections = stories
    .map((story) => {
      const lines = [
        `### 第 ${story.ep} 集：${story.title}`,
        "",
        storyDefinitionSummary(story),
        "",
        `- 頁面 URL：${siteUrl}/story/${story.slug}`,
        ...(story.tags?.length ? [`- 主題標籤：${story.tags.join("、")}`] : []),
        ...(story.vehicle ? [`- 車種：${story.vehicle}`] : []),
        `- 發布日期：${story.date}`,
      ];
      return lines.join("\n");
    })
    .join("\n\n");

  const characterLines = characters
    .map((character) => characterLine(character, siteUrl))
    .join("\n");

  return [
    readLlmsIntro(),
    "",
    "## 全部故事索引",
    "",
    storySections,
    "",
    "## 角色索引",
    "",
    characterLines,
    "",
    "---",
    "",
    `產生時間戳：${generatedAt}`,
    "本檔由 build script 自動產生，請勿手動編輯。",
    "",
  ].join("\n");
}

export function writeLlmsFullFile(outputPath = LLMS_FULL_PATH): void {
  const text = buildLlmsFullText();
  const dir = dirname(outputPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(outputPath, text, "utf8");
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : "";

if (currentFile === invokedFile) {
  writeLlmsFullFile();
  console.log(`generated ${LLMS_FULL_PATH}`);
}
