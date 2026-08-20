"use client";

import { useEffect, useRef } from "react";
import {
  clientRectToBox,
  collectNamedRects,
  type ProtoMapSample,
} from "@/lib/play-map-proto-metrics";
import { listCityPlayStats } from "@/lib/playground-city-stats";
import styles from "./ProtoCityGrid.module.css";

type ProtoCityGridProps = {
  onSelectCity: (next: string | null) => void;
  onSample: (sample: ProtoMapSample) => void;
};

function cityAriaLabel(row: {
  city: string;
  total: number;
  free: number;
  indoor: number;
}): string {
  const free = `免費 ${row.free}／${row.total}`;
  if (row.indoor === 0) return `選定${row.city}，${free}`;
  return `選定${row.city}，${free}，室內 ${row.indoor}／${row.total}`;
}

export default function ProtoCityGrid({
  onSelectCity,
  onSample,
}: ProtoCityGridProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rows = listCityPlayStats();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const container =
      root.closest("[data-testid='proto-viewport']") ?? root;

    const sample = () => {
      onSample({
        items: collectNamedRects(
          root,
          clientRectToBox(container.getBoundingClientRect()),
        ),
        westEdge: null,
        c2Unsolved: [],
      });
    };

    sample();
    const frame = window.requestAnimationFrame(sample);
    const Observer = window.ResizeObserver;
    const observer = Observer ? new Observer(sample) : null;
    observer?.observe(container);
    container.addEventListener("scroll", sample);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      container.removeEventListener("scroll", sample);
    };
  }, [onSample]);

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.grid}>
      {rows.map((row) => {
        const freeRatio = row.total === 0 ? 0 : row.free / row.total;
        const indoorRatio = row.total === 0 ? 0 : row.indoor / row.total;
        return (
          <button
            key={row.city}
            type="button"
            className={styles.card}
            data-proto-entrance
            data-city={row.city}
            aria-label={cityAriaLabel(row)}
            onClick={() => onSelectCity(row.city)}
          >
            <span className={styles.city}>{row.city}</span>
            <span className={styles.stat}>
              <span>
                免費 {row.free}／{row.total}
              </span>
              <span className={styles.bar} aria-hidden="true">
                <span
                  className={styles.barFill}
                  style={{ transform: `scaleX(${freeRatio})` }}
                />
              </span>
            </span>
            {row.indoor > 0 ? (
              <span className={styles.stat}>
                <span>
                  室內 {row.indoor}／{row.total}
                </span>
                <span className={styles.bar} aria-hidden="true">
                  <span
                    className={styles.barFill}
                    style={{ transform: `scaleX(${indoorRatio})` }}
                  />
                </span>
              </span>
            ) : null}
            <span className={styles.count}>{row.total} 處</span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
