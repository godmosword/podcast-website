/** 著色工具列圖示：小孩認得出的實物畫具，家長操作列用線性圖。 */

type IconProps = {
  className?: string;
};

const BOX = {
  viewBox: "0 0 24 24",
  width: 26,
  height: 26,
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

/** 與著色色盤同色，選中時靠 currentColor 描邊維持輪廓。 */
const CRAYON_TIP = "#f4a261";
const CRAYON_BODY = "#f2c94c";
const CRAYON_BAND = "#e85d4c";
const BUCKET_BODY = "#2d9cdb";
const BUCKET_LIP = "#56ccf2";
const PAINT_DRIP = "#e85d4c";
const ERASER_RUBBER = "#f781c6";
const ERASER_SLEEVE = "#9b9b9b";

const GLYPH_STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinejoin: "round" as const,
};

/** 蠟筆：橘尖、黃身、紅包裝帶。 */
export function CrayonIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <path d="M12 2.3 16.2 8.5H7.8Z" fill={CRAYON_TIP} {...GLYPH_STROKE} />
      <path
        d="M8.15 8.7h7.7v9.5A1.7 1.7 0 0 1 14.15 19.9H9.85A1.7 1.7 0 0 1 8.15 18.2V8.7Z"
        fill={CRAYON_BODY}
        {...GLYPH_STROKE}
      />
      <path d="M8.35 12.3h7.3v2.35H8.35z" fill={CRAYON_BAND} />
    </svg>
  );
}

/** 油漆桶：提把＋藍桶＋傾倒的紅油漆。 */
export function BucketIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <path d="M8.3 8.7c0-2.15 1.55-3.55 3.7-3.55s3.7 1.4 3.7 3.55" {...STROKE} />
      <path
        d="M5.15 9.15h13.7l-1.2 10.05A1.6 1.6 0 0 1 16.08 21.2H7.92A1.6 1.6 0 0 1 6.35 19.2Z"
        fill={BUCKET_BODY}
        {...GLYPH_STROKE}
      />
      <path d="M6.45 10.55h11.1v1.7H6.45z" fill={BUCKET_LIP} />
      <path
        d="M17.55 11.3c2.35.45 3.45 2.15 3.05 3.75"
        fill="none"
        stroke={PAINT_DRIP}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="20.15" cy="16.7" r="1.4" fill={PAINT_DRIP} />
    </svg>
  );
}

/** 橡皮擦：斜放的粉紅橡皮＋灰套。 */
export function EraserIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <g transform="rotate(-20 12 12)">
        <rect
          x="3.5"
          y="8.1"
          width="10.3"
          height="7.8"
          rx="1.55"
          fill={ERASER_RUBBER}
          {...GLYPH_STROKE}
        />
        <rect
          x="14.9"
          y="8.1"
          width="5.7"
          height="7.8"
          rx="1.25"
          fill={ERASER_SLEEVE}
          {...GLYPH_STROKE}
        />
      </g>
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
