"use client";

import { ToppingArt } from "@/lib/games/dino-sushi/art";
import { customerById } from "@/lib/games/dino-sushi/customers";
import type { Order } from "@/lib/games/dino-sushi/orders";
import styles from "./DinoSushiKitchen.module.css";

function Heart() {
  return (
    <svg viewBox="0 0 24 24" className={styles.thanksHeart} aria-hidden focusable="false">
      <path
        d="M12 20.4s-6.6-4.1-8.8-8C1.4 9.8 1.8 6.6 4.5 5.4c1.8-.8 3.6-.3 5.5 2.2 1.9-2.5 3.7-3 5.5-2.2 2.7 1.2 3.1 4.4 1.3 7-2.2 3.9-8.8 8-8.8 8z"
        fill="#e25b78"
        stroke="#fff"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" className={styles.thanksStar} aria-hidden focusable="false">
      <path
        d="M12 3.2l2.2 5.8 6.2.5-4.7 4 1.5 6.1L12 16.6 6.8 19.6l1.5-6.1-4.7-4 6.2-.5z"
        fill="#ffd34d"
        stroke="#b07f43"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 做對一單、多多吃下去時，點餐的朋友在多多字卡下面出來說謝謝（關掉「念出來」也看得到）。
 * 長相刻意不像點餐泡泡：沒有白底木框、沒有尾巴、沒有料圖列，只是一顆粉色膠囊。
 * 這單有朋友最愛的料：頭像左上一顆星，旁邊放那樣料。讀屏由 live 區念，這裡 aria-hidden。
 */
export function DinoSushiGuestThanks({ order, line }: { order: Order; line: string }) {
  const customer = customerById(order.customerId);
  const favorite = order.toppings.find((id) => customer.favorites.includes(id));
  return (
    <p className={styles.thanks} data-customer={customer.id} data-favorite={favorite ? "true" : undefined} aria-hidden>
      <span className={styles.thanksFace}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 現成定裝照圓形裁切，不另生圖 */}
        <img src={customer.avatar} alt="" draggable={false} decoding="sync" />
        <Heart />
        {favorite ? <Star /> : null}
      </span>
      {favorite ? (
        <span className={styles.thanksFood}>
          <ToppingArt id={favorite} />
        </span>
      ) : null}
      <span className={styles.thanksLine}>{line}</span>
    </p>
  );
}
