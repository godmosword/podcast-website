import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PARENT_GATE_PASSED_VALUE,
  PARENT_GATE_STORAGE_KEY,
  checkParentGateAnswer,
  createParentGateChallenge,
  createSeededRandom,
  readParentGatePassed,
  writeParentGatePassed,
} from "./parent-gate";

function mockSessionStorage() {
  const store = new Map<string, string>();
  const sessionStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  vi.stubGlobal("window", { sessionStorage: sessionStorageMock });
  vi.stubGlobal("sessionStorage", sessionStorageMock);
  return store;
}

describe("createParentGateChallenge", () => {
  it("運算元落在兩位數 10–19 與一位數 3–9", () => {
    for (let seed = 1; seed <= 400; seed += 1) {
      const challenge = createParentGateChallenge(createSeededRandom(seed));
      expect(challenge.multiplicand).toBeGreaterThanOrEqual(10);
      expect(challenge.multiplicand).toBeLessThanOrEqual(19);
      expect(challenge.multiplier).toBeGreaterThanOrEqual(3);
      expect(challenge.multiplier).toBeLessThanOrEqual(9);
    }
  });

  it("答案是兩數相乘", () => {
    const challenge = createParentGateChallenge(createSeededRandom(7));
    expect(challenge.answer).toBe(
      challenge.multiplicand * challenge.multiplier,
    );
    expect(challenge.prompt).toBe(
      `${challenge.multiplicand} × ${challenge.multiplier}`,
    );
  });

  it("注入同一種子時結果可重現", () => {
    expect(createParentGateChallenge(createSeededRandom(42))).toEqual(
      createParentGateChallenge(createSeededRandom(42)),
    );
  });

  it("random=0 取區間下限、接近 1 取上限", () => {
    const min = createParentGateChallenge(() => 0);
    expect(min).toMatchObject({ multiplicand: 10, multiplier: 3, answer: 30 });

    const max = createParentGateChallenge(() => 0.999);
    expect(max).toMatchObject({
      multiplicand: 19,
      multiplier: 9,
      answer: 171,
    });
  });
});

describe("checkParentGateAnswer", () => {
  const challenge = {
    multiplicand: 14,
    multiplier: 3,
    prompt: "14 × 3",
    answer: 42,
  };

  it("整數答案正確即通過", () => {
    expect(checkParentGateAnswer(challenge, "42")).toBe(true);
    expect(checkParentGateAnswer(challenge, " 42 ")).toBe(true);
  });

  it("空字串、非整數、錯誤數字皆不通過", () => {
    expect(checkParentGateAnswer(challenge, "")).toBe(false);
    expect(checkParentGateAnswer(challenge, "41")).toBe(false);
    expect(checkParentGateAnswer(challenge, "42.5")).toBe(false);
    expect(checkParentGateAnswer(challenge, "abc")).toBe(false);
  });
});

describe("parent-gate sessionStorage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("key 使用 cheche: 前綴", () => {
    expect(PARENT_GATE_STORAGE_KEY.startsWith("cheche:")).toBe(true);
  });

  it("寫入後讀得到通過狀態", () => {
    mockSessionStorage();
    expect(readParentGatePassed()).toBe(false);
    writeParentGatePassed();
    expect(sessionStorage.getItem(PARENT_GATE_STORAGE_KEY)).toBe(
      PARENT_GATE_PASSED_VALUE,
    );
    expect(readParentGatePassed()).toBe(true);
  });

  it("sessionStorage 拋錯時視為未通過，且寫入不丟錯", () => {
    const exploding = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    vi.stubGlobal("window", { sessionStorage: exploding });
    vi.stubGlobal("sessionStorage", exploding);
    expect(readParentGatePassed()).toBe(false);
    expect(() => writeParentGatePassed()).not.toThrow();
  });
});
