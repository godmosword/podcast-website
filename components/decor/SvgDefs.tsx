/**
 * 全域 SVG 濾鏡定義（手繪粗糙邊）。
 * 於 layout.tsx 掛載一次，供 RoughFrame 等例外頁面以 filter: url(#rough-N) 引用。
 * 不可見（width/height 0），純定義用途。
 */
export default function SvgDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {/* 小幅抖動：卡片外框 */}
        <filter id="rough-1" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={4}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* 中幅抖動：較大區塊外框 */}
        <filter id="rough-2" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves={2}
            seed={21}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={6}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* 大幅抖動：螢光筆色塊 / 強調 */}
        <filter id="rough-3" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves={2}
            seed={43}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={3}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
