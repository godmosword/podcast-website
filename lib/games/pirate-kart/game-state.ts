import { Kart } from "./kart";
import { CX, CY, RY_OUT } from "./tracks";

// ── 遊戲狀態初始化 ──────────────────────────────────────────
export function createKarts(): Kart[] {
  const starts = [
    { x: CX, y: CY - RY_OUT + 18, angle: 0 },
    { x: CX - 14, y: CY - RY_OUT + 24, angle: 0.1 },
    { x: CX + 14, y: CY - RY_OUT + 24, angle: -0.1 },
    { x: CX, y: CY - RY_OUT + 32, angle: 0 },
  ];
  return [
    new Kart({
      id: "player",
      name: "小海盜",
      isPlayer: true,
      color: "#ef4444",
      sailColor: "#fecaca",
      ...starts[0],
    }),
    new Kart({
      id: "ai-1",
      name: "章魚船長",
      isPlayer: false,
      color: "#8b5cf6",
      sailColor: "#ddd6fe",
      skill: 0.55,
      ...starts[1],
    }),
    new Kart({
      id: "ai-2",
      name: "鯊魚水手",
      isPlayer: false,
      color: "#06b6d4",
      sailColor: "#cffafe",
      skill: 0.72,
      ...starts[2],
    }),
    new Kart({
      id: "ai-3",
      name: "鸚鵡舵手",
      isPlayer: false,
      color: "#22c55e",
      sailColor: "#bbf7d0",
      skill: 0.62,
      ...starts[3],
    }),
  ];
}
