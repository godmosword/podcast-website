/** 著色工具列圖示：小孩認得出的實心工具，家長操作列用線性圖。 */

type IconProps = {
  className?: string;
};

const BOX = {
  viewBox: "0 0 24 24",
  width: 24,
  height: 24,
  "aria-hidden": true as const,
  focusable: "false" as const,
};

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** 蠟筆：尖頭＋筆身＋包裝紙缺口。 */
export function CrayonIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 2.1 16.4 8.2H7.6L12 2.1Zm-4 6.8h8v9.4A1.8 1.8 0 0 1 14.2 20.1H9.8A1.8 1.8 0 0 1 8 18.3V8.9Zm.9 3.3h6.2v2.3H8.9V12.2Z"
      />
    </svg>
  );
}

/** 油漆桶：提把＋桶身＋傾倒的一小滴。 */
export function BucketIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <path
        d="M8.2 8.8c0-2.2 1.6-3.7 3.8-3.7s3.8 1.5 3.8 3.7"
        {...STROKE}
      />
      <path
        fill="currentColor"
        d="M5.1 9.3h13.8l-1.35 10.4A1.7 1.7 0 0 1 15.9 21.3H8.1a1.7 1.7 0 0 1-1.65-1.6L5.1 9.3Z"
      />
      <circle cx="18.6" cy="12.4" r="1.35" fill="currentColor" />
    </svg>
  );
}

/** 橡皮擦：斜放橡皮＋金屬套。 */
export function EraserIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8.1 4.6 18.4 8.2a1.7 1.7 0 0 1 1.05 2.15l-3.3 9.1A1.7 1.7 0 0 1 14 20.5L3.7 16.9A1.7 1.7 0 0 1 2.65 14.75l3.3-9.1A1.7 1.7 0 0 1 8.1 4.6Zm.55 1.7-2.7 7.45 6.2 2.15 2.7-7.45-6.2-2.15Z"
      />
    </svg>
  );
}

/** 復原：逆時針彎箭頭。 */
export function UndoIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <g {...STROKE}>
        <path d="M8.5 7.2H4.8l3.4-3.3" />
        <path d="M5.2 7.2h6.4a6 6 0 1 1-1.2 11.9" />
      </g>
    </svg>
  );
}

/** 清空：垃圾桶。 */
export function ClearIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <g {...STROKE}>
        <path d="M5 7h14M9.5 7V5.4h5V7M8 7.2l.8 12.1h6.4L16 7.2" />
      </g>
    </svg>
  );
}

/** 縮放還原：把畫面收回正中。 */
export function ResetViewIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <g {...STROKE}>
        <path d="M9 4.8H4.8V9M15 4.8h4.2V9M9 19.2H4.8V15M15 19.2h4.2V15" />
        <circle cx="12" cy="12" r="2.2" />
      </g>
    </svg>
  );
}

/** 看原圖：相框小圖。 */
export function PreviewIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <g {...STROKE}>
        <rect x="3.6" y="5.2" width="16.8" height="13.6" rx="2.2" />
        <path d="M6.4 15.6 9.6 11.8l3.1 3.3 2.1-2.3 3.8 2.8" />
        <circle cx="15.4" cy="9.1" r="1.15" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/** 下載：箭頭落入托盤。 */
export function DownloadIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <g {...STROKE}>
        <path d="M12 4.6v10.2M8.2 11.4 12 15.2l3.8-3.8" />
        <path d="M5.2 18.6h13.6" />
      </g>
    </svg>
  );
}
