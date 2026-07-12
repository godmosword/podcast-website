import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { Story } from "@/data/content";
import { getCharactersForStory } from "@/data/characters";
import {
  loadOgFont,
  OG_FONT_FAMILY,
  ogFontOptions,
} from "@/lib/og-font";
import { storyCoverPath } from "@/lib/story-utils";

export const storyOgImageSize = { width: 1200, height: 630 };
export const storyOgContentType = "image/png";

const INK = "#34302b";
const INK_SOFT = "#7a7268";
const BG = "#fffdf8";

async function loadCoverData(story: Story): Promise<string | null> {
  if (story.pageCount <= 0) return null;
  try {
    const rel = storyCoverPath(story.slug).replace(/^\//, "");
    const file = await readFile(join(process.cwd(), "public", rel));
    const mime = rel.endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

export { storyOgImagePath } from "@/lib/story-og-path";

type StoryOgOptions = {
  story: Story;
  coverSrc: string | null;
  fontFamily: string;
};

function buildStoryOgMarkup({
  story,
  coverSrc,
  fontFamily,
}: StoryOgOptions) {
  const characters = getCharactersForStory(story.slug)
    .slice(0, 3)
    .map((c) => c.name)
    .join(" · ");
  const accent = story.color;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily,
        background: `linear-gradient(145deg, ${BG} 0%, ${accent}22 55%, ${accent}11 100%)`,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "28px 48px 0",
          fontSize: 24,
          fontWeight: 700,
          color: INK_SOFT,
        }}
      >
        <span>車車遊樂園</span>
        <span>看圖聽故事</span>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 40,
          padding: "24px 48px 36px",
        }}
      >
        <div
          style={{
            width: 500,
            height: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 32,
            border: `12px solid ${accent}`,
            background: "#ffffff",
            boxShadow: `0 14px 0 ${accent}88, 0 24px 48px ${accent}33`,
            overflow: "hidden",
          }}
        >
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverSrc}
              alt=""
              width={476}
              height={476}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div style={{ fontSize: 160, lineHeight: 1 }}>{story.emoji}</div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 16,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "10px 28px",
              borderRadius: 999,
              background: accent,
              color: INK,
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1,
              boxShadow: `0 6px 0 ${accent}aa`,
            }}
          >
            EP {story.ep}
          </div>
          <div
            style={{
              fontSize: 46,
              fontWeight: 800,
              color: INK,
              lineHeight: 1.2,
              maxWidth: 560,
            }}
          >
            {story.title}
          </div>
          {characters ? (
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: INK_SOFT,
                lineHeight: 1.35,
              }}
            >
              {characters}
            </div>
          ) : null}
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: INK_SOFT,
              marginTop: 8,
            }}
          >
            {story.vehicle}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 16,
          background: accent,
        }}
      />
    </div>
  );
}

/** 故事分享卡：黏土相框 + EP 大字 + 角色列 + 品牌條。 */
export async function createStoryOgImage(story: Story) {
  const [fontData, coverSrc] = await Promise.all([
    loadOgFont(),
    loadCoverData(story),
  ]);

  return new ImageResponse(
    buildStoryOgMarkup({ story, coverSrc, fontFamily: OG_FONT_FAMILY }),
    {
      ...storyOgImageSize,
      fonts: ogFontOptions(fontData),
    },
  );
}
