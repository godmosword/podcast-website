import type { CSSProperties } from "react";
import { MAP_DECOR, type DecorItem } from "@/data/universe-decor";
import styles from "./MapDecorLayer.module.css";

type Props = {
  reduced: boolean;
  paused: boolean;
};

function motionClass(item: DecorItem, reduced: boolean): string | undefined {
  if (reduced) return undefined;
  if (item.motion === "bob") return styles.itemBob;
  if (item.motion === "path") return styles.itemPath;
  if (item.motion === "drift") return styles.itemDrift;
  return undefined;
}

function decorStyle(item: DecorItem): CSSProperties {
  const amp = `${item.size * 4}px`;
  const base = {
    "--period": `${item.periodMs}ms`,
    "--delay": `${item.delayMs ?? 0}ms`,
    "--amp": amp,
  } as CSSProperties;
  if (item.motion === "path") {
    return {
      ...base,
      "--travel": `${item.travel}px`,
    } as CSSProperties;
  }
  return base;
}

function Sailboat({ size }: { size: number }) {
  const s = 18 * size;
  return (
    <>
      <path
        d={`M ${-s * 0.5} ${s * 0.15} Q 0 ${s * 0.45} ${s * 0.5} ${s * 0.15} L ${s * 0.35} ${s * 0.35} L ${-s * 0.35} ${s * 0.35} Z`}
        fill="#c87840"
      />
      <path d={`M 0 ${-s * 0.55} L 0 ${s * 0.15} L ${s * 0.42} ${s * 0.05} Z`} fill="#f5f0e8" />
    </>
  );
}

function Buoy({ size }: { size: number }) {
  const s = 14 * size;
  return (
    <>
      <rect x={-s * 0.12} y={-s * 0.2} width={s * 0.24} height={s * 0.9} rx={s * 0.08} fill="#d94a4a" />
      <circle cx={0} cy={-s * 0.35} r={s * 0.28} fill="#f04a4a" />
    </>
  );
}

function Fish({ size }: { size: number }) {
  const s = 16 * size;
  return (
    <>
      <ellipse cx={0} cy={0} rx={s * 0.55} ry={s * 0.28} fill="#6aabcc" />
      <path d={`M ${s * 0.5} 0 L ${s * 0.85} ${-s * 0.22} L ${s * 0.85} ${s * 0.22} Z`} fill="#5a9cbc" />
    </>
  );
}

function Bird({ size }: { size: number }) {
  const s = 12 * size;
  return (
    <path
      d={`M ${-s} ${s * 0.15} Q ${-s * 0.35} ${-s * 0.35} 0 0 Q ${s * 0.35} ${-s * 0.35} ${s} ${s * 0.15}`}
      fill="none"
      stroke="#4a5568"
      strokeWidth={Math.max(1.5, s * 0.12)}
      strokeLinecap="round"
    />
  );
}

function DecorShape({ item }: { item: DecorItem }) {
  switch (item.kind) {
    case "sailboat":
      return <Sailboat size={item.size} />;
    case "buoy":
      return <Buoy size={item.size} />;
    case "fish":
      return <Fish size={item.size} />;
    case "bird":
      return <Bird size={item.size} />;
  }
}

function DecorItemGroup({ item, reduced }: { item: DecorItem; reduced: boolean }) {
  if (reduced && item.movingOnly) return null;

  const motion = motionClass(item, reduced);
  return (
    <g
      className={[styles.item, motion].filter(Boolean).join(" ")}
      style={decorStyle(item)}
      transform={`translate(${item.x} ${item.y})`}
    >
      <DecorShape item={item} />
    </g>
  );
}

/** 近水裝飾（帆船、浮標、魚）；回傳 SVG `<g>`，插入 scene 內橋之後。 */
export function MapDecorNearWater({ reduced, paused }: Props) {
  const items = MAP_DECOR.filter((d) => d.kind !== "bird");
  const rootClass = [styles.decor, paused ? styles.paused : ""].filter(Boolean).join(" ");
  return (
    <g className={rootClass} aria-hidden="true">
      {items.map((item) => (
        <DecorItemGroup key={item.id} item={item} reduced={reduced} />
      ))}
    </g>
  );
}

/** 鳥層（paint order 最高）；回傳 SVG `<g>`，排 scene 最後。 */
export function MapDecorBirds({ reduced, paused }: Props) {
  const items = MAP_DECOR.filter((d) => d.kind === "bird");
  const rootClass = [styles.decor, paused ? styles.paused : ""].filter(Boolean).join(" ");
  return (
    <g className={rootClass} aria-hidden="true">
      {items.map((item) => (
        <DecorItemGroup key={item.id} item={item} reduced={reduced} />
      ))}
    </g>
  );
}
