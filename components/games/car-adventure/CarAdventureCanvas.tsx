"use client";

import { useEffect, useRef, type RefObject } from "react";
import { usePixelGameSurface } from "@/components/games/PixelGameCanvas";
import { useFixedGameLoop } from "@/lib/gamekit/react/useFixedGameLoop";
import type { JuiceController } from "@/lib/gamekit/runtime/juice";
import {
  drawAdventureHud,
  renderAdventureWorld,
} from "@/lib/games/car-adventure/render";
import {
  RENDER_SX,
  RENDER_SY,
  type GameState,
  type Status,
} from "@/lib/games/car-adventure/types";

type CarAdventureCanvasProps = {
  game: RefObject<GameState | null>;
  statusRef: RefObject<Status>;
  juiceRef: RefObject<JuiceController>;
  reducedRef: RefObject<boolean>;
  reset: () => void;
  update: (g: GameState, dt: number) => void;
};

/** 像素畫布迴圈：只負責 fixed update + present。 */
export function CarAdventureCanvas({
  game,
  statusRef,
  juiceRef,
  reducedRef,
  reset,
  update,
}: CarAdventureCanvasProps) {
  const { rendererRef, present } = usePixelGameSurface();
  const skipPhysicsRef = useRef(false);

  useEffect(() => {
    reset();
  }, [reset]);

  useFixedGameLoop(
    {
      fixedUpdate: (dt) => {
        const g = game.current;
        if (!g || statusRef.current !== "playing" || skipPhysicsRef.current) {
          skipPhysicsRef.current = false;
          return;
        }
        g.prevPlayer = { x: g.player.x, y: g.player.y };
        update(g, dt);
      },
      render: (alpha) => {
        const renderer = rendererRef.current;
        const g = game.current;
        if (!renderer || !g) return;

        const reduced = reducedRef.current;
        const j = reduced
          ? { shakeX: 0, shakeY: 0, skipLogic: false }
          : juiceRef.current.update(1 / 60);
        if (j.skipLogic) skipPhysicsRef.current = true;

        g.renderAlpha = alpha;
        const ctx = renderer.context;
        renderer.clear("#8fd3ff");
        ctx.save();
        ctx.scale(RENDER_SX, RENDER_SY);
        ctx.translate(j.shakeX / RENDER_SX, j.shakeY / RENDER_SY);
        renderAdventureWorld(ctx, g, reduced);
        if (!reduced) juiceRef.current.draw(ctx);
        ctx.restore();
        drawAdventureHud(ctx, g);
        present();
      },
    },
    true,
  );

  return null;
}
