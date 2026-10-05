import type { DirtyRect } from "./tools";
export type ColoringPatch = {
  rect: DirtyRect;
  pixels: Uint8ClampedArray<ArrayBuffer>;
};
/** Patch history counts both stacks against one fixed byte budget. */
export class ColoringHistory {
  undo: ColoringPatch[] = [];
  redo: ColoringPatch[] = [];
  constructor(
    readonly maxBytes = 64 * 1024 * 1024,
    readonly maxSteps = 24,
  ) {}
  get bytes() {
    return [...this.undo, ...this.redo].reduce(
      (n, p) => n + p.pixels.byteLength,
      0,
    );
  }
  push(p: ColoringPatch) {
    this.redo = [];
    this.undo.push(p);
    while (this.bytes > this.maxBytes || this.undo.length > this.maxSteps)
      this.undo.shift();
  }
  clear() {
    this.undo = [];
    this.redo = [];
  }
  take(
    direction: "undo" | "redo",
    capture: (rect: DirtyRect) => ColoringPatch,
  ): ColoringPatch | undefined {
    const from = this[direction],
      to = this[direction === "undo" ? "redo" : "undo"];
    const p = from.pop();
    if (!p) return;
    to.push(capture(p.rect));
    return p;
  }
}
