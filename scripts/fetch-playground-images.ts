/**
 * 自維基共享資源為親子遊樂地圖景點抓取可驗證授權實景圖。
 * 支援續跑（已有 webp＋sidecar 則跳過）、429 退避。
 *
 * 用法：npx tsx scripts/fetch-playground-images.ts
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { listPlaygrounds } from "../data/playgrounds";
import type { PlaygroundImageMeta } from "../data/playground-images";

const OUT_DIR = path.join(process.cwd(), "public", "play-map");
const SIDECAR = path.join(process.cwd(), "data", "playground-images.ts");
const UA =
  "ChechePlayMapBot/1.0 (podcast-website play-map; CC mirror; contact via GitHub godmosword/podcast-website)";

const ALLOWED_LICENSES = [
  "cc0",
  "public domain",
  "pd",
  "cc-by-4.0",
  "cc-by-3.0",
  "cc-by-2.0",
  "cc-by-sa-4.0",
  "cc-by-sa-3.0",
  "cc-by-sa-2.0",
  "cc by 4.0",
  "cc by 3.0",
  "cc by-sa 4.0",
  "cc by-sa 3.0",
];

/** 手動指定較準的 Commons 檔名（不含 File: 前綴）。 */
const MANUAL_FILES: Record<string, string> = {
  "tp-zoo": "Taipei Zoo Entrance.jpg",
  "tp-children-park": "Children's Amusement Park, Taipei 20070317.jpg",
  "tp-da-an-park": "Daan Forest Park 20090801.jpg",
  "tp-ntsec": "National Taiwan Science Education Center 20090822.jpg",
  "tp-water-museum": "Taipei Water Park entrance 20160101.jpg",
  "nt-sanchong-floodway": "Freeway 1 over Erchong Floodway 20070428.jpg",
  "nt-435": "Playground of Banqiao 435 Art Zone 20250902.jpg",
  "hc-18peak": "Eighteen Peaks Mountain Ghie Show Pavilion.jpg",
  "hc-nanliao": "Nanliao Fishing Harbor 南寮漁港 - panoramio.jpg",
  "hcx-emei-lake": "2023 Dapu Reservoir s3.jpg",
  "hcx-neiwan": "內灣戲院 Neiwan Theater - panoramio.jpg",
  "tc-nmns": "National Museum of Natural Science 2007.jpg",
  "nto-nine": "Formosan Aboriginal Culture Village 01.jpg",
  "nto-paper-dome": "紙教堂 Paper Dome - panoramio.jpg",
  "hcx-leofoo": "Leofoo Village Theme Park 2007.jpg",
  "yl-beigang-park": "Beigang Matsu Landscape Park-04.2024-09-18.jpg",
};

type CommonsHit = { title: string };
type ImageInfo = {
  url: string;
  width: number;
  height: number;
  descriptionurl: string;
  extmetadata?: Record<string, { value?: string }>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function licenseOk(raw: string | undefined): boolean {
  if (!raw) return false;
  const normalized = stripHtml(raw).toLowerCase();
  return ALLOWED_LICENSES.some((token) => normalized.includes(token));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadExistingSidecar(): Promise<
  Record<string, PlaygroundImageMeta>
> {
  try {
    const mod = await import("../data/playground-images");
    return { ...mod.PLAYGROUND_IMAGES };
  } catch {
    return {};
  }
}

async function commonsJson(url: string): Promise<unknown> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (response.status === 429) {
      const wait = 8_000 * (attempt + 1);
      console.warn(`429 → wait ${wait}ms`);
      await sleep(wait);
      continue;
    }
    if (!response.ok) {
      throw new Error(`Commons HTTP ${response.status}`);
    }
    return response.json();
  }
  throw new Error("Commons HTTP 429 (retries exhausted)");
}

async function searchFiles(query: string): Promise<CommonsHit[]> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srnamespace: "6",
    srlimit: "5",
    format: "json",
  });
  const data = (await commonsJson(
    `https://commons.wikimedia.org/w/api.php?${params}`,
  )) as { query?: { search?: CommonsHit[] } };
  return data.query?.search ?? [];
}

async function getImageInfo(title: string): Promise<ImageInfo | null> {
  const params = new URLSearchParams({
    action: "query",
    titles: title.startsWith("File:") ? title : `File:${title}`,
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    format: "json",
  });
  const data = (await commonsJson(
    `https://commons.wikimedia.org/w/api.php?${params}`,
  )) as {
    query?: { pages?: Record<string, { imageinfo?: ImageInfo[] }> };
  };
  const page = Object.values(data.query?.pages ?? {})[0];
  return page?.imageinfo?.[0] ?? null;
}

async function pickFile(
  id: string,
  name: string,
  city: string,
): Promise<{ title: string; info: ImageInfo } | null> {
  const manual = MANUAL_FILES[id];
  if (manual) {
    const info = await getImageInfo(manual);
    await sleep(1_200);
    if (info && info.width >= 640) return { title: `File:${manual}`, info };
  }

  const queries = [name, `${name} ${city}`, `${name} Taiwan`];
  for (const query of queries) {
    const hits = await searchFiles(query);
    await sleep(1_200);
    for (const hit of hits.slice(0, 4)) {
      if (/\.(svg|gif|pdf|webm|ogv)$/i.test(hit.title)) continue;
      const info = await getImageInfo(hit.title);
      await sleep(1_200);
      if (!info || info.width < 640) continue;
      const license =
        info.extmetadata?.LicenseShortName?.value ??
        info.extmetadata?.License?.value;
      if (!licenseOk(license) && !manual) continue;
      const desc = stripHtml(
        info.extmetadata?.ImageDescription?.value ?? "",
      ).toLowerCase();
      if (desc.includes("logo") || desc.includes("icon")) continue;
      return { title: hit.title, info };
    }
  }
  return null;
}

async function downloadWebp(url: string, dest: string): Promise<void> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": UA } });
    if (response.status === 429) {
      const wait = 10_000 * (attempt + 1);
      console.warn(`download 429 → wait ${wait}ms`);
      await sleep(wait);
      continue;
    }
    if (!response.ok) throw new Error(`download ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({
        width: 1200,
        height: 900,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 78 })
      .toFile(dest);
    return;
  }
  throw new Error("download 429 (retries exhausted)");
}

function sidecarSource(
  entries: Record<string, PlaygroundImageMeta>,
): string {
  const body = Object.entries(entries)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([id, meta]) =>
        `  ${JSON.stringify(id)}: {\n    src: ${JSON.stringify(meta.src)},\n    alt: ${JSON.stringify(meta.alt)},\n    credit: ${JSON.stringify(meta.credit)},\n  }`,
    )
    .join(",\n");

  return `/**
 * 親子遊樂地圖景點圖片 sidecar（由 scripts/fetch-playground-images.ts 產生／維護）。
 * 合併進 listPlaygrounds()／getPlayground()；勿手改 webp 檔名與 id 脫鉤。
 */
export type PlaygroundImageMeta = {
  src: string;
  alt: string;
  credit: string;
};

/** id → 圖片 meta；缺席＝該景點無圖。 */
export const PLAYGROUND_IMAGES: Readonly<
  Record<string, PlaygroundImageMeta>
> = {
${body}
};
`;
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  const places = listPlaygrounds();
  const entries = await loadExistingSidecar();
  const missing: string[] = [];

  for (const place of places) {
    const dest = path.join(OUT_DIR, `${place.id}.webp`);
    if (entries[place.id] && (await fileExists(dest))) {
      console.log(`skip ${place.id}`);
      continue;
    }
    process.stdout.write(`… ${place.id} ${place.name}\n`);
    try {
      const picked = await pickFile(place.id, place.name, place.city);
      if (!picked) {
        missing.push(`${place.id}\t${place.name}\tno-match`);
        continue;
      }
      const cleanUrl = picked.info.url.split("?")[0] ?? picked.info.url;
      await downloadWebp(cleanUrl, dest);
      const artist = stripHtml(
        picked.info.extmetadata?.Artist?.value ?? "未知作者",
      );
      const license = stripHtml(
        picked.info.extmetadata?.LicenseShortName?.value ??
          picked.info.extmetadata?.License?.value ??
          "見來源頁",
      );
      entries[place.id] = {
        src: `/play-map/${place.id}.webp`,
        alt: `${place.name}實景`,
        credit: `${artist}／${license}／${picked.info.descriptionurl}`,
      };
      // 每成功一筆就寫 sidecar，避免中斷全丟
      await writeFile(SIDECAR, sidecarSource(entries), "utf8");
      await sleep(1_500);
    } catch (error) {
      missing.push(
        `${place.id}\t${place.name}\tERROR ${error instanceof Error ? error.message : String(error)}`,
      );
      await sleep(3_000);
    }
  }

  await writeFile(SIDECAR, sidecarSource(entries), "utf8");
  await writeFile(
    path.join(process.cwd(), "data", "playground-images-missing.tsv"),
    ["id\tname\tnote", ...missing].join("\n") + "\n",
    "utf8",
  );
  console.log(
    `\n完成：${Object.keys(entries).length}/${places.length} 有圖；本輪缺／錯 ${missing.length}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
