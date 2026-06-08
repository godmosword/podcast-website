import {
  createGameOgImage,
  gameOgContentType,
  gameOgImageSize,
  GAME_OG_COLORS,
} from "@/lib/games/og";

export const alt = "怪獸卡車的溫柔任務";
export const size = gameOgImageSize;
export const contentType = gameOgContentType;

export default function Image() {
  return createGameOgImage({
    title: "怪獸卡車的溫柔任務",
    emoji: "🚚",
    accentColor: GAME_OG_COLORS.pink,
  });
}
