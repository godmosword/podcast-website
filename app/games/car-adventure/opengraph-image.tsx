import {
  createGameOgImage,
  gameOgContentType,
  gameOgImageSize,
  GAME_OG_COLORS,
} from "@/lib/games/og";

export const alt = "車車大冒險小遊戲";
export const size = gameOgImageSize;
export const contentType = gameOgContentType;

export default async function Image() {
  return createGameOgImage({
    title: "車車大冒險",
    icon: "race",
    accentColor: GAME_OG_COLORS.sky,
  });
}
