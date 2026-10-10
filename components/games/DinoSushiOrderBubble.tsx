"use client";

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
};

function Check() {
  return (
    <svg viewBox="0 0 24 24" className={styles.check} aria-hidden focusable="false">
      <circle cx="12" cy="12" r="10" fill="#5fbf85" stroke="#fff" strokeWidth="2.4" />
      <path d="M7 12.5l3.2 3.2L17 8.8" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 多多頭上的點餐泡泡：圖案說想吃什麼，放對一樣就打勾。 */
export function DinoSushiOrderBubble({ order, sushi, flash, index, total }: Props) {
  const checks = orderChecks(sushi, order);
  return (
    <div className={styles.bubble} role="img" aria-label={`第 ${index + 1} 單，共 ${total} 單。${orderAnnouncement(order)}`}>
      <span className={styles.bubbleItem} data-done={checks.base ? "true" : undefined} data-flash={flash && !flash.baseOk ? "true" : undefined}>
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
    </div>
  );
}
