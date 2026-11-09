"use client";

import { PlateArt, SushiArt } from "@/lib/games/dino-sushi/art";
import { customerById } from "@/lib/games/dino-sushi/customers";
import type { Order } from "@/lib/games/dino-sushi/orders";
import type { Mood } from "@/lib/games/dino-sushi/reactions";
import type { Sushi } from "@/lib/games/dino-sushi/sushi";
import type { ServePhase } from "./useDinoSushiPlay";
import styles from "./DinoSushiKitchen.module.css";

function Heart({ n }: { n: 1 | 2 }) {
  return (
    <svg viewBox="0 0 24 24" className={styles.seatHeart} data-n={n} aria-hidden focusable="false">
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
 * 點餐時坐在櫃台的這位客人（2026-11-08 起整單都在，不再只在吃的時候出現）。
 * 換人時 key 跟著單號，新客人從右邊滑進座位。吃到的那一拍頭上冒兩顆愛心（最愛再加星星），比多多的反應大。
 * 吃的時候貼紙壓扁一下；芥末先搖一搖、冒小火，再轉成愛心。只是看的，不是按鈕。
 */
export function DinoSushiCustomerSeat({
  order,
  phase,
  mood,
  reducedMotion,
}: {
  order: Order;
  phase: ServePhase;
  /** 反應那一拍的表情；還沒吃到就是 null。 */
  mood: Mood | null;
  reducedMotion: boolean;
}) {
  const customer = customerById(order.customerId);
  const favorite = order.toppings.some((id) => customer.favorites.includes(id));
  const happy = phase === "react" && mood !== null && mood !== "look";
  return (
    <div
      className={styles.seat}
      data-customer-seat
      data-customer={customer.id}
      data-phase={phase}
      data-mood={happy ? mood : undefined}
      data-reduced={reducedMotion ? "true" : undefined}
      aria-hidden
    >
      <span className={styles.seatFace}>
        <span className={styles.seatSticker}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 核准的黏土貼紙，只去背不重畫 */}
          <img src={customer.sticker} alt="" draggable={false} decoding="sync" />
        </span>
        {happy ? <Heart n={1} /> : null}
        {happy ? <Heart n={2} /> : null}
        {happy && favorite ? <Star /> : null}
        {happy && mood === "puff" ? <span className={styles.seatPuff} /> : null}
      </span>
    </div>
  );
}

/**
 * 送給客人的那一盤：從多多面前的帶子起點冒出來，沿帶子送到客人座位，客人咬一口。
 * 位置與距離都用舞台的 CSS 變數算（--lane-dx），跟座位、多多同一組。
 */
export function DinoSushiServeLane({ sushi, phase }: { sushi: Sushi; phase: ServePhase }) {
  return (
    <span className={styles.lanePlate} data-phase={phase} aria-hidden>
      {phase === "react" ? null : (
        <span className={styles.laneSushi} data-phase={phase}>
          <SushiArt sushi={sushi} />
        </span>
      )}
      <PlateArt />
    </span>
  );
}
