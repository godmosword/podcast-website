import type { PlaygroundType } from "@/data/playgrounds";
import { playgroundTypeVisualKey } from "@/lib/playground-type-visual";
import styles from "./PlayMap.module.css";

type PlaygroundTypeMarkProps = {
  type: PlaygroundType;
};

function Scene({ type }: { type: PlaygroundType }) {
  switch (type) {
    case "公園":
      return (
        <>
          <rect width="320" height="96" fill="var(--c-mint, #b7df9b)" opacity="0.35" />
          <ellipse cx="52" cy="58" rx="28" ry="26" fill="var(--c-mint, #b7df9b)" />
          <rect x="46" y="70" width="12" height="22" rx="3" fill="var(--ink)" opacity="0.45" />
          <ellipse cx="118" cy="62" rx="22" ry="20" fill="var(--c-teal, #79c8c1)" />
          <rect x="113" y="72" width="10" height="20" rx="3" fill="var(--ink)" opacity="0.4" />
          <path
            d="M198 86 V48 L248 86 Z"
            fill="var(--c-sky, #8fcde8)"
            stroke="var(--ink)"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <rect x="192" y="82" width="62" height="8" rx="4" fill="var(--ink)" opacity="0.28" />
          <circle cx="278" cy="28" r="10" fill="var(--c-yellow, #ffd866)" />
        </>
      );
    case "室內樂園":
      return (
        <>
          <rect width="320" height="96" fill="var(--c-sky, #8fcde8)" opacity="0.32" />
          <path
            d="M48 86 V44 L110 18 L172 44 V86 Z"
            fill="var(--card)"
            stroke="var(--ink)"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <rect x="88" y="56" width="36" height="30" rx="4" fill="var(--c-sky, #8fcde8)" />
          <circle cx="210" cy="70" r="14" fill="var(--c-pink, #f7a8c4)" />
          <circle cx="236" cy="76" r="10" fill="var(--c-yellow, #ffd866)" />
          <circle cx="258" cy="68" r="12" fill="var(--c-mint, #b7df9b)" />
          <rect x="196" y="82" width="80" height="8" rx="4" fill="var(--ink)" opacity="0.2" />
        </>
      );
    case "主題樂園":
      return (
        <>
          <rect width="320" height="96" fill="var(--c-pink, #f7a8c4)" opacity="0.3" />
          <circle cx="120" cy="50" r="32" fill="none" stroke="var(--ink)" strokeWidth="2.8" />
          <circle cx="120" cy="50" r="6" fill="var(--c-yellow, #ffd866)" />
          <g stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round">
            <line x1="120" y1="18" x2="120" y2="82" />
            <line x1="88" y1="50" x2="152" y2="50" />
            <line x1="97" y1="27" x2="143" y2="73" />
            <line x1="143" y1="27" x2="97" y2="73" />
          </g>
          <circle cx="120" cy="18" r="5" fill="var(--c-pink, #f7a8c4)" />
          <circle cx="152" cy="50" r="5" fill="var(--c-sky, #8fcde8)" />
          <circle cx="120" cy="82" r="5" fill="var(--c-mint, #b7df9b)" />
          <circle cx="88" cy="50" r="5" fill="var(--c-lilac, #c5b3e6)" />
          <rect x="210" y="58" width="64" height="28" rx="6" fill="var(--c-yellow, #ffd866)" />
          <path d="M210 58 L242 38 L274 58 Z" fill="var(--c-pink, #f7a8c4)" />
        </>
      );
    case "博物館":
      return (
        <>
          <rect width="320" height="96" fill="var(--c-lilac, #c5b3e6)" opacity="0.32" />
          <path d="M40 40 L160 14 L280 40" fill="var(--c-lilac, #c5b3e6)" />
          <rect x="48" y="40" width="224" height="10" fill="var(--ink)" opacity="0.35" />
          <rect x="64" y="50" width="18" height="36" rx="2" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
          <rect x="108" y="50" width="18" height="36" rx="2" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
          <rect x="152" y="50" width="18" height="36" rx="2" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
          <rect x="196" y="50" width="18" height="36" rx="2" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
          <rect x="240" y="50" width="18" height="36" rx="2" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
          <rect x="40" y="86" width="240" height="6" rx="2" fill="var(--ink)" opacity="0.28" />
        </>
      );
    case "動物園":
      return (
        <>
          <rect width="320" height="96" fill="var(--c-teal, #79c8c1)" opacity="0.3" />
          <ellipse cx="70" cy="62" rx="24" ry="22" fill="var(--c-mint, #b7df9b)" />
          <rect x="64" y="72" width="12" height="18" rx="3" fill="var(--ink)" opacity="0.4" />
          <ellipse cx="168" cy="64" rx="36" ry="22" fill="var(--c-yellow, #ffd866)" />
          <circle cx="198" cy="50" r="14" fill="var(--c-yellow, #ffd866)" />
          <circle cx="206" cy="46" r="3" fill="var(--ink)" />
          <path
            d="M198 50 Q230 28 252 48"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="148" y="78" width="10" height="12" rx="2" fill="var(--ink)" opacity="0.35" />
          <rect x="178" y="78" width="10" height="12" rx="2" fill="var(--ink)" opacity="0.35" />
          <circle cx="286" cy="26" r="9" fill="var(--c-yellow, #ffd866)" />
        </>
      );
    case "農場":
      return (
        <>
          <rect width="320" height="96" fill="var(--c-yellow, #ffd866)" opacity="0.32" />
          <circle cx="52" cy="26" r="12" fill="var(--c-yellow, #ffd866)" />
          <path
            d="M96 86 V48 L160 18 L224 48 V86 Z"
            fill="var(--c-pink, #f7a8c4)"
            stroke="var(--ink)"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <rect x="140" y="58" width="28" height="28" rx="3" fill="var(--card)" />
          <ellipse cx="260" cy="74" rx="28" ry="14" fill="var(--c-mint, #b7df9b)" />
          <rect x="88" y="86" width="200" height="6" rx="2" fill="var(--ink)" opacity="0.22" />
        </>
      );
    case "其他":
      return (
        <>
          <rect width="320" height="96" fill="var(--c-lilac, #c5b3e6)" opacity="0.22" />
          <circle cx="80" cy="48" r="22" fill="var(--c-sky, #8fcde8)" />
          <circle cx="160" cy="40" r="16" fill="var(--c-pink, #f7a8c4)" />
          <circle cx="230" cy="58" r="20" fill="var(--c-mint, #b7df9b)" />
          <circle cx="280" cy="30" r="8" fill="var(--c-yellow, #ffd866)" />
        </>
      );
  }
}

/** 類型場景帶，純裝飾。 */
export function PlaygroundTypeMark({ type }: PlaygroundTypeMarkProps) {
  return (
    <span
      className={styles.typeScene}
      data-type={playgroundTypeVisualKey(type)}
      data-scene=""
      aria-hidden
    >
      <svg viewBox="0 0 320 96" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <Scene type={type} />
      </svg>
    </span>
  );
}
