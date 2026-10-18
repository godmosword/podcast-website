"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { dinoSushiSrc } from "./asset-src";
import type { Sushi } from "./sushi";
import type { BaseId, ToppingId, ToppingKind } from "./toppings";

/**
 * 《多多壽司屋》食材與店面用主人核准的黏土 WebP（不重畫、不改檔），畫面讀縮小副本（見 asset-src）。
 * 壽司仍是程式分層：飯底一張、料依層數疊上去。
 * 手捲多一張前層：飯底、配料、再蓋上海苔前片，料才像塞在飯口裡。
 */

/* eslint-disable @next/next/no-img-element -- 原檔 WebP，不走 next/image 轉檔 */

export const SHOP_SRC = {
  wall: dinoSushiSrc("shop/wall.webp"),
  awning: dinoSushiSrc("shop/awning.webp"),
  lantern: dinoSushiSrc("shop/lantern.webp"),
  window: dinoSushiSrc("shop/window.webp"),
  counter: dinoSushiSrc("shop/counter.webp"),
  belt: dinoSushiSrc("shop/belt.webp"),
  plate: dinoSushiSrc("shop/plate.webp"),
  plateGold: dinoSushiSrc("shop/plate-gold.webp"),
  dome: dinoSushiSrc("shop/dome.webp"),
  prepplate: dinoSushiSrc("shop/prepplate.webp"),
  trayNeutral: dinoSushiSrc("shop/tray-neutral.webp"),
  traySweet: dinoSushiSrc("shop/tray-sweet.webp"),
  trayWasabi: dinoSushiSrc("shop/tray-wasabi.webp"),
} as const;

const BASE_SRC: Record<BaseId, string> = {
  nigiri: dinoSushiSrc("food/nigiri.webp"),
  gunkan: dinoSushiSrc("food/gunkan.webp"),
  temaki: dinoSushiSrc("food/temaki.webp"),
};

/** 手捲海苔前片，跟飯底同尺寸；畫布高 34.5% 以上是透明的。 */
const TEMAKI_FRONT_SRC = dinoSushiSrc("food/temaki-front.webp");

const TOPPING_SRC: Record<ToppingId, string> = {
  tamago: dinoSushiSrc("food/tamago.webp"),
  shrimp: dinoSushiSrc("food/shrimp.webp"),
  crab: dinoSushiSrc("food/crab.webp"),
  corn: dinoSushiSrc("food/corn.webp"),
  cucumber: dinoSushiSrc("food/cucumber.webp"),
  tuna: dinoSushiSrc("food/tuna.webp"),
  floss: dinoSushiSrc("food/floss.webp"),
  salmon: dinoSushiSrc("food/salmon.webp"),
  avocado: dinoSushiSrc("food/avocado.webp"),
  strawberry: dinoSushiSrc("food/strawberry.webp"),
  pudding: dinoSushiSrc("food/pudding.webp"),
  wasabi: dinoSushiSrc("food/wasabi.webp"),
};

/** 貼紙書的剪影要拿原圖當遮罩，所以讓外面拿得到圖檔路徑。 */
export function baseSrc(id: BaseId): string {
  return BASE_SRC[id];
}

export function toppingSrc(id: ToppingId): string {
  return TOPPING_SRC[id];
}

/** 飯圖原生寬高比，組裝舞台跟這張圖同比例，料的百分比才對得準。 */
const BASE_ASPECT: Record<BaseId, string> = {
  nigiri: "581 / 416",
  gunkan: "745 / 684",
  temaki: "511 / 986",
};

/** 單層料落在飯上的中心（舞台百分比）與寬度。手捲另見 TEMAKI_PLACE。 */
const ANCHOR: Record<Exclude<BaseId, "temaki">, { x: number; y: number; w: number }> = {
  nigiri: { x: 50, y: 44, w: 86 },
  gunkan: { x: 50, y: 32, w: 68 },
};

/**
 * 手捲：寬、高都是舞台百分比。料坐在飯口上、往上冒出筒口，下緣塞進海苔前層（從高度 34.5% 蓋下來），
 * 像真的手捲一樣一眼看得到包了什麼；兩三樣時往左右散開，可以略超出筒身。
 * 芥末是一小坨，不跟其他料一樣大；玉子、肉鬆不能太寬，三樣時才不會擋住中間那樣。
 */
const TEMAKI_PLACE: Record<ToppingId, { w: number; y: number }> = {
  tamago: { w: 84, y: 26 },
  shrimp: { w: 98, y: 27 },
  crab: { w: 98, y: 25 },
  corn: { w: 98, y: 23 },
  cucumber: { w: 84, y: 25 },
  tuna: { w: 84, y: 23 },
  floss: { w: 88, y: 24 },
  salmon: { w: 68, y: 27 },
  avocado: { w: 72, y: 26 },
  strawberry: { w: 68, y: 27 },
  pudding: { w: 90, y: 25 },
  wasabi: { w: 60, y: 25 },
};

/**
 * 手捲三樣料時，中間那格（疊在最後面、抬到兩側上方）的個別調整。
 * 布丁（彩蛋）：照一般抬高會整顆連綠盤冒出來；沉到 y 20%、少斜一點，只露焦糖頂和一截黃色布丁身，
 * 盤子藏在兩側的料後面。只露焦糖在手機上會被看成巧克力，所以留一截布丁身。
 */
const TEMAKI_MIDDLE: Partial<Record<ToppingId, { dy: number; rot: number }>> = {
  pudding: { dy: -5, rot: -10 },
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

type Spot = { x: number; y: number; w: number; rot?: number };

function layerSpots(base: BaseId, toppings: readonly ToppingId[]): Spot[] {
  if (base === "temaki") {
    const n = toppings.length;
    const fan =
      n <= 1
        ? [{ x: 50, dy: 0, mul: 1, rot: -17 }]
        : n === 2
          ? [
              { x: 36, dy: -1, mul: 0.8, rot: -22 },
              { x: 64, dy: 2, mul: 0.8, rot: -12 },
            ]
          : [
              /* 中間那樣疊在最後面：抬高到兩側料的上方，才不會整個被擋住 */
              { x: 50, dy: -12, mul: 0.72, rot: -18 },
              { x: 30, dy: 3, mul: 0.68, rot: -26 },
              { x: 70, dy: 2, mul: 0.68, rot: -8 },
            ];
    return toppings.map((id, i) => {
      const place = TEMAKI_PLACE[id];
      const middle = n === 3 && i === 0 ? TEMAKI_MIDDLE[id] : undefined;
      const fanSpot = middle ? { ...fan[0]!, ...middle } : (fan[i] ?? fan[0]!);
      return {
        x: fanSpot.x,
        y: place.y + fanSpot.dy,
        w: place.w * fanSpot.mul,
        rot: fanSpot.rot,
      };
    });
  }
  const a = ANCHOR[base];
  const count = toppings.length;
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
  TEMAKI_FRONT_SRC,
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
  const temaki = sushi.base === "temaki";
  const spots = layerSpots(sushi.base, sushi.toppings);
  const layers = sushi.toppings
    .map((id, i) => {
      const fit = TOPPING_FIT[id];
      const spot = spots[i] ?? spots[0]!;
      /* 用「第幾個同樣的料」當 key：拿掉一層或滿了擠掉最舊那層時，留下來的不重掛、不重播落下動畫，只有新的那層會彈 */
      const nth = sushi.toppings.slice(0, i).filter((t) => t === id).length;
      /* 手捲的位置與大小已經寫在 TEMAKI_PLACE，不再套握壽司那組 dy 與縮放。 */
      return {
        id,
        key: `${id}-${nth}`,
        x: spot.x,
        y: temaki ? spot.y : spot.y + fit.dy,
        w: temaki ? spot.w : spot.w * fit.scale,
        rot: spot.rot,
      };
    });
  /*
   * 疊放順序用 z-index，DOM 照放料的順序不重排：換位置時重排 DOM 會把留下來的料搬走，
   * 瀏覽器會讓被搬的那層重播落下動畫。越下面（y 越大）越前面；海苔前層蓋在所有料上面。
   */
  const depth = [...layers].sort((a, b) => a.y - b.y).map((l) => l.key);
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
        isolation: "isolate",
        ...style,
      }}
    >
      <ClayImg
        src={BASE_SRC[sushi.base]}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
      />
      {layers.map(({ id, key, x, y, w, rot }) => (
        <span
          key={key}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            width: `${w}%`,
            zIndex: depth.indexOf(key) + 1,
            transform: rot ? `translate(-50%, -50%) rotate(${rot}deg)` : "translate(-50%, -50%)",
          }}
        >
          <Layer className={layerClassName}>
            <ClayImg src={TOPPING_SRC[id]} style={{ display: "block", width: "100%", height: "auto" }} />
          </Layer>
        </span>
      ))}
      {temaki ? (
        <ClayImg
          src={TEMAKI_FRONT_SRC}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            zIndex: layers.length + 1,
          }}
        />
      ) : null}
    </span>
  );
}

function Layer({ className, children }: { className?: string; children: ReactNode }) {
  return className ? <span className={className} style={{ display: "block" }}>{children}</span> : children;
}

/** 迴轉壽司盤的釉色。薄荷綠是原圖，粉、藍、紫用濾鏡轉。金盤是另一張核准的黏土圖。 */
export type PlateTone = "blue" | "gold" | "pink" | "mint" | "lavender";

const PLATE_FILTER: Record<Exclude<PlateTone, "gold">, string | undefined> = {
  mint: undefined,
  blue: "hue-rotate(42deg) saturate(1.2)",
  pink: "hue-rotate(158deg) saturate(1.35) brightness(1.04)",
  lavender: "hue-rotate(96deg) saturate(1.05)",
};

type PlateProps = ArtProps & {
  gold?: boolean;
  tone?: PlateTone;
  /** 金盤的小提示章：只換色，不掃光、不放星。 */
  plain?: boolean;
};

/**
 * 迴轉壽司盤。gold＝一次做對的金盤（核准的黏土圖，盤緣星星在圖上）；
 * tone 給迴轉帶上的裝飾盤。每一種盤的 DOM 都是一張圖，填滿同一個盤框。
 * plain 仍接受：提示章跟疊盤用同一張圖，不再另外畫光澤或星星。
 */
export function PlateArt({ gold = false, tone, plain = false, size, style }: PlateProps) {
  const plateTone: PlateTone = tone ?? (gold ? "gold" : "blue");
  if (plateTone === "gold") {
    return (
      <img
        src={SHOP_SRC.plateGold}
        alt=""
        draggable={false}
        decoding="sync"
        data-gold-plate=""
        data-plain={plain ? "true" : undefined}
        style={{ display: "block", objectFit: "contain", ...box(size), ...style }}
      />
    );
  }
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
