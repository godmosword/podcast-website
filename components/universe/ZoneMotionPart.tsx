import type { CSSProperties } from "react";
import type { MotionPart } from "@/data/universe-zone-motion";
import styles from "./ZoneMotionPart.module.css";

type Props = {
  part: MotionPart;
  reduced: boolean;
  night: boolean;
  /** devMotion 且 enabled=false 時用色塊佔位 */
  usePlaceholder: boolean;
};

function motionClass(part: MotionPart, reduced: boolean): string | undefined {
  if (reduced) return undefined;
  switch (part.motion) {
    case "spin":
      return styles.spin;
    case "sway":
      return styles.sway;
    case "sweep":
      return styles.sweep;
    case "bob":
      return styles.bob;
    case "path":
      return styles.path;
    case "sprite":
      return styles.sprite;
  }
}

function partStyle(part: MotionPart, night: boolean): CSSProperties {
  const base = {
    "--delay": `${part.delayMs ?? 0}ms`,
  } as CSSProperties;

  const src = night && part.srcNight ? part.srcNight : part.src;

  switch (part.motion) {
    case "spin":
      return {
        ...base,
        "--period": `${part.periodMs}ms`,
        "--pivot-x": `${part.pivot.x * 100}%`,
        "--pivot-y": `${part.pivot.y * 100}%`,
      } as CSSProperties;
    case "sway":
      return {
        ...base,
        "--period": `${part.periodMs}ms`,
        "--amp-deg": `${part.amplitudeDeg}deg`,
        ...(part.pivot
          ? {
              "--pivot-x": `${part.pivot.x * 100}%`,
              "--pivot-y": `${part.pivot.y * 100}%`,
            }
          : {}),
      } as CSSProperties;
    case "sweep":
      return {
        ...base,
        "--period": `${part.periodMs}ms`,
        "--amp-deg": `${part.amplitudeDeg}deg`,
        "--pivot-x": `${part.pivot.x * 100}%`,
        "--pivot-y": `${part.pivot.y * 100}%`,
      } as CSSProperties;
    case "bob":
      return {
        ...base,
        "--period": `${part.periodMs}ms`,
        "--amp-px": `${part.amplitudePx}px`,
      } as CSSProperties;
    case "path":
      return {
        ...base,
        "--period": `${part.periodMs}ms`,
        "--path-d": `"${part.path}"`,
      } as CSSProperties;
    case "sprite": {
      const periodMs = (part.sprite.frames / part.sprite.fps) * 1000;
      return {
        ...base,
        "--frames": String(part.sprite.frames),
        "--sprite-period": `${periodMs}ms`,
        backgroundImage: `url(${src})`,
      } as CSSProperties;
    }
  }
}

function PlaceholderShape({ name }: { name: string }) {
  if (name === "wheel") return <div className={`${styles.placeholder} ${styles.placeholderWheel}`} />;
  if (name === "flags") return <div className={`${styles.placeholder} ${styles.placeholderFlags}`} />;
  if (name === "mascot-car") return <div className={`${styles.placeholder} ${styles.placeholderCar}`} />;
  return <div className={styles.placeholder} style={{ background: "#8884" }} />;
}

export default function ZoneMotionPart({ part, reduced, night, usePlaceholder }: Props) {
  const motion = motionClass(part, reduced);
  const style = partStyle(part, night);
  const className = [usePlaceholder ? undefined : styles.part, motion].filter(Boolean).join(" ");

  if (usePlaceholder) {
    return (
      <div className={motion} style={style} aria-hidden="true">
        <PlaceholderShape name={part.name} />
      </div>
    );
  }

  const src = night && part.srcNight ? part.srcNight : part.src;

  if (part.motion === "sprite") {
    return (
      <div
        className={[styles.part, styles.sprite, motion].filter(Boolean).join(" ")}
        style={style}
        aria-hidden="true"
        role="presentation"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={className}
      style={style}
      draggable={false}
      decoding="async"
    />
  );
}
