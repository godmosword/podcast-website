import type { KartStats } from "../data/karts";
import { CheckpointSystem } from "./Checkpoint";
import type { KartState } from "./Kart";
import type { Track } from "./Track";

export type RacePhase = "countdown" | "racing" | "finished";

export type Racer = {
  id: string;
  name: string;
  isPlayer: boolean;
  state: KartState;
  stats: KartStats;
  meshId: string;
  checkpoint: number;
  prevProgress: number;
  lap: number;
  lapStartMs: number;
  lapTimes: number[];
  totalMs: number;
  finished: boolean;
  finishPos: number;
  aiSkill: number;
};

export type RaceSnapshot = {
  phase: RacePhase;
  countdown: number;
  racers: Racer[];
  playerPosition: number;
  totalLaps: number;
  raceMs: number;
  currentLapMs: number;
};

export type RaceFinish = {
  playerPos: number;
  totalMs: number;
  bestLapMs: number;
  lapTimes: number[];
};

export class RaceDirector {
  phase: RacePhase = "countdown";
  countdown = 3.2;
  raceMs = 0;
  private raceStartedAt = 0;
  private finishOrder = 0;
  readonly checkpoints: CheckpointSystem;
  readonly racers: Racer[];

  constructor(
    private track: Track,
    racers: Racer[],
  ) {
    this.racers = racers;
    this.checkpoints = new CheckpointSystem(track, 4);
  }

  fixedUpdate(dt: number, now: number): RaceFinish | null {
    if (this.phase === "countdown") {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.phase = "racing";
        this.raceStartedAt = now;
        for (const r of this.racers) r.lapStartMs = now;
      }
      return null;
    }

    if (this.phase !== "racing") return null;

    this.raceMs = now - this.raceStartedAt;

    for (const racer of this.racers) {
      if (racer.finished) continue;

      const { progress } = this.track.getProgress(racer.state.pos.x, racer.state.pos.z);
      const result = this.checkpoints.advance(
        racer.checkpoint,
        racer.lap,
        progress,
        racer.prevProgress,
      );

      if (result.lapComplete) {
        const lapMs = now - racer.lapStartMs;
        racer.lapTimes.push(lapMs);
        racer.lap = result.lap;
        racer.lapStartMs = now;
        racer.checkpoint = result.checkpoint;

        if (racer.lap >= this.track.def.laps) {
          racer.finished = true;
          racer.finishPos = ++this.finishOrder;
          racer.totalMs = this.raceMs;
        }
      } else {
        racer.checkpoint = result.checkpoint;
        racer.lap = result.lap;
      }

      racer.prevProgress = progress;
    }

    const player = this.racers.find((r) => r.isPlayer);
    if (player?.finished && this.racers.every((r) => r.finished || !r.isPlayer)) {
      this.phase = "finished";
    }
    if (this.racers.every((r) => r.finished)) {
      this.phase = "finished";
    }

    if (this.phase === "finished" && player) {
      const bestLap = player.lapTimes.length
        ? Math.min(...player.lapTimes)
        : this.raceMs;
      return {
        playerPos: player.finishPos || this.getPosition(player),
        totalMs: player.totalMs || this.raceMs,
        bestLapMs: bestLap,
        lapTimes: [...player.lapTimes],
      };
    }

    return null;
  }

  getPosition(racer: Racer): number {
    const sorted = [...this.racers].sort((a, b) => this.raceScore(b) - this.raceScore(a));
    return sorted.findIndex((r) => r.id === racer.id) + 1;
  }

  private raceScore(r: Racer): number {
    if (r.finished) return 1e9 + (100 - r.finishPos);
    const prog = this.track.getProgress(r.state.pos.x, r.state.pos.z).progress;
    return r.lap * 1000 + prog * 100 + (r.checkpoint + 1);
  }

  snapshot(now: number): RaceSnapshot {
    const player = this.racers.find((r) => r.isPlayer)!;
    const currentLapMs = this.phase === "racing" ? now - player.lapStartMs : 0;
    return {
      phase: this.phase,
      countdown: Math.max(0, Math.ceil(this.countdown)),
      racers: this.racers,
      playerPosition: this.getPosition(player),
      totalLaps: this.track.def.laps,
      raceMs: this.raceMs,
      currentLapMs,
    };
  }
}
