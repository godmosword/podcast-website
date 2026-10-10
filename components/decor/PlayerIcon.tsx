import Icon, { ICON_LINE } from "@/components/ui/Icon";

type IconProps = {
  size?: number;
  className?: string;
};

/**
 * 播放器控制列線性圖示（白色描邊，跨平台一致、銳利）。
 * 取代 emoji（🔁⏪⏩⏹），在深色播放器與亮背景照片上都清楚。
 * 用 currentColor，可由父層 color 控制（重複開啟態套主題色）。
 * 線條畫法同全站共用圖示（ICON_LINE）；和 Icon 重複的播放、暫停、音量直接轉用 Icon。
 */

function base(size: number, className?: string) {
  return {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    className,
    "aria-hidden": true,
    focusable: "false" as const,
  };
}

/** 重複播放（循環箭頭）。 */
export function RepeatIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <g {...ICON_LINE}>
        <path d="M5 8a4 4 0 0 1 4-4h7l-2.2-2.2M16 4l-2.2 2.2" />
        <path d="M19 16a4 4 0 0 1-4 4H8l2.2 2.2M8 20l2.2-2.2" />
      </g>
    </svg>
  );
}

/** 上一張插圖（雙向左箭頭）。 */
export function RewindIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <g {...ICON_LINE}>
        <path d="M11.5 6.5 5 12l6.5 5.5" />
        <path d="M19 6.5 12.5 12 19 17.5" />
      </g>
    </svg>
  );
}

/** 下一張插圖（雙向右箭頭）。 */
export function ForwardIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <g {...ICON_LINE}>
        <path d="M12.5 6.5 19 12l-6.5 5.5" />
        <path d="M5 6.5 11.5 12 5 17.5" />
      </g>
    </svg>
  );
}

/** 停止（圓角方塊）。 */
export function StopIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
    </svg>
  );
}

/** 播放（三角形，實心）。 */
export function PlayGlyph({ size = 28, className }: IconProps) {
  return <Icon name="play" size={size} className={className} />;
}

/** 暫停（雙豎條，實心）。 */
export function PauseGlyph({ size = 28, className }: IconProps) {
  return <Icon name="pause" size={size} className={className} />;
}

/** 收藏（愛心）；filled 為已加入最愛。 */
export function HeartIcon({
  size = 22,
  className,
  filled = false,
}: IconProps & { filled?: boolean }) {
  const path =
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

  return (
    <svg {...base(size, className)}>
      {filled ? (
        <path d={path} fill="currentColor" />
      ) : (
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/** 字幕（CC）。 */
export function CaptionsIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <g {...ICON_LINE}>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M7.5 11.5h2.2a1.8 1.8 0 0 1 0 3.6H7.5M14.3 11.5h2.2a1.8 1.8 0 0 1 0 3.6h-2.2" />
      </g>
    </svg>
  );
}

/** 音量開啟。 */
export function VolumeOnIcon({ size = 22, className }: IconProps) {
  return <Icon name="volume-on" size={size} className={className} />;
}

/** 靜音。 */
export function VolumeOffIcon({ size = 22, className }: IconProps) {
  return <Icon name="volume-off" size={size} className={className} />;
}
