import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { ACTIVE_CLOCK_GLOBAL, ActiveTimeline, MAX_FRAME_DELTA_MS, type ActiveClock } from "./active-clock";
import { ARRIVAL_SECONDS, driveProgress, motionPhase, type MotionPhase } from "./config";

type ClockHost = typeof globalThis & { [ACTIVE_CLOCK_GLOBAL]?: unknown };

/** A clock the test advances by hand; nothing here waits on real time. */
function fakeClock() {
  let nowMs = 0;
  const clock: ActiveClock = {
    now: () => nowMs,
    setInterval: () => 0,
    clearInterval: () => {},
  };
  return { clock, advance: (ms: number) => { nowMs += ms; }, get now() { return nowMs; } };
}

/**
 * Play the signature timeline at a fixed frame rate and record the wall-clock
 * second at which each phase first appears. The whole point of the regression
 * is that these numbers must not move when the frame rate does.
 */
function playAtFps(fps: number, untilSeconds: number) {
  const host = fakeClock();
  const timeline = new ActiveTimeline(host.clock);
  const frameMs = 1000 / fps;
  const firstSeenAt = new Map<MotionPhase, number>();
  let phase: MotionPhase | null = null;
  let maxDrift = 0;
  // First frame only opens the span, exactly like the first rendered frame.
  timeline.advance(ARRIVAL_SECONDS);
  while (host.now < untilSeconds * 1000) {
    host.advance(frameMs);
    timeline.advance(ARRIVAL_SECONDS);
    maxDrift = Math.max(maxDrift, Math.abs(timeline.seconds - host.now / 1000));
    const next = motionPhase(timeline.seconds);
    if (next !== phase) {
      phase = next;
      if (!firstSeenAt.has(next)) firstSeenAt.set(next, host.now / 1000);
    }
  }
  return { firstSeenAt, maxDrift, timeline, host };
}

afterEach(() => {
  delete (globalThis as ClockHost)[ACTIVE_CLOCK_GLOBAL];
});

describe("ActiveTimeline drives animation by real active time, not by frames", () => {
  // SPEC §7.5 boundaries. Each phase may be observed up to one frame late,
  // never later — that is what "the story is not slowed by a slow GPU" means.
  const boundaries: [MotionPhase, number][] = [
    ["decelerate", 3.5],
    ["stop", 4.5],
    ["settle", 4.58],
    ["acknowledge", 4.9],
    ["continue", 6.2],
  ];

  it.each([60, 30, 10, 5])("reaches every signature phase on schedule at %i FPS", (fps) => {
    const frame = 1 / fps;
    const { firstSeenAt, maxDrift } = playAtFps(fps, 7);
    boundaries.forEach(([phase, expected], index) => {
      // A phase narrower than one frame (`stop` is 80ms) can be stepped over
      // without ever being sampled. That is coarse sampling, not a slow story:
      // the phases around it must still land on time.
      const window = (boundaries[index + 1]?.[1] ?? ARRIVAL_SECONDS) - expected;
      const seen = firstSeenAt.get(phase);
      if (window < frame) {
        expect(seen === undefined || seen >= expected - 1e-9).toBe(true);
        return;
      }
      expect(seen, `${phase} never happened at ${fps} FPS`).toBeDefined();
      expect(seen!).toBeGreaterThanOrEqual(expected - 1e-9);
      expect(seen!).toBeLessThanOrEqual(expected + frame + 1e-9);
    });
    // The timeline itself never lags the clock it is measured against.
    expect(maxDrift).toBeLessThanOrEqual(1e-9);
  });

  it("keeps the arrival distance frame-rate independent", () => {
    const at = (fps: number) => {
      const { timeline } = playAtFps(fps, 12);
      return driveProgress(timeline.seconds);
    };
    const reference = at(60);
    for (const fps of [30, 10, 5]) expect(Math.abs(at(fps) - reference)).toBeLessThan(.01);
  });

  it("finishes the 18s journey in 18s of real time even at 10 FPS", () => {
    const { timeline, host } = playAtFps(10, ARRIVAL_SECONDS + 1);
    expect(timeline.seconds).toBe(ARRIVAL_SECONDS);
    expect(host.now / 1000).toBeGreaterThanOrEqual(ARRIVAL_SECONDS);
    // The limit clamps at the end of the journey instead of overshooting it.
    expect(motionPhase(timeline.seconds)).toBe("settled");
  });

  it("turns the ferris wheel one full circle per 56s at any frame rate", () => {
    const angleAfter = (fps: number) => {
      const host = fakeClock();
      const timeline = new ActiveTimeline(host.clock);
      timeline.advance();
      for (let elapsed = 0; elapsed < 56_000; elapsed += 1000 / fps) {
        host.advance(1000 / fps);
        timeline.advance();
      }
      return timeline.seconds * Math.PI * 2 / 56;
    };
    for (const fps of [60, 30, 10, 5]) {
      expect(Math.abs(angleAfter(fps) - Math.PI * 2)).toBeLessThan(.02);
    }
  });
});

describe("ActiveTimeline excludes hidden and paused time", () => {
  it("does not charge a hidden tab, and does not jump on resume", () => {
    const host = fakeClock();
    const timeline = new ActiveTimeline(host.clock);
    const frames = (ms: number, step = 500) => {
      for (let elapsed = 0; elapsed < ms; elapsed += step) { host.advance(step); timeline.advance(); }
    };
    timeline.advance();
    frames(2_000);
    expect(timeline.seconds).toBeCloseTo(2, 6);

    // Hidden: the component suspends, the browser keeps ticking for 30s.
    timeline.suspend();
    host.advance(30_000);

    // Back in the foreground: the first frame opens a new span and adds nothing.
    timeline.advance();
    expect(timeline.seconds).toBeCloseTo(2, 6);
    frames(500);
    expect(timeline.seconds).toBeCloseTo(2.5, 6);
  });

  it("does not charge paused time either, and resumes from the same pose", () => {
    const host = fakeClock();
    const timeline = new ActiveTimeline(host.clock);
    timeline.advance();
    for (let elapsed = 0; elapsed < 4_900; elapsed += 100) { host.advance(100); timeline.advance(); }
    const posed = motionPhase(timeline.seconds);
    expect(posed).toBe("acknowledge");

    timeline.suspend();
    host.advance(60_000);
    timeline.advance();
    expect(timeline.seconds).toBeCloseTo(4.9, 6);
    expect(motionPhase(timeline.seconds)).toBe(posed);
  });

  it("caps a single frozen frame so a system sleep cannot skip the story", () => {
    const host = fakeClock();
    const timeline = new ActiveTimeline(host.clock);
    timeline.advance();
    host.advance(9_000);
    const step = timeline.advance();
    expect(step).toBeCloseTo(MAX_FRAME_DELTA_MS / 1000, 6);
    expect(timeline.seconds).toBeCloseTo(MAX_FRAME_DELTA_MS / 1000, 6);
  });

  it("replays from zero on reset without borrowing the previous span", () => {
    const host = fakeClock();
    const timeline = new ActiveTimeline(host.clock);
    timeline.advance();
    host.advance(3_000);
    timeline.advance();
    timeline.reset();
    host.advance(5_000);
    expect(timeline.advance()).toBe(0);
    expect(timeline.seconds).toBe(0);
    host.advance(100);
    timeline.advance();
    expect(timeline.seconds).toBeCloseTo(.1, 6);
  });

  it("defaults to the injected clock so E2E can drive it too", () => {
    const host = fakeClock();
    (globalThis as ClockHost)[ACTIVE_CLOCK_GLOBAL] = host.clock;
    const timeline = new ActiveTimeline();
    timeline.advance();
    host.advance(900);
    timeline.advance();
    expect(timeline.seconds).toBeCloseTo(.9, 6);
  });
});

describe("scene animation never accumulates render deltas", () => {
  // The retired `Math.min(delta, .05)` accumulator tied story time to frame
  // count: at 10 FPS it advanced 0.5s per real second, so the 18s journey took
  // 36s and the greeting arrived late. These files must read the clock instead.
  // Vehicle and World own animation clocks; CameraRig's entry push moved to a
  // compositor-driven CSS transform, so it owns no clock at all — but none of
  // the three may go back to accumulating render deltas.
  const timed = ["Vehicle.tsx", "World.tsx"];
  const frameFree = [...timed, "CameraRig.tsx"];

  it.each(timed)("%s advances animation from ActiveTimeline", (file) => {
    expect(readFileSync(new URL(file, import.meta.url), "utf8")).toContain("ActiveTimeline");
  });

  it.each(frameFree)("%s never accumulates a useFrame delta", (file) => {
    expect(readFileSync(new URL(file, import.meta.url), "utf8")).not.toMatch(/Math\.min\(\s*delta/);
  });

  it("shows what the retired accumulator would have done at 10 FPS", () => {
    const fps = 10;
    let legacy = 0;
    for (let frame = 0; frame < fps * 6.2; frame++) legacy += Math.min(1 / fps, .05);
    // 6.2 real seconds in, the legacy clock is only at 3.1s: still approaching,
    // while the spec says the greeting is already over by then.
    expect(legacy).toBeCloseTo(3.1, 6);
    expect(motionPhase(legacy)).toBe("approach");
    expect(motionPhase(6.2)).toBe("continue");
  });
});
