import { ImageResponse } from "next/og";

/** 與 globals.css design token 同值，供 ImageResponse 內嵌使用。 */
export const GAME_OG_COLORS = {
  bg: "#ffffff",
  ink: "#34302b",
  inkSoft: "#7a7268",
  yellow: "#ffd866",
  mint: "#b7df9b",
  sky: "#8fcde8",
  pink: "#f7a8c4",
} as const;

export const gameOgImageSize = { width: 1200, height: 630 };
export const gameOgContentType = "image/png";

type GameOgOptions = {
  title: string;
  emoji: string;
  accentColor?: string;
};

export function createGameOgImage({
  title,
  emoji,
  accentColor = GAME_OG_COLORS.yellow,
}: GameOgOptions) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(180deg, ${GAME_OG_COLORS.bg} 0%, ${GAME_OG_COLORS.sky}33 100%)`,
          padding: 48,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 48,
            right: 48,
            height: 8,
            borderRadius: 999,
            background: accentColor,
            opacity: 0.85,
          }}
        />
        <div style={{ fontSize: 128, lineHeight: 1, marginBottom: 28 }}>
          {emoji}
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: GAME_OG_COLORS.ink,
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: 900,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: GAME_OG_COLORS.inkSoft,
            marginTop: 24,
          }}
        >
          車車故事屋
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 14,
            background: accentColor,
          }}
        />
      </div>
    ),
    { ...gameOgImageSize },
  );
}
