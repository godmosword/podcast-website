import {
  createGameOgImage,
  gameOgContentType,
  gameOgImageSize,
  GAME_OG_COLORS,
} from "@/lib/games/og";

export const alt = "車車遊樂園小遊戲";
export const size = gameOgImageSize;
export const contentType = gameOgContentType;

export default async function Image() {
  return createGameOgImage({
    title: "車車遊樂園",
    emoji: "🎮",
    accentColor: GAME_OG_COLORS.mint,
  });
}
