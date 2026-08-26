import { beforeEach, describe, expect, it, vi } from "vitest";

describe("recordReflectionShown", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    const store = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    };
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      localStorage: localStorageMock,
    });
    vi.stubGlobal("localStorage", localStorageMock);
  });

  it("依 source 分開記錄，同 source 不去重以外的重複", async () => {
    const { migrateProgress, getProgressSync } = await import(
      "./progress-store"
    );
    const { recordReflectionShown } = await import("./engagement");

    migrateProgress();
    recordReflectionShown("ep-3", "detail");
    recordReflectionShown("ep-3", "end-screen");
    recordReflectionShown("ep-3", "detail");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getProgressSync().engagement.reflectionShown).toEqual([
      { slug: "ep-3", source: "detail" },
      { slug: "ep-3", source: "end-screen" },
    ]);
  });
});
