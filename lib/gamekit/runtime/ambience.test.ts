import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AMBIENCE_THEMES, AmbiencePlayer } from "./ambience";
import { GameKitAudioBus } from "./audio";
import { ChiptuneBgmPlayer } from "./chiptune-bgm";

type FakeNode = {
  kind: string;
  connected: unknown[];
  started?: number;
  stopped?: number;
  connect(target: unknown): unknown;
};

/** 假 AudioContext：記錄建了哪些節點、何時開始／停止。 */
function fakeContext() {
  const nodes: FakeNode[] = [];
  const param = (value = 0) => ({
    value,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  });
  const make = (kind: string, extra: object = {}): FakeNode & Record<string, unknown> => {
    const node: FakeNode & Record<string, unknown> = {
      kind,
      connected: [],
      connect(target: unknown) {
        node.connected.push(target);
        return target;
      },
      start(this: FakeNode, t: number) {
        this.started = t;
      },
      stop(this: FakeNode, t: number) {
        this.stopped = t;
      },
      ...extra,
    };
    nodes.push(node);
    return node;
  };
  const ctx = {
    state: "running",
    currentTime: 5,
    sampleRate: 8000,
    destination: make("destination"),
    createGain: () => make("gain", { gain: param(1) }),
    createOscillator: () => make("osc", { frequency: param(440), type: "sine" }),
    createBufferSource: () => make("noise", { buffer: null, loop: false }),
    createBiquadFilter: () => make("filter", { frequency: param(350), Q: param(1), type: "lowpass" }),
    createBuffer: (_ch: number, length: number, sampleRate: number) => {
      const data = new Float32Array(length);
      return { sampleRate, getChannelData: () => data };
    },
    resume: () => Promise.resolve(),
  };
  return { ctx, nodes };
}

const theme = AMBIENCE_THEMES["dino-sushi"]!;
const live = (nodes: FakeNode[], kind: string) => nodes.filter((n) => n.kind === kind && n.started !== undefined && n.stopped === undefined);

describe("AmbiencePlayer（店內環境音）", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function setup() {
    const { ctx, nodes } = fakeContext();
    const music = ctx.createGain();
    // 固定亂數：事件延遲取區間中點
    const player = new AmbiencePlayer(ctx as unknown as AudioContext, music as unknown as AudioNode, () => 0.5);
    return { ctx, nodes, player, music };
  }

  it("開始時每層底噪一個循環噪音＋LFO，接到 music 分軌", () => {
    const { nodes, player, music } = setup();
    player.play("dino-sushi");
    expect(player.isPlaying).toBe(true);
    expect(live(nodes, "noise")).toHaveLength(theme.beds.length);
    expect(live(nodes, "osc")).toHaveLength(theme.beds.filter((b) => b.lfo).length);
    expect(nodes.some((n) => n.kind === "gain" && n.connected.includes(music))).toBe(true);
  });

  it("同一個遊戲重複 play 不會重開（不會一直淡入、疊兩層底噪）", () => {
    const { nodes, player } = setup();
    player.play("dino-sushi");
    const count = nodes.length;
    player.play("dino-sushi");
    expect(nodes.length).toBe(count);
  });

  it("沒有環境音的遊戲：什麼都不建", () => {
    const { nodes, player } = setup();
    const before = nodes.length;
    player.play("block-drop");
    expect(player.isPlaying).toBe(false);
    expect(nodes.length).toBe(before);
  });

  it("小事件依隨機間隔出現，之後持續再排", () => {
    const { nodes, player } = setup();
    player.play("dino-sushi");
    const base = nodes.length;
    const [lo, hi] = theme.events[0]!.first ?? theme.events[0]!.every;
    vi.advanceTimersByTime(((lo + hi) / 2) * 1000 + 10);
    const afterFirst = nodes.length;
    expect(afterFirst).toBeGreaterThan(base);
    const [elo, ehi] = theme.events[0]!.every;
    vi.advanceTimersByTime(((elo + ehi) / 2) * 1000 + 10);
    expect(nodes.length).toBeGreaterThan(afterFirst);
  });

  it("暫停：底噪停掉、事件不再出現；繼續：重新淡入", () => {
    const { nodes, player } = setup();
    player.play("dino-sushi");
    player.pause();
    expect(player.isPlaying).toBe(false);
    expect(live(nodes, "noise")).toHaveLength(0);
    const count = nodes.length;
    vi.advanceTimersByTime(120_000);
    expect(nodes.length).toBe(count);
    player.resume();
    expect(player.isPlaying).toBe(true);
    expect(live(nodes, "noise")).toHaveLength(theme.beds.length);
  });

  it("停止後 resume 不會自己開回來", () => {
    const { nodes, player } = setup();
    player.play("dino-sushi");
    player.stop();
    player.resume();
    expect(player.isPlaying).toBe(false);
    expect(live(nodes, "noise")).toHaveLength(0);
  });

  it("主題設定合理：底噪很小聲、事件間隔為正、每種事件至少一個變化", () => {
    for (const bed of theme.beds) {
      expect(bed.vol).toBeGreaterThan(0);
      expect(bed.vol).toBeLessThanOrEqual(0.08);
    }
    for (const ev of theme.events) {
      expect(ev.every[0]).toBeGreaterThan(0);
      expect(ev.every[1]).toBeGreaterThanOrEqual(ev.every[0]);
      expect(ev.variants.length).toBeGreaterThan(0);
      for (const v of ev.variants) for (const voice of v) expect(voice.vol).toBeLessThanOrEqual(0.05);
    }
  });
});

describe("GameKitAudioBus 背景音樂＋環境音", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function setup() {
    const { ctx, nodes } = fakeContext();
    vi.stubGlobal("window", { AudioContext: function FakeAudioContext() { return ctx; } });
    const play = vi.spyOn(ChiptuneBgmPlayer.prototype, "play").mockImplementation(() => {});
    vi.spyOn(ChiptuneBgmPlayer.prototype, "stop").mockImplementation(() => {});
    const bus = new GameKitAudioBus();
    return { bus, nodes, play };
  }

  it("每次點擊帶同樣的靜音狀態呼叫 setMuted，不會讓 BGM 從頭重播", () => {
    const { bus, play } = setup();
    bus.playBgm("dino-sushi");
    expect(play).toHaveBeenCalledTimes(1);
    bus.setMuted(false);
    bus.setMuted(false);
    expect(play).toHaveBeenCalledTimes(1);
    bus.setMuted(true);
    bus.setMuted(false);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("壽司屋開 BGM 時環境音一起開，靜音一起停", () => {
    const { bus, nodes } = setup();
    bus.playBgm("dino-sushi");
    expect(live(nodes, "noise").length).toBeGreaterThan(0);
    bus.setMuted(true);
    expect(live(nodes, "noise")).toHaveLength(0);
  });

  it("暫停／繼續／停止跟著 BGM", () => {
    const { bus, nodes } = setup();
    bus.playBgm("dino-sushi");
    bus.pauseBgm();
    expect(live(nodes, "noise")).toHaveLength(0);
    bus.resumeBgm();
    expect(live(nodes, "noise").length).toBeGreaterThan(0);
    bus.stopBgm();
    expect(live(nodes, "noise")).toHaveLength(0);
  });
});
