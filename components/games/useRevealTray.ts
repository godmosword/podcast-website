"use client";

import { useEffect, useRef, type RefObject } from "react";
import { BASE_FLY_TOTAL_MS } from "./useBaseFly";

/** 托盤底至少離螢幕底這麼多，才算整個露出來。 */
const TRAY_MARGIN_PX = 8;
/** 往下捲時，點餐泡泡頂端至少留在抬頭下方這麼多。 */
const TALK_GAP_PX = 4;

type RevealInput = {
  trayBottom: number;
  viewportHeight: number;
  /** 右上那一欄（點餐泡泡／多多吃飽了）的頂端；沒有東西時為 null。 */
  talkTop: number | null;
  /** sticky 抬頭黏住時的底邊。 */
  headerBottom: number;
};

/**
 * 選完飯要往下捲多少，托盤才露出來。只在托盤底超出螢幕時捲，
 * 而且不捲過點餐泡泡：孩子加料時還要看得到這一單要什麼。回傳 0＝不捲。
 */
export function trayRevealScroll({ trayBottom, viewportHeight, talkTop, headerBottom }: RevealInput): number {
  const need = trayBottom + TRAY_MARGIN_PX - viewportHeight;
  if (need <= 0) return 0;
  const room = talkTop === null ? need : talkTop - headerBottom - TALK_GAP_PX;
  return Math.max(0, Math.min(Math.ceil(need), Math.floor(room)));
}

/** 平滑捲動大約多久；暫停落在這段時間內就把捲動停在原地。 */
const SMOOTH_SCROLL_MS = 600;

/**
 * 真正看得到的畫面底邊（版面座標）。iOS Safari 的工具列收合、縮放都會讓可見範圍跟
 * innerHeight 不同，有 visualViewport 就用它。
 */
function visibleBottom(): number {
  const vv = window.visualViewport;
  return vv ? vv.offsetTop + vv.height : window.innerHeight;
}

/** 遊戲頁 sticky 抬頭黏住時的底邊（抬頭 top 是負的，黏住時會往上收一截）。 */
function stickyHeaderBottom(): number {
  const header = document.getElementById("game-play-title")?.closest("header");
  if (!header) return 0;
  const top = parseFloat(getComputedStyle(header).top);
  return header.getBoundingClientRect().height + (Number.isFinite(top) ? top : 0);
}

type Options = {
  rootRef: RefObject<HTMLElement | null>;
  choosingBase: boolean;
  reducedMotion: boolean;
  inputPaused: boolean;
};

/**
 * 很矮的直向（iPhone SE 的 Safari：320×568、375×553）放不下整個廚房，托盤第二列在螢幕外。
 * 選完飯、輪到放料時，把托盤捲進來；飯飛到砧板、落地壓完才捲，不跟選飯過場搶。
 * 放得下的螢幕算出來是 0，不會動。暫停時不捲，平滑捲動途中按暫停就停在原地。
 */
export function useRevealTray({ rootRef, choosingBase, reducedMotion, inputPaused }: Options) {
  const wasChoosing = useRef(choosingBase);
  /** 平滑捲動開始的時間；沒在捲時為 null。 */
  const smoothSince = useRef<number | null>(null);

  useEffect(() => {
    const justPicked = wasChoosing.current && !choosingBase;
    wasChoosing.current = choosingBase;
    if (!justPicked || inputPaused) return;
    let frame = 0;
    const reveal = () => {
      const root = rootRef.current;
      const tray = root?.querySelector('[data-role="tray"]');
      if (!root || !tray) return;
      const talk = root.querySelector('[data-role="talk"]')?.getBoundingClientRect();
      const by = trayRevealScroll({
        trayBottom: tray.getBoundingClientRect().bottom,
        viewportHeight: visibleBottom(),
        talkTop: talk && talk.height > 0 ? talk.top : null,
        headerBottom: stickyHeaderBottom(),
      });
      if (by <= 0) return;
      smoothSince.current = reducedMotion ? null : performance.now();
      window.scrollBy({ top: by, behavior: reducedMotion ? "instant" : "smooth" });
    };
    // 減少動態沒有過場：等這一輪畫完（托盤換成可加料）再量
    const timer = window.setTimeout(() => {
      frame = window.requestAnimationFrame(reveal);
    }, reducedMotion ? 0 : BASE_FLY_TOTAL_MS);
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, [choosingBase, inputPaused, reducedMotion, rootRef]);

  useEffect(() => {
    const since = smoothSince.current;
    if (!inputPaused || since === null) return;
    smoothSince.current = null;
    if (performance.now() - since < SMOOTH_SCROLL_MS) {
      window.scrollTo({ top: window.scrollY, behavior: "instant" });
    }
  }, [inputPaused]);
}
