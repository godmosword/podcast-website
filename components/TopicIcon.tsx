import type { TopicSymbol } from "@/lib/topic-visuals";
import { topicVisualFor } from "@/lib/topic-visuals";
import styles from "./TopicIcon.module.css";

type TopicIconProps = {
  /** null = 全部主題 */
  tag?: string | null;
  size?: number;
  className?: string;
};

function SymbolPaths({ symbol, fg }: { symbol: TopicSymbol; fg: string }) {
  const sw = 2;
  const cap = "round" as const;
  const join = "round" as const;

  switch (symbol) {
    case "all":
      return (
        <>
          <circle cx="8" cy="8" r="2.6" fill="#f7a8c4" />
          <circle cx="16" cy="8" r="2.6" fill="#8fcde8" />
          <circle cx="8" cy="16" r="2.6" fill="#b7df9b" />
          <circle cx="16" cy="16" r="2.6" fill="#c5b3e6" />
        </>
      );
    case "star":
      return (
        <path
          d="M12 4.5l1.8 4.2 4.5.4-3.4 2.9 1 4.4L12 14.2 8.1 16.4l1-4.4-3.4-2.9 4.5-.4L12 4.5z"
          fill={fg}
        />
      );
    case "sprout":
      return (
        <>
          <path
            d="M12 19.5v-7"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
          />
          <path
            d="M12 12.5c-3-2.5-4.5-5.5-4-8 2.5-.2 4.5 1.5 5.5 4.5"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
            fill="none"
          />
          <path
            d="M12 12.5c3-2.5 4.5-5.5 4-8-2.5-.2-4.5 1.5-5.5 4.5"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
            fill="none"
          />
        </>
      );
    case "shield":
      return (
        <path
          d="M12 4.5l6 2.5v5c0 3.8-2.6 6.8-6 7.5-3.4-.7-6-3.7-6-7.5V7l6-2.5z"
          fill="none"
          stroke={fg}
          strokeWidth={sw}
          strokeLinejoin={join}
        />
      );
    case "link":
      return (
        <>
          <circle cx="9" cy="12" r="3.2" fill="none" stroke={fg} strokeWidth={sw} />
          <circle cx="15" cy="12" r="3.2" fill="none" stroke={fg} strokeWidth={sw} />
          <path d="M11.2 10.8h1.6M11.2 13.2h1.6" stroke={fg} strokeWidth={sw} strokeLinecap={cap} />
        </>
      );
    case "heart":
      return (
        <path
          d="M12 19s-5.5-3.4-7.2-6.4C3.4 10.2 4.6 7 7.6 7c1.7 0 3 1 4.4 2.4C13.4 8 14.7 7 16.4 7 19.4 7 20.6 10.2 19.2 12.6 17.5 15.6 12 19 12 19z"
          fill={fg}
        />
      );
    case "check":
      return (
        <>
          <circle cx="12" cy="12" r="7.5" fill="none" stroke={fg} strokeWidth={sw} />
          <path
            d="M8.5 12.2l2.4 2.4 4.8-5"
            fill="none"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
            strokeLinejoin={join}
          />
        </>
      );
    case "habit":
      return (
        <>
          <path
            d="M16.5 8.5A5.5 5.5 0 1 0 12 17.5"
            fill="none"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
          />
          <path
            d="M12 6.5v4.2l2.6 1.5"
            fill="none"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
            strokeLinejoin={join}
          />
        </>
      );
    case "calm":
      return (
        <>
          <path
            d="M5 11c1.8-1.5 3.5-1.5 5.2 0s3.4 1.5 5.2 0 3.5-1.5 5.2 0"
            fill="none"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
          />
          <path
            d="M5 15c1.8-1.5 3.5-1.5 5.2 0s3.4 1.5 5.2 0 3.5-1.5 5.2 0"
            fill="none"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
            opacity={0.65}
          />
        </>
      );
    case "help":
      return (
        <>
          <path
            d="M8 14.5c1.2 1.8 2.6 2.7 4 2.7s2.8-.9 4-2.7"
            fill="none"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
          />
          <path
            d="M12 6.5c-2 0-3.2 1.2-3.2 2.6 0 1.2 1 2 2.4 2.6 1 .4 1.6 1 1.6 2v.8"
            fill="none"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
          />
        </>
      );
    case "ask":
      return (
        <>
          <path
            d="M7 8.5h10a2 2 0 0 1 2 2v3.5a2 2 0 0 1-2 2H11l-3 2.5V8.5z"
            fill="none"
            stroke={fg}
            strokeWidth={sw}
            strokeLinejoin={join}
          />
          <path
            d="M11.5 12.2h1M11.5 14.8h1"
            stroke={fg}
            strokeWidth={1.8}
            strokeLinecap={cap}
          />
        </>
      );
    case "flag":
      return (
        <>
          <path d="M8 5.5v13" stroke={fg} strokeWidth={sw} strokeLinecap={cap} />
          <path
            d="M8 6.5h7.5l-1.5 2.5 1.5 2.5H8"
            fill={fg}
            opacity={0.9}
          />
        </>
      );
    case "retry":
      return (
        <>
          <path
            d="M16 9.5A4.5 4.5 0 1 0 12 17"
            fill="none"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
          />
          <path
            d="M12 6.5V4.5l-2 2 2 2"
            fill="none"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
            strokeLinejoin={join}
          />
        </>
      );
    case "spark":
      return (
        <>
          <path d="M12 4.5v3M12 16.5v3M4.5 12h3M16.5 12h3" stroke={fg} strokeWidth={sw} strokeLinecap={cap} />
          <path d="M7 7l2 2M15 15l2 2M17 7l-2 2M9 15l-2 2" stroke={fg} strokeWidth={sw} strokeLinecap={cap} />
          <circle cx="12" cy="12" r="2.2" fill={fg} />
        </>
      );
    case "dream":
      return (
        <>
          <path
            d="M7 14c0-2.8 2.2-5 5-5s5 2.2 5 5"
            fill="none"
            stroke={fg}
            strokeWidth={sw}
            strokeLinecap={cap}
          />
          <circle cx="9" cy="11" r="1.1" fill={fg} />
          <circle cx="15" cy="11" r="1.1" fill={fg} />
          <path d="M10 16.5h4" stroke={fg} strokeWidth={sw} strokeLinecap={cap} opacity={0.7} />
        </>
      );
    case "puzzle":
      return (
        <path
          d="M8 7.5h3.2a1.3 1.3 0 0 0 2.5 0H16v3.2a1.3 1.3 0 0 1 0 2.5V16h-3.2a1.3 1.3 0 0 0-2.5 0H8v-3.2a1.3 1.3 0 0 1 0-2.5V7.5z"
          fill="none"
          stroke={fg}
          strokeWidth={sw}
          strokeLinejoin={join}
        />
      );
    case "bookmark":
    default:
      return (
        <path
          d="M8 5.5h8v13l-4-2.8L8 18.5V5.5z"
          fill={fg}
          opacity={0.92}
        />
      );
  }
}

/** 主題徽章：粉彩底 + 簡潔 SVG，對齊站內黏土風配色。 */
export default function TopicIcon({
  tag = null,
  size = 26,
  className = "",
}: TopicIconProps) {
  const { symbol, bg, fg } = topicVisualFor(tag);
  const glyph = Math.round(size * 0.62);

  return (
    <span
      className={`${styles.badge} ${className}`.trim()}
      style={{ width: size, height: size, backgroundColor: bg }}
      aria-hidden
    >
      <svg
        className={styles.svg}
        width={glyph}
        height={glyph}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <SymbolPaths symbol={symbol} fg={fg} />
      </svg>
    </span>
  );
}
