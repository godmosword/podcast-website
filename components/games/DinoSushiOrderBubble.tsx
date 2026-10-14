"use client";

import Icon from "@/components/ui/Icon";
import { BaseArt, ToppingArt } from "@/lib/games/dino-sushi/art";
import { orderAnnouncement, orderChecks, type Order, type OrderMatch } from "@/lib/games/dino-sushi/orders";
import type { Sushi } from "@/lib/games/dino-sushi/sushi";
import styles from "./DinoSushiKitchen.module.css";

type Props = {
  order: Order;
  sushi: Sushi;
  /** 料不齊送出時：閃一下缺的那一樣。 */
  flash: OrderMatch | null;
  /** 一輪第幾單（0 起）。 */
  index: number;
  total: number;
  /** 點泡泡再聽一次這單。音效關著時不給（不留點了沒聲音的按鈕）。 */
  onReplay?: () => void;
};

function Check() {
  return (
    <svg viewBox="0 0 24 24" className={styles.check} aria-hidden focusable="false">
      <circle cx="12" cy="12" r="10" fill="#5fbf85" stroke="#fff" strokeWidth="2.4" />
      <path d="M7 12.5l3.2 3.2L17 8.8" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * 多多頭上的點餐泡泡：圖案說想吃什麼，放對一樣就打勾；下面一排小盤是這輪第幾單。
 * 整顆泡泡可以點，再聽一次；左上角的小喇叭是提示，不佔泡泡寬度。
 */
export function DinoSushiOrderBubble({ order, sushi, flash, index, total, onReplay }: Props) {
  const checks = orderChecks(sushi, order);
  return (
    <div className={styles.bubbleWrap}>
      <div className={styles.bubble} role="img" aria-label={`第 ${index + 1} 單，共 ${total} 單。${orderAnnouncement(order)}`}>
        <span className={styles.bubbleItems}>
          <span
            className={styles.bubbleItem}
            data-base={order.base}
            data-done={checks.base ? "true" : undefined}
            data-flash={flash && !flash.baseOk ? "true" : undefined}
          >
            <BaseArt id={order.base} />
            {checks.base ? <Check /> : null}
          </span>
          {checks.toppings.map(({ id, done }) => (
            <span
              key={id}
              className={styles.bubbleItem}
              data-done={done ? "true" : undefined}
              data-flash={flash?.missing.includes(id) ? "true" : undefined}
            >
              <ToppingArt id={id} />
              {done ? <Check /> : null}
            </span>
          ))}
        </span>
        {/* 尾巴往左下指向多多 */}
        <svg className={styles.bubbleTail} viewBox="0 0 28 20" aria-hidden focusable="false">
          <path d="M6 0H26L3 18Z" className={styles.bubbleTailFill} />
          <path d="M26 0L3 18L6 0" className={styles.bubbleTailLine} />
        </svg>
        {/* 這輪第幾單：做完的木色小盤、現在這單是綠色小盤、還沒輪到的淡色小盤 */}
        <span className={styles.orderDots} aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={styles.orderDot} data-state={i < index ? "done" : i === index ? "now" : undefined} />
          ))}
        </span>
      </div>
      {onReplay ? (
        <button type="button" className={styles.replay} aria-label="再聽一次" onClick={onReplay}>
          <span className={styles.replayBadge} aria-hidden>
            <Icon name="volume-on" size={15} />
          </span>
        </button>
      ) : null}
    </div>
  );
}
