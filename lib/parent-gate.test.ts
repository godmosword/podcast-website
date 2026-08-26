import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PARENT_GATE_SESSION_KEY,
  clearParentGatePassed,
  createParentGateChallenge,
  isParentGateAnswerCorrect,
  parseParentGateAnswer,
  readParentGatePassed,
  writeParentGatePassed,
} from "./parent-gate";

describe("createParentGateChallenge", () => {
  it("用注入的 random 產生可重現的加法題", () => {
    const challenge = createParentGateChallenge(() => 0);
    expect(challenge.a).toBe(6);
    expect(challenge.b).toBe(6);
    expect(challenge.prompt).toBe("6 + 6");
    expect(challenge.answer).toBe(12);
  });

  it("加數落在 6–20", () => {
    const high = createParentGateChallenge(() => 0.999);
    expect(high.a).toBe(20);
    expect(high.b).toBe(20);
    expect(high.answer).toBe(40);
  });
});

describe("parseParentGateAnswer / isParentGateAnswerCorrect", () => {
  const challenge = createParentGateChallenge(() => 0);

  it("接受純數字字串", () => {
    expect(parseParentGateAnswer("12")).toBe(12);
    expect(parseParentGateAnswer(" 12 ")).toBe(12);
    expect(isParentGateAnswerCorrect(challenge, "12")).toBe(true);
  });

  it("拒絕空白、小數、文字", () => {
    expect(parseParentGateAnswer("")).toBeNull();
    expect(parseParentGateAnswer("12.0")).toBeNull();
    expect(parseParentGateAnswer("十二")).toBeNull();
    expect(isParentGateAnswerCorrect(challenge, "11")).toBe(false);
  });
});

describe("parent gate sessionStorage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("讀寫通過旗標", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });

    expect(readParentGatePassed()).toBe(false);
    writeParentGatePassed();
    expect(store.get(PARENT_GATE_SESSION_KEY)).toBe("1");
    expect(readParentGatePassed()).toBe(true);
    clearParentGatePassed();
    expect(readParentGatePassed()).toBe(false);
  });

  it("sessionStorage 丟錯時當未通過、寫入不拋", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });

    expect(readParentGatePassed()).toBe(false);
    expect(() => writeParentGatePassed()).not.toThrow();
    expect(() => clearParentGatePassed()).not.toThrow();
  });
});
