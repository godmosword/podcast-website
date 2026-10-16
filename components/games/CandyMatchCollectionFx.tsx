"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { PieceArt } from "./CandyMatchPieceArt";
import type { BoardState } from "@/lib/games/candy-match/engine";
import { goalStatus, type CandyGoal, type CandyProgress } from "@/lib/games/candy-match/tasks";
import styles from "./CandyMatchPlay.module.css";

type Props = {
  boardRef: RefObject<HTMLDivElement | null>;
  board: BoardState;
  popping: ReadonlySet<number>;
  goals: readonly CandyGoal[];
  progress: CandyProgress;
  duration: number;
};

/** 每個未完成的收集目標最多飛兩台、整波最多六台；不以粒子數代表收集數。 */
export function collectionFlights(board: BoardState, popping: ReadonlySet<number>, goals: readonly CandyGoal[], progress: CandyProgress) {
  const flights: { cell: number; piece: number; goal: number }[] = [];
  goals.forEach((goal, index) => {
    if (goal.kind !== "collect" && goal.kind !== "collect-any") return;
    const remaining = goalStatus(goal, progress).remaining;
    let count = 0;
    for (const cell of popping) {
      const piece = board.pieces[cell];
      if (piece < 0 || (goal.kind === "collect" && piece !== goal.piece)) continue;
      if (count >= Math.min(2, remaining) || flights.length >= 6) break;
      flights.push({ cell, piece, goal: index });
      count++;
    }
  });
  return flights;
}

export function CandyMatchCollectionFx({ boardRef, board, popping, goals, progress, duration }: Props) {
  const layer = useRef<HTMLDivElement>(null);
  const flights = collectionFlights(board, popping, goals, progress);
  useLayoutEffect(() => {
    const root = boardRef.current?.closest('[data-screen="play"]');
    if (!root || !layer.current) return;
    const animations: Animation[] = [];
    for (const node of layer.current.querySelectorAll<HTMLElement>("[data-flight-cell]")) {
      const source = root.querySelector(`[data-cell="${node.dataset.flightCell}"]`);
      const target = root.querySelector(`[data-candy-goal="${node.dataset.flightGoal}"] [role="progressbar"]`);
      if (!source || !target || !node.animate) continue;
      const a = source.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      const from = `translate(${a.x + a.width / 2 - 16}px, ${a.y + a.height / 2 - 16}px)`;
      const to = `translate(${b.x + b.width / 2 - 16}px, ${b.y + b.height / 2 - 16}px)`;
      animations.push(node.animate([
        { transform: `${from} scale(1)`, opacity: 0.95 },
        { transform: `${to} scale(.5)`, opacity: 0.2 },
      ], { duration: Math.max(1, duration - 20), easing: "cubic-bezier(.3,.1,.6,1)", fill: "both" }));
    }
    const cancel = () => animations.forEach((animation) => animation.cancel());
    window.addEventListener("scroll", cancel, true);
    window.addEventListener("resize", cancel);
    return () => {
      cancel();
      window.removeEventListener("scroll", cancel, true);
      window.removeEventListener("resize", cancel);
    };
  }, [boardRef, popping, duration]);
  return createPortal(
    <div ref={layer} className={styles.collectionLayer} aria-hidden data-testid="candy-collection-fx">
      {flights.map((flight) => (
        <span key={`${flight.goal}:${flight.cell}`} data-flight-cell={flight.cell} data-flight-goal={flight.goal}>
          <PieceArt piece={flight.piece} size={32} />
        </span>
      ))}
    </div>, document.body,
  );
}
