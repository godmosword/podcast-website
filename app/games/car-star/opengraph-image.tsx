import {
  createGameOgImage,
  gameOgContentType,
  gameOgImageSize,
  GAME_OG_COLORS,
} from "@/lib/games/og";

export const alt = "車車吃星星小遊戲";
export const size = gameOgImageSize;
export const contentType = gameOgContentType;

export default function Image() {
  return createGameOgImage({
    title: "車車吃星星",
    emoji: "🚗",
    accentColor: GAME_OG_COLORS.yellow,
  });
}
