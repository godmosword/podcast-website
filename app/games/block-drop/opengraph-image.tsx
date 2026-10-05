import {
  createGameOgImage,
  gameOgContentType,
  gameOgImageSize,
  GAME_OG_COLORS,
} from "@/lib/games/og";

export const alt = "方塊轉轉小遊戲";
export const size = gameOgImageSize;
export const contentType = gameOgContentType;

export default async function Image() {
  return createGameOgImage({
    title: "方塊轉轉",
    icon: "puzzle",
    accentColor: GAME_OG_COLORS.pink,
  });
}
