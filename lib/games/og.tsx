import { ImageResponse } from "next/og";
import {
  loadOgFont,
  OG_FONT_FAMILY,
  ogFontOptions,
} from "@/lib/og-font";

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
  icon: GameOgIcon;
  accentColor?: string;
};

export type GameOgIcon = "play" | "race" | "puzzle";

/**
 * ImageResponse 會把 emoji 轉成遠端 SVG（預設來源是 jsDelivr）。
 * OG 圖在 build 時也會被 prerender，因此這裡只使用本地 CSS 圖示與 ASCII，
 * 避免產生任何外部網路依賴。
 */
function GameOgMark({ icon, accentColor }: { icon: GameOgIcon; accentColor: string }) {
  if (icon === "puzzle") {
    return (
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 40,
          background: accentColor,
          display: "flex",
          flexWrap: "wrap",
          alignContent: "center",
          justifyContent: "center",
          gap: 10,
          padding: 24,
          marginBottom: 28,
          boxShadow: "0 10px 0 rgba(52,48,43,0.16)",
        }}
      >
        {[
          "#fff7d6",
          "#ffffff",
          "#ffffff",
          "#fff7d6",
        ].map((color, index) => (
          <div
            key={index}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: color,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        width: 160,
        height: 160,
        borderRadius: 999,
        background: accentColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 28,
        boxShadow: "0 10px 0 rgba(52,48,43,0.16)",
        color: GAME_OG_COLORS.ink,
        fontSize: icon === "play" ? 88 : 58,
        fontWeight: 800,
        letterSpacing: icon === "play" ? 0 : 2,
      }}
    >
      {icon === "play" ? ">" : "GO"}
    </div>
  );
}

export async function createGameOgImage({
  title,
  icon,
  accentColor = GAME_OG_COLORS.yellow,
}: GameOgOptions) {
  const fontData = await loadOgFont();

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
          fontFamily: OG_FONT_FAMILY,
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
        <GameOgMark icon={icon} accentColor={accentColor} />
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
    { ...gameOgImageSize, fonts: ogFontOptions(fontData) },
  );
}
