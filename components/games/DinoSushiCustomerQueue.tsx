"use client";

import { customerById, type CustomerId } from "@/lib/games/dino-sushi/customers";
import styles from "./DinoSushiKitchen.module.css";

type Props = {
  /** 今天 5 個位子（variety.seats），跟訂單同一順序。 */
  seats: readonly CustomerId[];
  /** 現在這單（0 起）。這位正在點或坐著吃，不排進隊伍。 */
  index: number;
};

/**
 * 門口排隊：雨棚下只排還沒輪到的全身貼紙。
 * 正在點餐、坐在櫃台旁，以及已經做完的人，都不在這列。
 * 下一位大一號，後面的小一號。最後一單沒有人等，就不畫。
 * 只是看的，不是按鈕；點得到的仍是泡泡、砧板和托盤。
 * 自由做沒有客人，不畫這列。
 */
export function DinoSushiCustomerQueue({ seats, index }: Props) {
  const waiting = seats.slice(index + 1);
  if (waiting.length === 0) return null;
  return (
    <ol className={styles.queue} data-customer-queue aria-hidden>
      {waiting.map((id, i) => {
        const customer = customerById(id);
        const state = i === 0 ? "next" : "wait";
        return (
          <li key={`${index + 1 + i}-${id}`} className={styles.queueItem} data-state={state} data-customer={id}>
            <span className={styles.queueSticker}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 核准的黏土貼紙，只去背不重畫 */}
              <img className={styles.queueFace} src={customer.sticker} alt="" draggable={false} decoding="sync" />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
