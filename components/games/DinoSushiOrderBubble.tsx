"use client";

import Icon from "@/components/ui/Icon";
import { BaseArt, ToppingArt } from "@/lib/games/dino-sushi/art";
import { customerById } from "@/lib/games/dino-sushi/customers";
import { orderAnnouncement, orderChecks, type Order, type OrderMatch } from "@/lib/games/dino-sushi/orders";
import type { Sushi } from "@/lib/games/dino-sushi/sushi";
import styles from "./DinoSushiKitchen.module.css";
import { TapButton } from "./DinoSushiPiece";

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

function Heart() {
  return (
    <svg viewBox="0 0 24 24" className={styles.guestHeart} aria-hidden focusable="false">
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
    <svg viewBox="0 0 24 24" className={styles.favStar} aria-hidden focusable="false">
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
 * 多多頭上的點餐泡泡：朋友的全身貼紙說是誰點的，圖案說想吃什麼，放對一樣就打勾。
 * 客人只點餐；壽司仍是多多吃。整顆泡泡可以點，再聽一次；左上角的小喇叭是提示。
 */
export function DinoSushiOrderBubble({ order, sushi, flash, index, total, onReplay }: Props) {
  const checks = orderChecks(sushi, order);
  const customer = customerById(order.customerId);
  const ready = checks.base && checks.toppings.every((item) => item.done);
  return (
    <div className={styles.bubbleWrap}>
      <div
        className={styles.bubble}
        role="img"
        aria-label={`第 ${index + 1} 單，共 ${total} 單。${orderAnnouncement(order)}`}
        data-customer={customer.id}
      >
        <span className={styles.guest} data-ready={ready ? "true" : undefined}>
          <span className={styles.guestName}>{customer.name}想吃</span>
          <span className={styles.guestFaceWrap}>
            <span className={styles.guestSticker}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 核准的黏土貼紙，只去背不重畫 */}
              <img className={styles.guestFace} src={customer.sticker} alt="" draggable={false} decoding="sync" />
            </span>
            {ready ? <Heart /> : null}
          </span>
        </span>
        <span className={styles.bubbleItems} data-order-items>
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
              data-favorite={customer.favorites.includes(id) ? "true" : undefined}
            >
              <ToppingArt id={id} />
              {customer.favorites.includes(id) ? <Star /> : null}
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
        <TapButton className={styles.replay} aria-label="再聽一次" onTap={onReplay}>
          <span className={styles.replayBadge} aria-hidden>
            <Icon name="volume-on" size={18} />
          </span>
        </TapButton>
      ) : null}
    </div>
  );
}
