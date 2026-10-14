"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import type { Sushi } from "./sushi";
import type { BaseId, ToppingId, ToppingKind } from "./toppings";

/**
 * 《多多壽司屋》食材與店面用主人核准的黏土 WebP（不重畫、不改檔）。
 * 壽司仍是程式分層：飯底一張、料依層數疊上去。
 */

/* eslint-disable @next/next/no-img-element -- 原檔 WebP，不走 next/image 轉檔 */

const SHOP = "/games/v2/dino-sushi/shop";
const FOOD = "/games/v2/dino-sushi/food";

export const SHOP_SRC = {
  wall: `${SHOP}/wall.webp`,
  awning: `${SHOP}/awning.webp`,
  lantern: `${SHOP}/lantern.webp`,
  sign: `${SHOP}/sign.webp`,
  window: `${SHOP}/window.webp`,
  counter: `${SHOP}/counter.webp`,
  belt: `${SHOP}/belt.webp`,
  plate: `${SHOP}/plate.webp`,
  dome: `${SHOP}/dome.webp`,
  prepplate: `${SHOP}/prepplate.webp`,
  trayNeutral: `${SHOP}/tray-neutral.webp`,
  traySweet: `${SHOP}/tray-sweet.webp`,
  trayWasabi: `${SHOP}/tray-wasabi.webp`,
} as const;

const BASE_SRC: Record<BaseId, string> = {
  nigiri: `${FOOD}/nigiri.webp`,
  gunkan: `${FOOD}/gunkan.webp`,
  temaki: `${FOOD}/temaki.webp`,
};

const TOPPING_SRC: Record<ToppingId, string> = {
  tamago: `${FOOD}/tamago.webp`,
  shrimp: `${FOOD}/shrimp.webp`,
  crab: `${FOOD}/crab.webp`,
  corn: `${FOOD}/corn.webp`,
  cucumber: `${FOOD}/cucumber.webp`,
  tuna: `${FOOD}/tuna.webp`,
  floss: `${FOOD}/floss.webp`,
  salmon: `${FOOD}/salmon.webp`,
  avocado: `${FOOD}/avocado.webp`,
  strawberry: `${FOOD}/strawberry.webp`,
  pudding: `${FOOD}/pudding.webp`,
  wasabi: `${FOOD}/wasabi.webp`,
};

/** 飯圖原生寬高比，組裝舞台跟這張圖同比例，料的百分比才對得準。 */
const BASE_ASPECT: Record<BaseId, string> = {
  nigiri: "581 / 416",
  gunkan: "745 / 684",
  temaki: "716 / 622",
};

/** 單層料落在飯上的中心（舞台百分比）與寬度。手捲開口在上、軍艦開口在上緣、握壽司料蓋在飯面。 */
const ANCHOR: Record<BaseId, { x: number; y: number; w: number }> = {
  nigiri: { x: 50, y: 44, w: 86 },
  gunkan: { x: 50, y: 32, w: 68 },
  temaki: { x: 50, y: 22, w: 58 },
};

/** 每種料的圖形差很多：條狀蓋滿、方塊與高的甜點要縮小，才不會蓋過飯。 */
const TOPPING_FIT: Record<ToppingId, { scale: number; dy: number }> = {
  tamago: { scale: 0.84, dy: 4 },
  shrimp: { scale: 0.9, dy: 1 },
  crab: { scale: 0.96, dy: 5 },
  corn: { scale: 0.66, dy: 2 },
  cucumber: { scale: 0.72, dy: 0 },
  tuna: { scale: 0.52, dy: 2 },
  floss: { scale: 0.76, dy: 1 },
  salmon: { scale: 0.94, dy: 3 },
  avocado: { scale: 0.8, dy: 2 },
  strawberry: { scale: 0.46, dy: -2 },
  pudding: { scale: 0.42, dy: -4 },
  wasabi: { scale: 0.36, dy: 8 },
};

type Spot = { x: number; y: number; w: number };

function layerSpots(base: BaseId, count: number): Spot[] {
  const a = ANCHOR[base];
  if (count <= 1) return [{ x: a.x, y: a.y, w: a.w }];
  if (count === 2) {
    return [
      { x: a.x - 14, y: a.y + 3, w: a.w * 0.74 },
      { x: a.x + 14, y: a.y + 1, w: a.w * 0.74 },
    ];
  }
  return [
    { x: a.x, y: a.y - 8, w: a.w * 0.58 },
    { x: a.x - 16, y: a.y + 6, w: a.w * 0.62 },
    { x: a.x + 16, y: a.y + 5, w: a.w * 0.62 },
  ];
}

export const DINO_SUSHI_CLAY_SRCS: readonly string[] = [
  ...Object.values(SHOP_SRC),
  ...Object.values(BASE_SRC),
  ...Object.values(TOPPING_SRC),
];

/** 標題頁就先解碼店面與食材，進廚房才不會閃一下。 */
export function useDinoSushiClayPreload() {
  useEffect(() => {
    const images = DINO_SUSHI_CLAY_SRCS.map((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      return img;
    });
    return () => {
      for (const img of images) img.src = "";
    };
  }, []);
}

export function traySrc(kind: ToppingKind): string {
  if (kind === "sweet") return SHOP_SRC.traySweet;
  if (kind === "wasabi") return SHOP_SRC.trayWasabi;
  return SHOP_SRC.trayNeutral;
}

type ArtProps = { size?: number | string; style?: CSSProperties };

function box(size?: number | string): CSSProperties {
  if (size == null) return { width: "100%", height: "100%" };
  const v = typeof size === "number" ? `${size}px` : size;
  return { width: v, height: v };
}

function ClayImg({ src, style }: { src: string; style?: CSSProperties }) {
  return <img src={src} alt="" draggable={false} decoding="sync" style={style} />;
}

/** 托盤／料位／泡泡用的單一料。 */
export function ToppingArt({ id, size, style }: ArtProps & { id: ToppingId }) {
  return (
    <ClayImg
      src={TOPPING_SRC[id]}
      style={{ display: "block", objectFit: "contain", ...box(size), ...style }}
    />
  );
}

/** 選飯鈕與點餐泡泡用的飯型。 */
export function BaseArt({ id, size, style }: ArtProps & { id: BaseId }) {
  return (
    <ClayImg
      src={BASE_SRC[id]}
      style={{ display: "block", objectFit: "contain", ...box(size), ...style }}
    />
  );
}

/**
 * 砧板上、迴轉帶上、飛進嘴裡的完整壽司。沒選飯時什麼都不畫。
 * layerClassName 掛在每一層料的內層（外層 transform 只負責定位）。
 * flat：迴轉帶上的裝飾壽司，樣式可以再退一點。
 */
export function SushiArt({
  sushi,
  size,
  style,
  layerClassName,
  flat = false,
}: ArtProps & { sushi: Sushi; layerClassName?: string; flat?: boolean }) {
  if (!sushi.base) return null;
  const spots = layerSpots(sushi.base, sushi.toppings.length);
  const layers = sushi.toppings
    .map((id, i) => {
      const fit = TOPPING_FIT[id];
      const spot = spots[i] ?? spots[0]!;
      return { id, i, x: spot.x, y: spot.y + fit.dy, w: spot.w * fit.scale };
    })
    .sort((a, b) => a.y - b.y);
  return (
    <span
      data-sushi=""
      data-base={sushi.base}
      data-flat={flat ? "true" : undefined}
      style={{
        position: "relative",
        display: "block",
        ...(size != null ? { width: typeof size === "number" ? `${size}px` : size } : null),
        aspectRatio: BASE_ASPECT[sushi.base],
        ...style,
      }}
    >
      <ClayImg
        src={BASE_SRC[sushi.base]}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
      />
      {layers.map(({ id, i, x, y, w }) => (
        <span
          key={`${id}-${i}`}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            width: `${w}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <Layer className={layerClassName}>
            <ClayImg src={TOPPING_SRC[id]} style={{ display: "block", width: "100%", height: "auto" }} />
          </Layer>
        </span>
      ))}
    </span>
  );
}

function Layer({ className, children }: { className?: string; children: ReactNode }) {
  return className ? <span className={className} style={{ display: "block" }}>{children}</span> : children;
}

/** 迴轉壽司盤的釉色。原圖是薄荷綠，其他顏色用濾鏡轉，不另做檔。 */
export type PlateTone = "blue" | "gold" | "pink" | "mint" | "lavender";

const PLATE_FILTER: Record<PlateTone, string | undefined> = {
  mint: undefined,
  blue: "hue-rotate(42deg) saturate(1.2)",
  pink: "hue-rotate(158deg) saturate(1.35) brightness(1.04)",
  lavender: "hue-rotate(96deg) saturate(1.05)",
  gold: "sepia(0.8) saturate(2.8) hue-rotate(8deg) brightness(1.05)",
};

/** 迴轉壽司盤。gold＝一次做對的金邊盤；tone 給迴轉帶上的裝飾盤。 */
export function PlateArt({ gold = false, tone, size, style }: ArtProps & { gold?: boolean; tone?: PlateTone }) {
  const plateTone: PlateTone = tone ?? (gold ? "gold" : "blue");
  const filter = PLATE_FILTER[plateTone];
  return (
    <ClayImg
      src={SHOP_SRC.plate}
      style={{
        display: "block",
        objectFit: "contain",
        ...box(size),
        ...(filter ? { filter } : null),
        ...style,
      }}
    />
  );
}

/* eslint-enable @next/next/no-img-element */
