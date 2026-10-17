"use client";

import { customerById } from "@/lib/games/dino-sushi/customers";
import type { Order } from "@/lib/games/dino-sushi/orders";
import styles from "./DinoSushiKitchen.module.css";

function Heart() {
  return (
    <svg viewBox="0 0 24 24" className={styles.seatHeart} aria-hidden focusable="false">
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
    <svg viewBox="0 0 24 24" className={styles.seatStar} aria-hidden focusable="false">
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
 * 多多吃的時候泡泡收起，這位客人改坐在櫃台旁，愛心（有最愛的料再加星星）表示還在。
 * 只是看的，不是按鈕。
 */
export function DinoSushiCustomerSeat({ order }: { order: Order }) {
  const customer = customerById(order.customerId);
  const favorite = order.toppings.some((id) => customer.favorites.includes(id));
  return (
    <div className={styles.seat} data-customer-seat data-customer={customer.id} aria-hidden>
      <span className={styles.seatFace}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 現成定裝照圓形裁切，不另生圖 */}
        <img src={customer.avatar} alt="" draggable={false} decoding="sync" />
        <Heart />
        {favorite ? <Star /> : null}
      </span>
    </div>
  );
}
