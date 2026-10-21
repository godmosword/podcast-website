import { useSvgIds } from "./useSvgIds";

/**
 * 情境插畫「跑跳放電」：晴天草坡上的彎曲大溜滑梯與攀爬網，
 * 前景一顆彈在半空的球和它在草地上的影子。薄荷、草綠主色，橘色溜滑梯點睛。
 */
export function EnergyScene() {
  const id = useSvgIds([
    "sky", "hillBack", "hillFront", "sun", "slide", "deck", "roof", "ball", "shadow", "soft",
  ]);
  return (
    <svg viewBox="0 0 500 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id.sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D8EEF8" />
          <stop offset="1" stopColor="#F4FAEC" />
        </linearGradient>
        <linearGradient id={id.hillBack} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C6E6B0" />
          <stop offset="1" stopColor="#AED79A" />
        </linearGradient>
        <linearGradient id={id.hillFront} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A6D88F" />
          <stop offset="1" stopColor="#80BE6C" />
        </linearGradient>
        <radialGradient id={id.sun} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FFF4BE" />
          <stop offset="0.7" stopColor="#FFD95E" />
          <stop offset="1" stopColor="#F8C33E" />
        </radialGradient>
        <linearGradient id={id.slide} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFB678" />
          <stop offset="1" stopColor="#F08A3E" />
        </linearGradient>
        <linearGradient id={id.deck} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FD0EC" />
          <stop offset="1" stopColor="#62B5DA" />
        </linearGradient>
        <radialGradient id={id.roof} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#FFB3C6" />
          <stop offset="1" stopColor="#EF7F9C" />
        </radialGradient>
        <radialGradient id={id.ball} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FF9C8F" />
          <stop offset="1" stopColor="#E85F55" />
        </radialGradient>
        <filter id={id.shadow} x="-40%" y="-80%" width="180%" height="260%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={id.soft} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      <rect width="500" height="300" fill={`url(#${id.sky})`} />
      {/* 太陽與雲 */}
      <circle cx="404" cy="58" r="40" fill="#FFE98A" opacity="0.35" filter={`url(#${id.shadow})`} />
      <circle cx="404" cy="58" r="26" fill={`url(#${id.sun})`} />
      <circle cx="396" cy="50" r="7" fill="#FFFFFF" opacity="0.6" filter={`url(#${id.soft})`} />
      <g fill="#FFFFFF">
        <circle cx="92" cy="58" r="16" /><circle cx="114" cy="48" r="20" /><circle cx="138" cy="58" r="15" />
        <rect x="80" y="56" width="70" height="16" rx="8" />
        <circle cx="282" cy="40" r="11" opacity="0.9" /><circle cx="298" cy="34" r="14" opacity="0.9" />
        <rect x="272" y="38" width="44" height="12" rx="6" opacity="0.9" />
      </g>

      {/* 草坡 */}
      <path d="M0 176 C80 146 170 150 250 166 C330 182 420 150 500 160 V300 H0 Z" fill={`url(#${id.hillBack})`} />
      <path d="M0 222 C100 200 200 204 270 214 C360 226 430 206 500 214 V300 H0 Z" fill={`url(#${id.hillFront})`} />

      {/* 兩側圓樹 */}
      {[{ x: 48, y: 196, r: 26 }, { x: 462, y: 192, r: 30 }].map((t) => (
        <g key={t.x}>
          <ellipse cx={t.x} cy={t.y + 30} rx={t.r} ry="6" fill="#3E6B3B" opacity="0.25" filter={`url(#${id.shadow})`} />
          <rect x={t.x - 4} y={t.y} width="8" height="30" rx="4" fill="#A57A57" />
          <circle cx={t.x} cy={t.y - 10} r={t.r} fill="#79B867" />
          <circle cx={t.x - t.r * 0.35} cy={t.y - 10 - t.r * 0.35} r={t.r * 0.3} fill="#FFFFFF" opacity="0.25" filter={`url(#${id.soft})`} />
        </g>
      ))}

      {/* 遊具：塔＋攀爬網＋大溜滑梯 */}
      <ellipse cx="262" cy="232" rx="130" ry="12" fill="#3E6B3B" opacity="0.28" filter={`url(#${id.shadow})`} />
      {/* 攀爬網：從平台左側斜拉到地面的菱格繩網 */}
      <path d="M140 228 L202 124 L208 124 L184 228 Z" fill="#F6E7CF" opacity="0.3" />
      <g stroke="#EED7AE" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M140 228 L202 124" />
        <path d="M184 228 L208 124" />
        <path d="M151 210 L176 228 M162 192 L188 214 M173 174 L196 194 M184 156 L201 172 M195 138 L205 148" />
        <path d="M151 210 L186 188 M162 192 L192 166 M173 174 L198 146 M184 156 L203 132" />
      </g>
      {/* 塔柱 */}
      {[202, 258].map((x) => (
        <rect key={x} x={x} y="96" width="12" height="134" rx="6" fill="#F6E7CF" />
      ))}
      {/* 平台 */}
      <rect x="194" y="118" width="80" height="16" rx="8" fill={`url(#${id.deck})`} />
      <rect x="198" y="120" width="40" height="4" rx="2" fill="#FFFFFF" opacity="0.45" />
      {/* 圓頂小屋頂 */}
      <path d="M190 100 C190 72 210 56 236 56 C262 56 282 72 282 100 Z" fill={`url(#${id.roof})`} />
      <ellipse cx="220" cy="72" rx="14" ry="7" fill="#FFFFFF" opacity="0.4" filter={`url(#${id.soft})`} />
      <circle cx="236" cy="52" r="6" fill="#FFD45E" />
      {/* 大溜滑梯：從平台右側彎下來 */}
      <path d="M270 128 C318 132 322 176 350 196 C366 208 384 214 406 214" fill="none" stroke="#D9732E" strokeWidth="34" strokeLinecap="round" />
      <path d="M270 128 C318 132 322 176 350 196 C366 208 384 214 406 214" fill="none" stroke={`url(#${id.slide})`} strokeWidth="28" strokeLinecap="round" />
      <path d="M274 124 C316 128 322 168 348 188 C362 199 378 205 398 206" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.4" />

      {/* 彈在半空的球＋地上的影子 */}
      <ellipse cx="112" cy="262" rx="24" ry="6" fill="#2F5A33" opacity="0.3" filter={`url(#${id.soft})`} />
      <g transform="translate(108 196)">
        <circle r="22" fill={`url(#${id.ball})`} />
        <path d="M-21 -4 C-8 4 8 4 21 -4 C20 4 18 9 15 13 C5 18 -5 18 -15 13 C-18 9 -20 4 -21 -4 Z" fill="#FFD45E" />
        <circle cx="-8" cy="-10" r="6" fill="#FFFFFF" opacity="0.55" />
      </g>
      <g stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.8">
        <path d="M78 220 l-8 4" /><path d="M80 232 l-9 1" />
      </g>
    </svg>
  );
}
