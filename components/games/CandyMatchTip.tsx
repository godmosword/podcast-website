"use client";

import type { ReactNode } from "react";
import { IconBroom, IconRainbow, IconTap } from "@/components/games/ClayIcons";
import type { CandyMatchTipId } from "@/lib/gamekit/progress/candy-match-prefs";
import styles from "./CandyMatchPlay.module.css";

const TIPS: Record<CandyMatchTipId, { icon: ReactNode; text: (selected: boolean) => string }> = {
  swap: {
    icon: <IconTap size={22} />,
    text: (selected) => (selected ? "② 再點旁邊的圖案，換位置湊三個！" : "① 先點一個圖案"),
  },
  row: { icon: <IconBroom size={22} />, text: () => "四個一樣 → 掃把糖：換一下就掃掉一整排！" },
  color: { icon: <IconRainbow size={22} />, text: () => "五個一樣 → 彩虹糖：換一下就收走同一種！" },
};

type CandyMatchTipProps = {
  tip: CandyMatchTipId;
  /** 交換引導：已選了第一格 */
  selected: boolean;
  onDismiss: () => void;
};

/** 首次引導：短、可略過，不擋棋盤操作。 */
export function CandyMatchTip({ tip, selected, onDismiss }: CandyMatchTipProps) {
  const info = TIPS[tip];
  return (
    <div className={styles.tip} role="status" data-tip={tip}>
      <span className={styles.tipIcon} aria-hidden>{info.icon}</span>
      <span className={styles.tipText}>{info.text(selected)}</span>
      <button type="button" className={styles.tipDismiss} onClick={onDismiss}>
        知道了
      </button>
    </div>
  );
}
