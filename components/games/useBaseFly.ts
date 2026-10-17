"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import type { BaseId } from "@/lib/games/dino-sushi/toppings";

/** 選飯過場的時間軸（毫秒）。320 仍小於廚房的連點防呆 400ms。 */
export const BASE_FLY_MS = 320;
const LAND_MS = 120;
/** 中段往上拱的高度：獨立一條 ease-in-out 軌，頂點在時間的 47%，不被整體 easing 擠到前段。 */
const ARC_PX = 12;
const ARC_PEAK = 0.47;
const FLY_EASING = "cubic-bezier(0.3, 0.7, 0.4, 1)";

type Box = { x: number; y: number; w: number; h: number };

/** object-fit: contain 之後圖真正畫出來的框（手捲皿的 img 框比圖寬很多，用框當起點會先胖一圈）。 */
export function containedBox(img: HTMLImageElement): Box {
  const r = img.getBoundingClientRect();
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh || !r.width || !r.height) return { x: r.left, y: r.top, w: r.width, h: r.height };
  const scale = Math.min(r.width / nw, r.height / nh);
  const w = nw * scale;
  const h = nh * scale;
  return { x: r.left + (r.width - w) / 2, y: r.top + (r.height - h) / 2, w, h };
}

/** 從來源框飛到目的框的 FLIP 起點：位移以中心算，縮放取寬高比較小的那個（不變形）。 */
export function flipFrom(from: Box, to: Box): { dx: number; dy: number; scale: number } {
  return {
    dx: from.x + from.w / 2 - (to.x + to.w / 2),
    dy: from.y + from.h / 2 - (to.y + to.h / 2),
    scale: Math.min(from.w / to.w, from.h / to.h),
  };
}

type Options = {
  rootRef: RefObject<HTMLElement | null>;
  base: BaseId | null;
  reducedMotion: boolean;
  inputPaused: boolean;
};

/**
 * 選飯過場：被點的那張皿上的飯，飛到砧板上新掛的壽司（FLIP，每次實測，不寫死）。
 * 只有「換了飯而且還沒放料」才飛；減少動態不飛。暫停時直接跳到終點（WAAPI 不吃 data-paused）。
 * 飛的期間掛 data-flying（結束或取消就拿掉）；data-flew 一直留著，CSS 用它關掉這顆的 baseDrop。
 */
export function useBaseFly({ rootRef, base, reducedMotion, inputPaused }: Options) {
  const pending = useRef<Box | null>(null);
  const running = useRef<{ el: HTMLElement; anims: Animation[] } | null>(null);

  const stop = useCallback(() => {
    const run = running.current;
    running.current = null;
    if (!run) return;
    for (const a of run.anims) a.cancel();
    run.el.removeAttribute("data-flying");
  }, []);

  /** 點了某張皿：先量來源（選完皿就卸載了）。回傳飛行時間；不飛時回 0。 */
  const prepare = useCallback(
    (id: BaseId, label: string, hasToppings: boolean): number => {
      pending.current = null;
      if (reducedMotion || hasToppings || id === base) return 0;
      const img = rootRef.current?.querySelector<HTMLImageElement>(
        `[data-role="base-picker"] [aria-label="選${label}"] img`,
      );
      if (!img || typeof img.animate !== "function") return 0;
      pending.current = containedBox(img);
      return BASE_FLY_MS;
    },
    [base, reducedMotion, rootRef],
  );

  useLayoutEffect(() => {
    const from = pending.current;
    pending.current = null;
    if (!from || !base) return;
    const el = rootRef.current?.querySelector<HTMLElement>('[data-role="prep-sushi"] > [data-sushi]');
    if (!el || typeof el.animate !== "function") return;
    stop();
    // 先關掉這顆的落下動畫再量：baseDrop 第一格（縮 0.92、上移 10px）會讓量到的框偏掉。
    // data-flew 一直留著：拿掉的話 animation 從 none 換回 baseDrop 會再落一次。換飯會重掛新的元素
    el.setAttribute("data-flew", "true");
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const { dx, dy, scale } = flipFrom(from, { x: r.left, y: r.top, w: r.width, h: r.height });
    el.setAttribute("data-flying", "true");
    const anims = [
      el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }, { transform: "none" }], {
        duration: BASE_FLY_MS,
        easing: FLY_EASING,
      }),
      el.animate(
        [
          { translate: "0 0", easing: "ease-out" },
          { translate: `0 ${-ARC_PX}px`, offset: ARC_PEAK, easing: "ease-in" },
          { translate: "0 0" },
        ],
        { duration: BASE_FLY_MS },
      ),
      // 落地「放下」：飛到之後才壓一下（不 fill，飛行中不受影響）
      el.animate([{ scale: "1.04 0.96" }, { scale: "1" }], {
        duration: LAND_MS,
        delay: BASE_FLY_MS,
        easing: "ease-out",
      }),
    ];
    running.current = { el, anims };
    void Promise.all(anims.map((a) => a.finished))
      .then(() => {
        if (running.current?.el !== el) return;
        running.current = null;
        el.removeAttribute("data-flying");
      })
      .catch(() => {
        // 被 cancel（換飯、離開）：stop() 已經收拾
      });
  }, [base, rootRef, stop]);

  /** 暫停時跳到終點：孩子回來看到的是已經放好的飯。 */
  useEffect(() => {
    if (!inputPaused) return;
    const run = running.current;
    if (!run) return;
    for (const a of run.anims) a.finish();
  }, [inputPaused]);

  useEffect(() => stop, [stop]);

  return { prepare };
}
