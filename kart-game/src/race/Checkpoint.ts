import type { Track } from "./Track";

/** 沿賽道 progress 切分的檢查點（P2）。 */
export class CheckpointSystem {
  readonly thresholds: number[];
  readonly count: number;

  constructor(
    private track: Track,
    segments = 4,
  ) {
    this.count = segments;
    this.thresholds = Array.from({ length: segments }, (_, i) => (i + 1) / segments);
    this.thresholds[this.thresholds.length - 1] = 0.98;
  }

  /** 回傳新檢查點索引（-1 表示起點）、是否完成一圈。 */
  advance(
    lastCheckpoint: number,
    lap: number,
    progress: number,
    prevProgress: number,
  ): { checkpoint: number; lap: number; lapComplete: boolean } {
    const nextIdx = lastCheckpoint + 1;
    if (nextIdx >= this.count) {
      return { checkpoint: lastCheckpoint, lap, lapComplete: false };
    }

    const target = this.thresholds[nextIdx];
    const crossed = crossedProgress(prevProgress, progress, target);

    if (crossed || Math.abs(progress - target) < 0.03) {
      if (nextIdx === this.count - 1) {
        return { checkpoint: -1, lap: lap + 1, lapComplete: true };
      }
      return { checkpoint: nextIdx, lap, lapComplete: false };
    }

    return { checkpoint: lastCheckpoint, lap, lapComplete: false };
  }

  distanceToNext(progress: number, checkpoint: number): number {
    const nextIdx = checkpoint + 1;
    const target = nextIdx >= this.count ? 1 : this.thresholds[nextIdx];
    let d = target - progress;
    if (d < 0) d += 1;
    return d * this.track.length;
  }
}

function crossedProgress(a: number, b: number, t: number): boolean {
  if (a <= b) return a < t && t <= b;
  return a < t || t <= b;
}
