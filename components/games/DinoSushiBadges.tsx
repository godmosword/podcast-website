"use client";

import styles from "./DinoSushiKitchen.module.css";

/**
 * 砧板提示的「要怎麼點」角標（2026-11-08）：以前光暈只說「點這裡」，換飯、拿掉料只寫在讀屏標籤裡。
 * 只在提示指到那一格時出現（做錯、閒置），平常不畫：
 * - 不常駐：泡泡裡打勾的料，砧板上同一樣卻掛著記號，孩子會讀成「這個錯了」。
 * - 換飯用左右互換箭頭；繞圈箭頭在專案裡代表「重來」。
 * - 拿掉用往下的「放回去」箭頭，不用 ×（○對 ×錯）；跟擠掉那層縮小飛回托盤是同一個方向。
 * 角標收得到點擊（冒泡到按鈕）：料位是正圓，右上角在圓外，點在角標上也要算點到那一層。
 */
export function SwapBadge() {
  return (
    <span className={styles.badge} data-badge="swap" aria-hidden>
      <svg viewBox="0 0 16 16" focusable="false">
        <path d="M2.5 5.5h10" />
        <path d="M10 3l2.5 2.5L10 8" />
        <path d="M13.5 10.5h-10" />
        <path d="M6 8l-2.5 2.5L6 13" />
      </svg>
    </span>
  );
}

export function RemoveBadge() {
  return (
    <span className={styles.badge} data-badge="remove" aria-hidden>
      <svg viewBox="0 0 16 16" focusable="false">
        <path d="M8 2.5v8" />
        <path d="M4.5 7.5L8 11l3.5-3.5" />
        <path d="M3.5 13.5h9" />
      </svg>
    </span>
  );
}
