import type { CSSProperties } from "react";
import type { GameCatalogEntry } from "@/lib/games/catalog";

type Props = {
  gameId: GameCatalogEntry["id"];
  className?: string;
  style?: CSSProperties;
};

/**
 * 遊樂園卡片縮圖：每款遊戲專屬 mini 場景 SVG（取代單一 emoji）。
 */
export default function GameThumbArt({ gameId, className, style }: Props) {
  const common = {
    viewBox: "0 0 120 90",
    className,
    style,
    role: "img" as const,
    "aria-hidden": true,
    focusable: "false" as const,
  };

  switch (gameId) {
    case "car-star":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="gts-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dcd0f5" />
              <stop offset="100%" stopColor="#f5efff" />
            </linearGradient>
          </defs>
          <rect width="120" height="90" fill="url(#gts-sky)" />
          <ellipse cx="60" cy="78" rx="52" ry="8" fill="rgba(0,0,0,.08)" />
          <rect x="8" y="62" width="104" height="10" rx="5" fill="#8d857b" />
          <path d="M28 48l8-6 14 0 6 6h-28z" fill="#ffd866" />
          <rect x="34" y="42" width="16" height="8" rx="3" fill="#8fcde8" />
          <circle cx="32" cy="56" r="5" fill="#333" />
          <circle cx="52" cy="56" r="5" fill="#333" />
          <circle cx="32" cy="56" r="2" fill="#ccc" />
          <circle cx="52" cy="56" r="2" fill="#ccc" />
          {[18, 38, 58, 78, 98].map((x, i) => (
            <path
              key={x}
              d={`M${x} ${22 + (i % 2) * 6}l3-6 3 6-6 0z`}
              fill="#ffd866"
              opacity={0.85 + (i % 3) * 0.05}
            />
          ))}
          <circle cx="88" cy="28" r="6" fill="#ffd866" opacity="0.35" />
          <circle cx="88" cy="28" r="3.5" fill="#ffd866" />
        </svg>
      );

    case "car-mission":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="gtm-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a2744" />
              <stop offset="100%" stopColor="#2d4a6e" />
            </linearGradient>
          </defs>
          <rect width="120" height="90" fill="url(#gtm-sky)" />
          <circle cx="95" cy="18" r="10" fill="#fff8dc" opacity="0.9" />
          {[
            [22, 35],
            [48, 28],
            [72, 40],
            [90, 32],
            [35, 50],
          ].map(([x, y], i) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={2 + (i % 2)}
              fill="#e8ff9a"
              opacity={0.7 + i * 0.06}
            />
          ))}
          <rect x="10" y="58" width="100" height="8" rx="4" fill="#5a534c" />
          <path d="M34 50l10-8 22 0 8 8h-40z" fill="#b7df9b" />
          <rect x="44" y="44" width="14" height="8" rx="2" fill="#8fcde8" />
          <circle cx="38" cy="58" r="5" fill="#333" />
          <circle cx="62" cy="58" r="5" fill="#333" />
          <path
            d="M18 68 Q40 52 60 68"
            fill="none"
            stroke="#79c8c1"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.6"
          />
        </svg>
      );

    case "car-adventure":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="gta-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8fd3ff" />
              <stop offset="100%" stopColor="#dff3ff" />
            </linearGradient>
          </defs>
          <rect width="120" height="90" fill="url(#gta-sky)" />
          <ellipse cx="30" cy="24" rx="16" ry="8" fill="rgba(255,255,255,.75)" />
          <ellipse cx="85" cy="18" rx="12" ry="6" fill="rgba(255,255,255,.6)" />
          <rect x="0" y="68" width="50" height="12" fill="#7a5230" />
          <rect x="0" y="68" width="50" height="4" fill="#5fc15f" />
          <rect x="55" y="58" width="30" height="8" fill="#7a5230" />
          <rect x="55" y="58" width="30" height="3" fill="#5fc15f" />
          <rect x="95" y="52" width="25" height="28" fill="#7a5230" />
          <rect x="95" y="52" width="25" height="4" fill="#5fc15f" />
          <rect x="102" y="48" width="4" height="32" fill="#888" />
          <rect x="106" y="50" width="8" height="8" fill="#fff" />
          <rect x="114" y="50" width="8" height="8" fill="#ff5252" />
          <rect x="106" y="58" width="8" height="8" fill="#ff5252" />
          <rect x="114" y="58" width="8" height="8" fill="#fff" />
          <circle cx="72" cy="52" r="5" fill="#ffc107" />
          <circle cx="82" cy="48" r="4" fill="#ffc107" />
          <path d="M38 58l8-5 12 0 5 5h-25z" fill="#ffd23f" />
          <circle cx="36" cy="66" r="4" fill="#333" />
          <circle cx="50" cy="66" r="4" fill="#333" />
          <path d="M68 62l6-4 10 0 4 4h-20z" fill="#ff6b6b" opacity="0.85" />
        </svg>
      );

    case "block-drop":
      return (
        <svg {...common}>
          <rect width="120" height="90" fill="#f0f4ff" />
          <rect
            x="28"
            y="12"
            width="64"
            height="66"
            rx="6"
            fill="#1a1f35"
            opacity="0.92"
          />
          {[
            ["#5bd0ff", 34, 58],
            ["#ffd866", 50, 58],
            ["#f7a8c4", 66, 58],
            ["#b7df9b", 42, 42],
            ["#c5b3e6", 58, 42],
            ["#ff9f68", 50, 26],
          ].map(([color, x, y]) => (
            <rect
              key={`${color}-${x}-${y}`}
              x={x as number}
              y={y as number}
              width="14"
              height="14"
              rx="3"
              fill={color as string}
              stroke="rgba(255,255,255,.35)"
              strokeWidth="1"
            />
          ))}
          <rect x="28" y="12" width="64" height="66" rx="6" fill="none" stroke="#4a5568" strokeWidth="2" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <rect width="120" height="90" fill="var(--sky-2)" />
          <text x="60" y="52" textAnchor="middle" fontSize="28">
            🎮
          </text>
        </svg>
      );
  }
}
