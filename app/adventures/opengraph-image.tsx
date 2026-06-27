import {
  createUniverseOgImage,
  universeOgContentType,
  universeOgImageSize,
} from "@/lib/universe/og";

export const alt = "車車宇宙 · 樂園地圖";
export const size = universeOgImageSize;
export const contentType = universeOgContentType;

export default function Image() {
  return createUniverseOgImage();
}
