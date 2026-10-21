import { useSvgIds } from "./useSvgIds";

/**
 * 情境插畫「看展覽」：圓頂小展館（玩具感，不像任何真實博物館），
 * 館前支架上一顆帶環行星模型，台座上一支大放大鏡。淡紫主色、奶油石材、一點金。
 */
export function ExhibitScene() {
  const id = useSvgIds([
    "sky", "plaza", "dome", "stone", "planet", "glass", "shadow", "soft",
  ]);
  const stars = [
    [62, 46], [118, 30], [176, 62], [338, 36], [404, 58], [452, 30], [86, 104], [430, 110],
  ] as const;
  return (
    <svg viewBox="0 0 500 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id.sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DCCEF2" />
          <stop offset="1" stopColor="#F4EEFB" />
        </linearGradient>
        <linearGradient id={id.plaza} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EEE2D3" />
          <stop offset="1" stopColor="#DCCAB4" />
        </linearGradient>
        <radialGradient id={id.dome} cx="0.32" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#E3D6F7" />
          <stop offset="0.65" stopColor="#BFA8E6" />
          <stop offset="1" stopColor="#9C83CF" />
        </radialGradient>
        <linearGradient id={id.stone} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF8EC" />
          <stop offset="1" stopColor="#EAD9BF" />
        </linearGradient>
        <radialGradient id={id.planet} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#FFD2B0" />
          <stop offset="0.7" stopColor="#F4A07A" />
          <stop offset="1" stopColor="#DE8060" />
        </radialGradient>
        <radialGradient id={id.glass} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#CFE7F5" />
        </radialGradient>
        <filter id={id.shadow} x="-40%" y="-80%" width="180%" height="260%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={id.soft} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      <rect width="500" height="300" fill={`url(#${id.sky})`} />
      {stars.map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y - 6} Q${x} ${y} ${x + 6} ${y} Q${x} ${y} ${x} ${y + 6} Q${x} ${y} ${x - 6} ${y} Q${x} ${y} ${x} ${y - 6} Z`} fill="#FFF6D6" />
      ))}
      <path d="M0 214 C120 204 380 204 500 214 V300 H0 Z" fill={`url(#${id.plaza})`} />

      {/* 圓石板小路 */}
      {[
        { cx: 250, cy: 290, rx: 26, ry: 7 },
        { cx: 252, cy: 270, rx: 22, ry: 6 },
        { cx: 249, cy: 253, rx: 19, ry: 5 },
      ].map((s) => (
        <g key={s.cy}>
          <ellipse cx={s.cx} cy={s.cy + 2} rx={s.rx} ry={s.ry} fill="#B89F86" opacity="0.5" />
          <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="#F7EFE4" />
        </g>
      ))}

      {/* 展館 */}
      <ellipse cx="250" cy="240" rx="110" ry="12" fill="#6B5A84" opacity="0.28" filter={`url(#${id.shadow})`} />
      <rect x="160" y="226" width="180" height="16" rx="8" fill="#E6D3B8" />
      <rect x="170" y="216" width="160" height="14" rx="7" fill="#F1E4CF" />
      <rect x="172" y="132" width="156" height="88" rx="14" fill={`url(#${id.stone})`} />
      {[188, 220, 268, 300].map((x) => (
        <g key={x}>
          <rect x={x} y="140" width="14" height="76" rx="7" fill="#FFFBF4" />
          <rect x={x + 9} y="144" width="4" height="68" rx="2" fill="#E6D3B8" opacity="0.8" />
        </g>
      ))}
      {/* 門：敞開，裡面暖光 */}
      <path d="M236 216 V178 C236 168 242 162 250 162 C258 162 264 168 264 178 V216 Z" fill="#FFE2A2" />
      <path d="M236 216 V178 C236 168 242 162 250 162" fill="none" stroke="#C9A97F" strokeWidth="3" />
      {/* 圓頂 */}
      <rect x="164" y="122" width="172" height="16" rx="8" fill="#EAD9BF" />
      <path d="M174 124 C174 82 208 58 250 58 C292 58 326 82 326 124 Z" fill={`url(#${id.dome})`} />
      <path d="M200 120 C202 92 222 72 250 68" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.4" />
      <ellipse cx="222" cy="84" rx="16" ry="8" fill="#FFFFFF" opacity="0.4" filter={`url(#${id.soft})`} />
      <rect x="246" y="40" width="8" height="20" rx="4" fill="#D9A93E" />
      <circle cx="250" cy="38" r="8" fill="#F2C14E" />
      <circle cx="247" cy="35" r="2.5" fill="#FFFFFF" opacity="0.7" />

      {/* 帶環行星模型（左前） */}
      <ellipse cx="108" cy="264" rx="34" ry="7" fill="#6B5A84" opacity="0.28" filter={`url(#${id.shadow})`} />
      <rect x="84" y="250" width="48" height="14" rx="7" fill="#F1E4CF" />
      <rect x="105" y="168" width="6" height="84" rx="3" fill="#C9A97F" />
      <g transform="translate(108 150)">
        <path d="M-50 4 C-40 -12 40 -12 50 4" fill="none" stroke="#F2C14E" strokeWidth="7" strokeLinecap="round" transform="rotate(-14)" opacity="0.85" />
        <circle r="28" fill={`url(#${id.planet})`} />
        <circle cx="-10" cy="-11" r="7" fill="#FFFFFF" opacity="0.5" filter={`url(#${id.soft})`} />
        <circle cx="8" cy="6" r="4" fill="#E58C68" opacity="0.7" />
        <path d="M-50 4 C-40 20 40 20 50 4" fill="none" stroke="#F7CF63" strokeWidth="7" strokeLinecap="round" transform="rotate(-14)" />
      </g>

      {/* 台座＋放大鏡（右前） */}
      <ellipse cx="394" cy="262" rx="40" ry="8" fill="#6B5A84" opacity="0.28" filter={`url(#${id.shadow})`} />
      <rect x="364" y="212" width="60" height="50" rx="10" fill={`url(#${id.stone})`} />
      <rect x="358" y="204" width="72" height="12" rx="6" fill="#EAD9BF" />
      <g transform="translate(392 180) rotate(-28)">
        <rect x="-5" y="18" width="10" height="34" rx="5" fill="#B9784A" />
        <circle r="22" fill={`url(#${id.glass})`} opacity="0.9" />
        <circle r="22" fill="none" stroke="#E2B04A" strokeWidth="7" />
        <path d="M-10 -8 C-6 -14 2 -16 8 -14" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
      </g>
    </svg>
  );
}
