"use client";

import { IconStar } from "@/components/games/ClayIcons";
import { PictureStackIcon } from "./ColoringToolbarIcons";
import type { LeaveTarget } from "./useColoringLeave";
import { ClearIcon, CrayonIcon } from "./ColoringToolbarIcons";
import {
  ColoringPictureDialog,
  type PictureAction,
} from "./ColoringPictureDialog";
import styles from "./ColoringLeaveSheet.module.css";

type ColoringLeaveSheetProps = {
  thumbnailUrl: string | null;
  busy: boolean;
  error: string;
  destination: LeaveTarget;
  unsaved: boolean;
  onStay: () => void;
  /** 有顏色就先收起來再走；沒有就直接走。 */
  onGo: () => void;
  /** 收不起來時才給的離開（會丟掉還沒存的顏色）。 */
  onDiscard: () => void;
};

function ParkGateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M3.5 20V9.2L12 3.6l8.5 5.6V20"
        fill="#b9f3db"
        stroke="#2f2f2f"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 20v-6.2h6V20"
        fill="#fff6ea"
        stroke="#2f2f2f"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8" r="1.35" fill="#e85d4c" />
    </svg>
  );
}

/**
 * 換一張／回遊樂園前先給看圖：大蠟筆＝繼續塗。
 * 小圖是目的地；塗過的話那一顆會先把作品收起來，不識字也不會按掉進度。
 * 「不要了」只在收不起來時出現，避免一開始就有一顆會丟掉顏色的鈕。
 */
export function ColoringLeaveSheet({
  thumbnailUrl,
  busy,
  error,
  destination,
  unsaved,
  onStay,
  onGo,
  onDiscard,
}: ColoringLeaveSheetProps) {
  const place = destination === "picker" ? "換一張" : "回遊樂園";
  const goLabel = unsaved ? `收起來，${place}` : place;
  const actions: PictureAction[] = [
    {
      label: "繼續塗",
      tone: "stay",
      icon: <CrayonIcon />,
      onClick: onStay,
    },
    {
      label: goLabel,
      tone: "go",
      icon: (
        <span className={styles.goMark}>
          {destination === "picker" ? <PictureStackIcon size={32} /> : <ParkGateIcon />}
          {unsaved ? (
            <span className={styles.badge}>
              <IconStar size={16} style={{ width: 16, height: 16 }} />
            </span>
          ) : null}
        </span>
      ),
      onClick: onGo,
      disabled: busy,
    },
  ];
  if (error) {
    actions.push({
      label: "不要了",
      tone: "danger",
      icon: <ClearIcon />,
      onClick: onDiscard,
      disabled: busy,
    });
  }

  return (
    <ColoringPictureDialog
      label="要換地方嗎"
      thumbnailUrl={thumbnailUrl}
      actions={actions}
      error={error}
    />
  );
}
