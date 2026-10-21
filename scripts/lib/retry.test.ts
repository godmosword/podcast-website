import { describe, expect, it, vi } from "vitest";
import {
  isOversizedDownloadError,
  retryDelayMs,
  withRetry,
} from "./retry";

describe("retryDelayMs", () => {
  it("指數成長並停在上限", () => {
    expect(retryDelayMs(1, 500, 8_000)).toBe(500);
    expect(retryDelayMs(2, 500, 8_000)).toBe(1_000);
    expect(retryDelayMs(3, 500, 8_000)).toBe(2_000);
    expect(retryDelayMs(8, 500, 8_000)).toBe(8_000);
  });
});

describe("withRetry", () => {
  it("第一次成功就不重試", async () => {
    const fn = vi.fn(async () => "ok");
    const sleep = vi.fn(async () => {});
    await expect(withRetry(fn, { sleep })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("失敗兩次後第三次成功，延遲為 500 與 1000", async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("one"))
      .mockRejectedValueOnce(new Error("two"))
      .mockResolvedValueOnce("done");
    const sleep = vi.fn(async () => {});
    const onRetry = vi.fn();

    await expect(
      withRetry(fn, { tries: 3, baseDelayMs: 500, sleep, onRetry }),
    ).resolves.toBe("done");

    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map((call) => call[0])).toEqual([500, 1_000]);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it("三次都失敗時丟出最後一個錯誤", async () => {
    const fn = vi.fn(async () => {
      throw new Error("still down");
    });
    await expect(
      withRetry(fn, { tries: 3, sleep: async () => {} }),
    ).rejects.toThrow("still down");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("shouldRetry 回 false 時不重試", async () => {
    const fn = vi.fn(async () => {
      throw new Error("File too large (99 bytes)");
    });
    await expect(
      withRetry(fn, {
        sleep: async () => {},
        shouldRetry: (error) => !isOversizedDownloadError(error),
      }),
    ).rejects.toThrow(/too large/i);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
