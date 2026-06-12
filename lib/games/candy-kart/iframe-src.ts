import { candyKartTrackById } from "./tracks";

const CANDY_KART_EXPORT_PATH = "/candy-kart/index.html";

export function candyKartIframeSrc(debugFinish?: string): string {
  if (!debugFinish || !candyKartTrackById(debugFinish)) {
    return CANDY_KART_EXPORT_PATH;
  }
  const params = new URLSearchParams({ debugFinish });
  return `${CANDY_KART_EXPORT_PATH}?${params.toString()}`;
}
