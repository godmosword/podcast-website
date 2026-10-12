import { afterEach, describe, expect, it, vi } from "vitest";
import { GameKitAudioBus, MAX_VOICES_PER_CALL, type SynthVoice } from "./audio";

type Node = { kind: string; connected: Node[]; started?: number; stopped?: number; loop?: boolean; type?: string };

/** 最小的假 AudioContext：只記錄建了哪些節點、怎麼接、何時開始。 */
function fakeContext() {
  const nodes: Node[] = [];
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  const make = (kind: string, extra: object = {}) => {
    const node: Node & Record<string, unknown> = {
      kind,
      connected: [],
      connect(target: Node) {
        node.connected.push(target);
        return target;
      },
      ...extra,
    };
    nodes.push(node);
    return node;
  };
  class FakeAudioContext {
    state = "running";
    currentTime = 10;
    sampleRate = 8000;
    destination = make("destination");
    createGain = () => make("gain", { gain: param() });
    createOscillator = () =>
      make("osc", {
        frequency: param(),
        start(this: Node, t: number) {
          this.started = t;
        },
        stop(this: Node, t: number) {
          this.stopped = t;
        },
      });
    createBufferSource = () =>
      make("noise", {
        start(this: Node, t: number) {
          this.started = t;
        },
        stop(this: Node, t: number) {
          this.stopped = t;
        },
      });
    createBiquadFilter = () => make("filter", { frequency: param(), Q: { value: 0 } });
    createBuffer = (_ch: number, length: number, sampleRate: number) => {
      const data = new Float32Array(length);
      return { sampleRate, getChannelData: () => data };
    };
    resume = () => Promise.resolve();
  }
  return { nodes, FakeAudioContext };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GameKitAudioBus.playVoices", () => {
  function setup() {
    const { nodes, FakeAudioContext } = fakeContext();
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
    const bus = new GameKitAudioBus();
    bus.ensureContext();
    return { bus, nodes, sfx: bus.sfxBus as unknown as Node };
  }

  it("振盪器、噪音、濾波都接到 sfx 分軌，依 at 排程", () => {
    const { bus, nodes, sfx } = setup();
    const voices: SynthVoice[] = [
      { wave: "sine", freq: 440, freqEnd: 880, dur: 0.1, vol: 0.1 },
      { wave: "noise", at: 0.2, dur: 0.1, vol: 0.1, filter: { type: "bandpass", freq: 900, q: 2 } },
    ];
    bus.playVoices(voices);
    const osc = nodes.find((n) => n.kind === "osc")!;
    const noise = nodes.find((n) => n.kind === "noise")!;
    expect(osc.started).toBeCloseTo(10.005);
    expect(noise.started).toBeCloseTo(10.205);
    expect(noise.loop).toBe(true);
    // noise → filter → gain → sfx
    const filter = noise.connected[0]!;
    expect(filter.kind).toBe("filter");
    expect(filter.connected[0]!.connected[0]).toBe(sfx);
    expect(osc.connected[0]!.connected[0]).toBe(sfx);
  });

  it("靜音時什麼都不建", () => {
    const { bus, nodes } = setup();
    bus.setMuted(true);
    const before = nodes.length;
    bus.playVoices([{ wave: "sine", freq: 440, dur: 0.1, vol: 0.1 }]);
    expect(nodes.length).toBe(before);
  });

  it("一次最多排 MAX_VOICES_PER_CALL 個音色", () => {
    const { bus, nodes } = setup();
    const many: SynthVoice[] = Array.from({ length: MAX_VOICES_PER_CALL + 10 }, () => ({ wave: "sine", freq: 440, dur: 0.05, vol: 0.05 }));
    bus.playVoices(many);
    expect(nodes.filter((n) => n.kind === "osc")).toHaveLength(MAX_VOICES_PER_CALL);
  });

  it("沒有 WebAudio 時 no-op", () => {
    vi.stubGlobal("window", {});
    expect(() => new GameKitAudioBus().playVoices([{ wave: "sine", freq: 440, dur: 0.1, vol: 0.1 }])).not.toThrow();
  });
});
