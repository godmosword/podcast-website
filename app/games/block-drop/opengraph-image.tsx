import {
  createGameOgImage,
  gameOgContentType,
  gameOgImageSize,
  GAME_OG_COLORS,
} from "@/lib/games/og";

export const alt = "繽紛方塊小遊戲";
export const size = gameOgImageSize;
export const contentType = gameOgContentType;

export default function Image() {
  return createGameOgImage({
    title: "繽紛方塊",
    emoji: "🧩",
    accentColor: GAME_OG_COLORS.pink,
  });
}
