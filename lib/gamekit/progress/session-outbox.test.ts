import { describe, expect, it, vi } from "vitest";
import { SessionOutbox } from "@/lib/gamekit/progress/session-outbox";
import type { GameSessionResult } from "@/lib/gamekit/progress/session";

const first: GameSessionResult = { gameId: "candy-match", score: 10, levelIndex: 0, cleared: true };
const second: GameSessionResult = { gameId: "candy-match", score: 20, levelIndex: 1, cleared: true };

function brokenSender() {
  const store = { broken: true };
  const send = vi.fn<(result: GameSessionResult) => void>(() => {
    if (store.broken) throw new Error("QuotaExceededError");
  });
  return { store, send, outbox: new SessionOutbox(send) };
}

describe("SessionOutbox", () => {
  it("寫得進去：送出一次、沒有排著的", () => {
    const send = vi.fn();
    const outbox = new SessionOutbox(send);
    expect(outbox.push(first)).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(outbox.hasPending()).toBe(false);
  });

  it("寫不進去：不丟例外、回報 false，留著等下次", () => {
    const { outbox } = brokenSender();
    expect(() => outbox.push(first)).not.toThrow();
    expect(outbox.push(second)).toBe(false);
    expect(outbox.hasPending()).toBe(true);
  });

  it("補寫時照原本順序，寫好的不再重送", () => {
    const { outbox, send, store } = brokenSender();
    outbox.push(first);
    outbox.push(second);
    store.broken = false;
    send.mockClear();
    expect(outbox.flush()).toBe(true);
    expect(send.mock.calls.map(([r]) => r)).toEqual([first, second]);
    expect(outbox.flush()).toBe(true);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("寫到一半又壞掉：已寫好的那筆不會再送一次", () => {
    const send = vi.fn((result: GameSessionResult) => {
      if (result === second) throw new Error("QuotaExceededError");
    });
    const outbox = new SessionOutbox(send);
    expect(outbox.push(first)).toBe(true);
    expect(outbox.push(second)).toBe(false);
    send.mockClear();
    expect(outbox.flush()).toBe(false);
    expect(send.mock.calls.map(([r]) => r)).toEqual([second]);
  });

  it("沒有接收端（沒掛 Host）：當作寫好", () => {
    const outbox = new SessionOutbox(undefined);
    expect(outbox.push(first)).toBe(true);
    expect(outbox.hasPending()).toBe(false);
  });
});
