import { useSvgIds } from "./useSvgIds";

/**
 * 情境插畫「下雨也能玩」：毛毛雨裡亮著暖燈的圓頂遊戲屋，彩球從門口滾出來，
 * 門邊一把黃雨傘、一雙雨鞋。霧藍主色。不畫人、車、文字。
 */
export function RainyScene() {
  const id = useSvgIds([
    "sky", "lawn", "wall", "roof", "window", "door", "cloud", "umbrella", "puddle", "shadow", "soft",
  ]);
  const balls = [
    { cx: 236, cy: 252, r: 11, fill: "#F28CA6" },
    { cx: 262, cy: 258, r: 10, fill: "#7CC6E8" },
    { cx: 284, cy: 266, r: 11, fill: "#FFD45E" },
    { cx: 214, cy: 266, r: 9, fill: "#8FD3A0" },
  ];
  return (
    <svg viewBox="0 0 500 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id.sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C7DFF0" />
          <stop offset="1" stopColor="#E8F2F8" />
        </linearGradient>
        <linearGradient id={id.lawn} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9D69A" />
          <stop offset="1" stopColor="#86BF79" />
        </linearGradient>
        <radialGradient id={id.wall} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#FFF4E4" />
          <stop offset="0.7" stopColor="#F3DCBC" />
          <stop offset="1" stopColor="#E3C29C" />
        </radialGradient>
        <radialGradient id={id.roof} cx="0.32" cy="0.28" r="0.85">
          <stop offset="0" stopColor="#FFC3A6" />
          <stop offset="0.65" stopColor="#F29C7C" />
          <stop offset="1" stopColor="#D97C5E" />
        </radialGradient>
        <radialGradient id={id.window} cx="0.4" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#FFF6C9" />
          <stop offset="0.6" stopColor="#FFDD7A" />
          <stop offset="1" stopColor="#F7B94A" />
        </radialGradient>
        <linearGradient id={id.door} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE7A6" />
          <stop offset="1" stopColor="#F5BE5E" />
        </linearGradient>
        <radialGradient id={id.cloud} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#F2F6FA" />
          <stop offset="1" stopColor="#B9CADB" />
        </radialGradient>
        <radialGradient id={id.umbrella} cx="0.35" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#FFE893" />
          <stop offset="0.7" stopColor="#FFCB45" />
          <stop offset="1" stopColor="#E9A92A" />
        </radialGradient>
        <radialGradient id={id.puddle} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#B9DAEE" />
          <stop offset="1" stopColor="#93BFDB" />
        </radialGradient>
        <filter id={id.shadow} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={id.soft} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      <rect width="500" height="300" fill={`url(#${id.sky})`} />
      <ellipse cx="70" cy="206" rx="120" ry="40" fill="#B7D5C4" opacity="0.7" />
      <ellipse cx="440" cy="200" rx="130" ry="44" fill="#B7D5C4" opacity="0.7" />
      <path d="M0 214 C90 196 170 204 250 206 C340 208 420 194 500 206 V300 H0 Z" fill={`url(#${id.lawn})`} />

      {/* 遠景圓樹 */}
      <g>
        <ellipse cx="62" cy="214" rx="26" ry="6" fill="#4F7F4A" opacity="0.25" filter={`url(#${id.shadow})`} />
        <rect x="58" y="182" width="8" height="30" rx="4" fill="#A57A57" />
        <circle cx="62" cy="168" r="26" fill="#86C273" />
        <circle cx="54" cy="160" r="9" fill="#FFFFFF" opacity="0.25" filter={`url(#${id.soft})`} />
        <ellipse cx="444" cy="212" rx="28" ry="6" fill="#4F7F4A" opacity="0.25" filter={`url(#${id.shadow})`} />
        <rect x="440" y="178" width="8" height="32" rx="4" fill="#A57A57" />
        <circle cx="444" cy="162" r="30" fill="#7DBB6A" />
        <circle cx="434" cy="152" r="10" fill="#FFFFFF" opacity="0.25" filter={`url(#${id.soft})`} />
      </g>

      {/* 水窪映著窗光 */}
      <ellipse cx="150" cy="268" rx="44" ry="10" fill={`url(#${id.puddle})`} />
      <ellipse cx="146" cy="266" rx="14" ry="3" fill="#FFE9A8" opacity="0.8" />
      <ellipse cx="368" cy="276" rx="36" ry="8" fill={`url(#${id.puddle})`} />
      <ellipse cx="372" cy="274" rx="10" ry="2.5" fill="#FFE9A8" opacity="0.7" />

      {/* 遊戲屋 */}
      <ellipse cx="250" cy="240" rx="96" ry="12" fill="#3E6B3B" opacity="0.3" filter={`url(#${id.shadow})`} />
      <rect x="176" y="150" width="148" height="88" rx="22" fill={`url(#${id.wall})`} />
      <path d="M164 156 C164 98 206 66 250 66 C294 66 336 98 336 156 C336 164 330 168 322 168 H178 C170 168 164 164 164 156 Z" fill={`url(#${id.roof})`} />
      <ellipse cx="220" cy="100" rx="26" ry="14" fill="#FFFFFF" opacity="0.35" filter={`url(#${id.soft})`} />
      <circle cx="250" cy="62" r="9" fill="#FFD45E" />
      <circle cx="247" cy="59" r="3" fill="#FFFFFF" opacity="0.6" />
      {/* 窗 */}
      {[200, 302].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="194" r="15" fill="#FFF3E2" />
          <circle cx={cx} cy="194" r="11" fill={`url(#${id.window})`} />
          <path d={`M${cx} 183 V205 M${cx - 11} 194 H${cx + 11}`} stroke="#F3D6A8" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      ))}
      {/* 門：敞開、透出暖光 */}
      <path d="M228 238 V198 C228 184 238 176 250 176 C262 176 272 184 272 198 V238 Z" fill={`url(#${id.door})`} />
      <path d="M272 238 V198 C272 188 268 182 262 179 L280 186 C284 190 286 196 286 202 V238 Z" fill="#C98A5E" />
      <ellipse cx="250" cy="236" rx="22" ry="4" fill="#FFE29A" opacity="0.8" />

      {/* 滾出來的彩球 */}
      {balls.map((b) => (
        <g key={`${b.cx}-${b.cy}`}>
          <ellipse cx={b.cx + 2} cy={b.cy + b.r - 1} rx={b.r} ry={b.r * 0.3} fill="#2F5A33" opacity="0.28" filter={`url(#${id.soft})`} />
          <circle cx={b.cx} cy={b.cy} r={b.r} fill={b.fill} />
          <circle cx={b.cx - b.r * 0.35} cy={b.cy - b.r * 0.4} r={b.r * 0.32} fill="#FFFFFF" opacity="0.55" />
        </g>
      ))}

      {/* 雨傘：撐開斜放在門邊 */}
      <g transform="translate(98 214) rotate(-18)">
        <ellipse cx="34" cy="40" rx="40" ry="7" fill="#2F5A33" opacity="0.25" filter={`url(#${id.shadow})`} />
        <path d="M0 26 C2 4 22 -10 40 -10 C58 -10 78 4 80 26 C74 22 68 22 62 26 C56 22 48 22 40 26 C32 22 24 22 18 26 C12 22 6 22 0 26 Z" fill={`url(#${id.umbrella})`} />
        <path d="M18 26 C20 8 30 -6 40 -10 M62 26 C60 8 50 -6 40 -10" fill="none" stroke="#E9A92A" strokeWidth="2" opacity="0.7" />
        <path d="M40 24 V44 C40 50 46 50 46 44" fill="none" stroke="#B9784A" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="26" cy="2" rx="10" ry="5" fill="#FFFFFF" opacity="0.45" filter={`url(#${id.soft})`} />
      </g>

      {/* 雨鞋 */}
      {[338, 360].map((x, i) => (
        <g key={x} transform={`translate(${x} ${226 + i * 4})`}>
          <ellipse cx="12" cy="26" rx="14" ry="4" fill="#2F5A33" opacity="0.28" filter={`url(#${id.soft})`} />
          <path d="M2 0 H16 V16 C16 18 18 20 22 20 C26 20 28 22 28 24 V26 H2 Z" fill="#FFCB45" />
          <rect x="1" y="-2" width="16" height="5" rx="2.5" fill="#FFDD7A" />
          <path d="M4 4 V20" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
        </g>
      ))}

      {/* 小雨雲：放在左上，雨絲落在空中，不要落在圓頂上 */}
      <g transform="translate(-96 8)">
        <ellipse cx="254" cy="44" rx="58" ry="16" fill="#8FA6BC" opacity="0.25" filter={`url(#${id.shadow})`} />
        <circle cx="222" cy="34" r="18" fill={`url(#${id.cloud})`} />
        <circle cx="248" cy="24" r="24" fill={`url(#${id.cloud})`} />
        <circle cx="278" cy="32" r="19" fill={`url(#${id.cloud})`} />
        <rect x="206" y="30" width="90" height="22" rx="11" fill={`url(#${id.cloud})`} />
        <ellipse cx="238" cy="16" rx="12" ry="6" fill="#FFFFFF" opacity="0.6" filter={`url(#${id.soft})`} />
      </g>
      <g stroke="#86B4D6" strokeWidth="3" strokeLinecap="round">
        <path d="M122 72 l-3 9" />
        <path d="M140 84 l-3 9" />
        <path d="M160 72 l-3 9" />
        <path d="M178 86 l-3 9" />
        <path d="M130 104 l-3 9" />
        <path d="M168 110 l-3 9" />
      </g>
    </svg>
  );
}
