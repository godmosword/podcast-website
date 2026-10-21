import { useSvgIds } from "./useSvgIds";

/**
 * 情境插畫「免費就好」：敞開的花園門，小路通到大樹下的野餐墊，天上一只風箏。
 * 暖黃、蜂蜜主色配草綠。畫面要「開放、歡迎」，不畫上鎖或圍起來的東西。
 */
export function FreeScene() {
  const id = useSvgIds([
    "sky", "hillBack", "hillFront", "path", "canopy", "kite", "check", "post", "shadow", "soft",
  ]);
  return (
    <svg viewBox="0 0 500 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id.sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9B0" />
          <stop offset="1" stopColor="#FFF7E2" />
        </linearGradient>
        <linearGradient id={id.hillBack} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CBE8B2" />
          <stop offset="1" stopColor="#B4DC9C" />
        </linearGradient>
        <linearGradient id={id.hillFront} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9D991" />
          <stop offset="1" stopColor="#84C170" />
        </linearGradient>
        <linearGradient id={id.path} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6E3BC" />
          <stop offset="1" stopColor="#EBCB94" />
        </linearGradient>
        <radialGradient id={id.canopy} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#A9DB8E" />
          <stop offset="0.7" stopColor="#7DBD69" />
          <stop offset="1" stopColor="#62A453" />
        </radialGradient>
        <linearGradient id={id.kite} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFB3C6" />
          <stop offset="1" stopColor="#EF7F9C" />
        </linearGradient>
        <pattern id={id.check} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="skewX(-28)">
          <rect width="16" height="16" fill="#FFF3E2" />
          <rect width="8" height="8" fill="#F59A8E" />
          <rect x="8" y="8" width="8" height="8" fill="#F59A8E" />
        </pattern>
        <linearGradient id={id.post} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFF6E6" />
          <stop offset="1" stopColor="#E9D3AF" />
        </linearGradient>
        <filter id={id.shadow} x="-40%" y="-80%" width="180%" height="260%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={id.soft} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      <rect width="500" height="300" fill={`url(#${id.sky})`} />
      <circle cx="74" cy="56" r="36" fill="#FFF0B8" opacity="0.6" filter={`url(#${id.shadow})`} />
      <circle cx="74" cy="56" r="22" fill="#FFD95E" />
      <circle cx="67" cy="49" r="6" fill="#FFFFFF" opacity="0.55" filter={`url(#${id.soft})`} />

      {/* 風箏 */}
      <g transform="translate(176 58) rotate(-12)">
        <path d="M0 -26 L20 0 L0 30 L-20 0 Z" fill={`url(#${id.kite})`} />
        <path d="M0 -26 V30 M-20 0 H20" stroke="#FFE2EA" strokeWidth="2.5" />
        <path d="M-8 -14 L-2 -20" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <path d="M0 30 C-10 44 10 52 0 66 C-8 78 6 86 -2 98" fill="none" stroke="#C98A5E" strokeWidth="2" />
        <path d="M-6 50 l6 4 l-6 4 Z M6 50 l-6 4 l6 4 Z" fill="#FFD45E" />
        <path d="M-7 78 l7 4 l-7 4 Z M7 78 l-7 4 l7 4 Z" fill="#8FCDE8" />
      </g>

      {/* 草坡 */}
      <path d="M0 170 C90 150 200 156 280 164 C370 172 440 150 500 158 V300 H0 Z" fill={`url(#${id.hillBack})`} />
      <path d="M0 214 C120 200 240 206 320 210 C400 214 450 204 500 208 V300 H0 Z" fill={`url(#${id.hillFront})`} />

      {/* 小路：從門口彎到樹下 */}
      <path d="M128 300 C150 262 196 250 250 240 C300 232 330 226 348 214 L372 214 C356 232 324 246 274 256 C220 266 190 278 176 300 Z" fill={`url(#${id.path})`} />

      {/* 大樹＋野餐墊 */}
      <ellipse cx="370" cy="214" rx="70" ry="10" fill="#3E6B3B" opacity="0.28" filter={`url(#${id.shadow})`} />
      <rect x="356" y="118" width="20" height="96" rx="10" fill="#A57A57" />
      <path d="M362 128 C356 150 358 180 360 206" stroke="#C49470" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
      <circle cx="336" cy="104" r="40" fill={`url(#${id.canopy})`} />
      <circle cx="400" cy="100" r="42" fill={`url(#${id.canopy})`} />
      <circle cx="368" cy="70" r="46" fill={`url(#${id.canopy})`} />
      <circle cx="350" cy="52" r="14" fill="#FFFFFF" opacity="0.28" filter={`url(#${id.soft})`} />
      <circle cx="342" cy="112" r="5" fill="#F59A8E" /><circle cx="404" cy="90" r="5" fill="#F59A8E" /><circle cx="380" cy="122" r="5" fill="#F59A8E" />
      <path d="M318 226 L414 218 L436 240 L330 250 Z" fill={`url(#${id.check})`} />
      <path d="M318 226 L414 218 L436 240 L330 250 Z" fill="none" stroke="#E98679" strokeWidth="2" opacity="0.6" />
      <g transform="translate(386 214)">
        <path d="M-14 0 H14 L10 16 H-10 Z" fill="#D9A35E" />
        <path d="M-10 0 C-10 -14 10 -14 10 0" fill="none" stroke="#B9784A" strokeWidth="3" />
        <rect x="-14" y="-2" width="28" height="5" rx="2.5" fill="#E9B872" />
      </g>

      {/* 敞開的花園門 */}
      <ellipse cx="150" cy="236" rx="76" ry="9" fill="#3E6B3B" opacity="0.28" filter={`url(#${id.shadow})`} />
      <path d="M92 152 C92 108 208 108 208 152" fill="none" stroke="#7DBD69" strokeWidth="14" strokeLinecap="round" />
      <g fill="#8FCB78">
        <circle cx="100" cy="134" r="9" /><circle cx="120" cy="116" r="9" /><circle cx="150" cy="110" r="10" />
        <circle cx="180" cy="116" r="9" /><circle cx="200" cy="134" r="9" />
      </g>
      <g fill="#FFD45E">
        <circle cx="112" cy="124" r="4" /><circle cx="166" cy="110" r="4" /><circle cx="194" cy="126" r="4" />
      </g>
      <rect x="84" y="140" width="18" height="96" rx="9" fill={`url(#${id.post})`} />
      <rect x="198" y="140" width="18" height="96" rx="9" fill={`url(#${id.post})`} />
      <circle cx="93" cy="138" r="9" fill="#FFF6E6" /><circle cx="207" cy="138" r="9" fill="#FFF6E6" />
      {/* 門扇往外打開（左扇轉向觀者） */}
      <g>
        <path d="M100 168 L62 182 V236 L100 228 Z" fill="#F6E7CF" opacity="0.4" />
        <g stroke="#F1DDBA" strokeWidth="5" strokeLinecap="round">
          <path d="M100 168 L62 182" /><path d="M100 226 L62 234" />
          <path d="M90 172 V230" /><path d="M78 176 V232" /><path d="M66 181 V234" />
        </g>
        <path d="M216 168 L254 182 V236 L216 228 Z" fill="#F6E7CF" opacity="0.4" />
        <g stroke="#F1DDBA" strokeWidth="5" strokeLinecap="round">
          <path d="M216 168 L254 182" /><path d="M216 226 L254 234" />
          <path d="M226 172 V230" /><path d="M238 176 V232" /><path d="M250 181 V234" />
        </g>
      </g>
      {/* 門下的小花 */}
      <g>
        <circle cx="70" cy="252" r="5" fill="#F59A8E" /><circle cx="242" cy="256" r="5" fill="#8FCDE8" /><circle cx="56" cy="262" r="4" fill="#FFD45E" />
      </g>
    </svg>
  );
}
