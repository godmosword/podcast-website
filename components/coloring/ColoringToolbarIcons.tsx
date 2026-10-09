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

/** 重做：順時針彎箭頭（復原的鏡像）。 */
export function RedoIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <g {...STROKE}>
        <path d="M15.5 7.2h3.7l-3.4-3.3" />
        <path d="M18.8 7.2h-6.4a6 6 0 1 0 1.2 11.9" />
      </g>
    </svg>
  );
}

/** 列印線稿：印表機吐出一張紙。 */
export function PrintIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <g {...STROKE}>
        <path d="M7.2 9V4.4h9.6V9" />
        <rect x="4" y="9" width="16" height="7.6" rx="2" />
        <path d="M7.2 13.8h9.6v6H7.2z" />
      </g>
    </svg>
  );
}

/** 塗法「不出線」：框框裡塗滿。 */
export function InsideLinesIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="4" {...STROKE} />
      <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  );
}

/** 塗法「自由塗」：一道隨手的花紋。 */
export function FreeDrawIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <path d="M3 15c2.5-6 5-6 6 0s3.5 6 6 0 3.5-4.5 6-1.5" {...STROKE} />
    </svg>
  );
}

/** 只存在這台裝置：手機。 */
export function DeviceIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <g {...STROKE}>
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M11 18h2" />
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

/** 空白畫紙：清空確認裡的「清掉」圖。 */
export function BlankPageIcon({ className }: IconProps) {
  return (
    <svg {...BOX} className={className}>
      <rect
        x="5"
        y="3.2"
        width="14"
        height="17.6"
        rx="2"
        fill="#fff"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M8 8.2h8M8 12h8M8 15.8h5" {...STROKE} />
    </svg>
  );
}

/** 換一張：兩張圖卡疊在一起，跟漢堡選單一樣的細線。 */
export function PictureStackIcon({ className, size = 24 }: IconProps & { size?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} aria-hidden focusable="false">
      <rect x="7" y="3.5" width="13" height="13" rx="2" {...STROKE} />
      <rect x="3.5" y="7.5" width="13" height="13" rx="2" {...STROKE} fill="var(--card, #fff)" />
      <circle cx="7.6" cy="11.2" r="1.1" fill="currentColor" />
      <path d="m5.2 18 3.2-3.1 2.1 2 2.2-2.4 2.6 3.5" {...STROKE} />
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
