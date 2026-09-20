import {
  createGameOgImage,
  gameOgContentType,
  gameOgImageSize,
  GAME_OG_COLORS,
} from "@/lib/games/og";

export const alt = "繽紛樂園小遊戲";
export const size = gameOgImageSize;
export const contentType = gameOgContentType;

export default async function Image() {
  return createGameOgImage({
    title: "繽紛樂園",
    icon: "puzzle",
    accentColor: GAME_OG_COLORS.pink,
  });
}
