import type { GameType } from "@/data/games";
import { IconBlockFall, IconCrayon, IconSwap } from "./ClayIcons";

/**
 * 兒童減法審（2026-09-20）：不識字的孩子靠「玩法圖示」認站——
 * 蠟筆＝塗、兩格交換＝找一樣、方塊落下＝排一排。遊樂園卡片與親子進度共用。
 */
export function GamePlayIcon({ gameType, size }: { gameType: GameType; size: number }) {
  switch (gameType) {
    case "coloring":
      return <IconCrayon size={size} />;
    case "match":
      return <IconSwap size={size} />;
    case "blocks":
      return <IconBlockFall size={size} />;
  }
}
