// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { scheduleWhenIdle } from "./schedule-idle";

describe("scheduleWhenIdle", () => {
  const originalRic = window.requestIdleCallback;
  const originalCancel = window.cancelIdleCallback;

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(window, "requestIdleCallback", {
      configurable: true,
      writable: true,
      value: originalRic,
    });
    Object.defineProperty(window, "cancelIdleCallback", {
      configurable: true,
      writable: true,
      value: originalCancel,
    });
  });

  it("有 requestIdleCallback 時走 idle，取消會呼叫 cancelIdleCallback", () => {
    const cancel = vi.fn();
    const ric = vi.fn().mockReturnValue(7);
    window.requestIdleCallback = ric as typeof window.requestIdleCallback;
    window.cancelIdleCallback = cancel;

    const job = vi.fn();
    const unschedule = scheduleWhenIdle(job, 1_200);
    expect(ric).toHaveBeenCalledWith(job, { timeout: 1_200 });
    expect(job).not.toHaveBeenCalled();

    unschedule();
    expect(cancel).toHaveBeenCalledWith(7);
  });

  it("沒有 requestIdleCallback 時改 setTimeout，不會丟例外", () => {
    // jsdom／舊 WebView 可能根本沒有這個 API。
    Object.defineProperty(window, "requestIdleCallback", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    Object.defineProperty(window, "cancelIdleCallback", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    vi.useFakeTimers();

    const job = vi.fn();
    expect(() => scheduleWhenIdle(job, 1_200)).not.toThrow();
    expect(job).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(job).toHaveBeenCalledTimes(1);
  });
});
