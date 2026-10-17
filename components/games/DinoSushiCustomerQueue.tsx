"use client";

import { customerById, type CustomerId } from "@/lib/games/dino-sushi/customers";
import styles from "./DinoSushiKitchen.module.css";

type Props = {
  /** 今天 5 個位子（variety.seats），跟訂單同一順序。 */
  seats: readonly CustomerId[];
  /** 現在這單（0 起）。之前的位子打勾，這位放大。 */
  index: number;
};

function QueueCheck() {
  return (
    <svg viewBox="0 0 24 24" className={styles.queueCheck} aria-hidden focusable="false">
      <circle cx="12" cy="12" r="10" fill="#5fbf85" stroke="#fff" strokeWidth="2.4" />
      <path d="M7 12.5l3.2 3.2L17 8.8" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * 門口排隊：雨棚下把今天 5 個位子排成一列全身貼紙。
 * 只是看的，不是按鈕；點得到的仍是泡泡、砧板和托盤。
 * 自由做沒有客人，不畫這列。
 */
export function DinoSushiCustomerQueue({ seats, index }: Props) {
  return (
    <ol className={styles.queue} data-customer-queue aria-hidden>
      {seats.map((id, i) => {
        const customer = customerById(id);
        const state = i < index ? "done" : i === index ? "now" : "wait";
        return (
          <li key={`${i}-${id}`} className={styles.queueItem} data-state={state} data-customer={id}>
            <span className={styles.queueSticker}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 核准的黏土貼紙，只去背不重畫 */}
              <img className={styles.queueFace} src={customer.sticker} alt="" draggable={false} decoding="sync" />
            </span>
            {state === "done" ? <QueueCheck /> : null}
          </li>
        );
      })}
    </ol>
  );
}
