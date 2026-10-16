"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { freshColumns } from "@/lib/games/dino-sushi/fresh-layout";

export type FreshGrid = { columns: number; rows: number };

const FALLBACK: FreshGrid = { columns: 5, rows: 1 };

function readNumber(style: CSSStyleDeclaration, name: string, fallback: number): number {
  const n = parseFloat(style.getPropertyValue(name));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * 新貼紙格放得下幾欄幾列。寬度量格子本身；格子大小、間距、列數讀 CSS 變數
 * （`--fresh-thumb`、`--fresh-gap`、`--fresh-rows`，由媒體查詢決定），版面規則只寫在 CSS 一處。
 * 視窗變高變矮時寬度不一定變，所以 resize 也重量一次。
 */
export function useFreshGrid(ref: RefObject<HTMLElement | null>): FreshGrid {
  const [grid, setGrid] = useState<FreshGrid>(FALLBACK);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const style = getComputedStyle(el);
      const columns = freshColumns(
        el.clientWidth,
        readNumber(style, "--fresh-thumb", 56),
        readNumber(style, "--fresh-gap", 8),
      );
      const rows = Math.max(1, Math.round(readNumber(style, "--fresh-rows", 1)));
      setGrid((prev) => (prev.columns === columns && prev.rows === rows ? prev : { columns, rows }));
    };
    measure();
    window.addEventListener("resize", measure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(el);
    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [ref]);

  return grid;
}
