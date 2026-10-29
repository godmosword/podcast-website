/**
 * 小橘特快車生圖（`scripts/generate-orange-express-art.ts`）核准後要跟著改的地方，寫成純函式好測。
 *
 * - `data/games.ts`：封面與縮圖從暫代的 SVG 換成 cover.webp，替代文字換成新圖的描述。
 * - `lib/games/orange-express/art.ts`：`XIAOJU_STICKER_SRC` 從 null 換成貼紙路徑。
 * - `public/games/v2/orange-express/SOURCES.md`：一檔一列的來源表（格式比照多多壽司屋）。
 * - 封面裁切審稿：遊樂園卡片、標題主視覺各種框的比例。
 */

export const COVER_SVG = "/games/v2/orange-express/cover.svg";
export const COVER_WEBP = "/games/v2/orange-express/cover.webp";
export const STICKER_WEBP = "/games/v2/orange-express/xiaoju-sticker.webp";

const PLACEHOLDER_ALT = "奶油色圓臉、橘色條紋的小橘徽章";
/** 新封面的替代文字：照 prompt 寫，核准時人工看過圖再確認。 */
export const COVER_ALT = "小橘沿著山坡上的彎道開過來，左邊是月台，遠處有摩天輪";

const STICKER_NULL = "export const XIAOJU_STICKER_SRC: string | null = null;";
const STICKER_SET = `export const XIAOJU_STICKER_SRC: string | null = "${STICKER_WEBP}";`;

/** `data/games.ts` 的小橘特快車封面改指 cover.webp。已經換過就原樣回傳；兩樣都找不到就丟。 */
export function switchGamesCover(source: string): string {
  if (!source.includes(COVER_SVG)) {
    if (source.includes(COVER_WEBP)) return source;
    throw new Error(`data/games.ts 找不到 ${COVER_SVG}，沒辦法自動換封面`);
  }
  return source.split(COVER_SVG).join(COVER_WEBP).split(`alt: "${PLACEHOLDER_ALT}"`).join(`alt: "${COVER_ALT}"`);
}

/** `art.ts` 的貼紙路徑從 null 換成 xiaoju-sticker.webp。已經換過就原樣回傳；兩樣都找不到就丟。 */
export function switchStickerSrc(source: string): string {
  if (source.includes(STICKER_SET)) return source;
  if (!source.includes(STICKER_NULL)) throw new Error("art.ts 找不到 XIAOJU_STICKER_SRC = null，沒辦法自動換貼紙");
  return source.replace(STICKER_NULL, STICKER_SET);
}

export type SourceRow = {
  file: string;
  use: string;
  how: string;
  model: string;
  date: string;
  handling: string;
};

const HEADER = `# 小橘特快車圖檔來源

小遊戲「小橘特快車」（路徑 \`orange-express\`）。本表只登記這個目錄裡已經進儲存庫的圖，一檔一列。提示詞與 API 呼叫次數在 \`public/.games-staging/orange-express/<run-id>/manifest.json\`（不進儲存庫）。

生圖腳本：\`scripts/generate-orange-express-art.ts\`。張數與 prompt 在 \`docs/plans/2026-10-28-orange-express-art-batch2.md\` 最後一節確認過；每張每輪最多 1 次 API 呼叫，不自動重抽。

\`cover.svg\` 是程式畫的暫代封面，換上 cover.webp 後留著不刪（舊連結與備援）。

## 逐檔

| 檔名 | 用途 | 產生方式 | 模型 | 日期 | 人工處理 | 對應 PR |
|------|------|----------|------|------|----------|---------|
`;

/** 新增或更新 SOURCES.md 的列：同檔名的列換掉，其他列保留。對應 PR 先寫「待填」。 */
export function upsertSources(existing: string | null, rows: readonly SourceRow[]): string {
  const base = existing ?? HEADER;
  const lines = base.replace(/\n+$/, "").split("\n");
  for (const row of rows) {
    const line = `| \`${row.file}\` | ${row.use} | ${row.how} | ${row.model} | ${row.date} | ${row.handling} | 待填 |`;
    const index = lines.findIndex((l) => l.startsWith(`| \`${row.file}\` |`));
    if (index === -1) lines.push(line);
    else lines[index] = line;
  }
  return `${lines.join("\n")}\n`;
}

export type CoverCrop = {
  id: string;
  label: string;
  /** 寬 ÷ 高。 */
  aspect: number;
  /** 直向對齊（CSS object-position 的 y，0 頂、1 底）。 */
  y: number;
  /** 這個框右下角疊了什麼要避開（遊樂園卡片的播放圓鈕），以框寬的比例表示直徑。 */
  cornerBadge?: number;
};

/**
 * 封面會被裁進的框。比例取自實際畫面：遊樂園卡片約 4:3、右下角有播放圓鈕；
 * 標題主視覺直式手機全寬（390×844 約 358×186）、很矮的手機壓成 72px 高、往下對齊到 55%（笑臉才不會被切掉），橫拿與桌機是 3:2。
 */
export const COVER_CROPS: readonly CoverCrop[] = [
  { id: "hub", label: "遊樂園卡片", aspect: 4 / 3, y: 0.5, cornerBadge: 0.37 },
  { id: "title-phone", label: "標題・直式手機", aspect: 358 / 186, y: 0.45 },
  { id: "title-short", label: "標題・很矮的手機", aspect: 343 / 72, y: 0.55 },
  { id: "title-wide", label: "標題・橫拿與桌機", aspect: 3 / 2, y: 0.45 },
];

/** `object-fit: cover` 裁切時原圖留下的範圍（像素）；橫向置中，直向照 y 對齊（同 object-position）。 */
export function coverCrop(
  width: number,
  height: number,
  aspect: number,
  y = 0.5,
): { left: number; top: number; width: number; height: number } {
  if (width / height > aspect) {
    const w = Math.round(height * aspect);
    return { left: Math.round((width - w) / 2), top: 0, width: w, height };
  }
  const h = Math.round(width / aspect);
  return { left: 0, top: Math.round((height - h) * y), width, height: h };
}
