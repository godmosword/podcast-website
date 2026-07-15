import { afterEach, describe, expect, test, vi } from "vitest";
import {
  clearColoringDraft,
  loadColoringDraft,
  saveColoringDraft,
} from "@/lib/coloring/draft-storage";
import { coloringDraftKey } from "@/lib/coloring/tools";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("coloring draft-storage", () => {
  test("存取與清除草稿", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
      },
    });

    expect(loadColoringDraft("p1")).toBeNull();
    saveColoringDraft("p1", "data:image/png;base64,abc");
    expect(store.get(coloringDraftKey("p1"))).toBe("data:image/png;base64,abc");
    expect(loadColoringDraft("p1")).toBe("data:image/png;base64,abc");
    clearColoringDraft("p1");
    expect(loadColoringDraft("p1")).toBeNull();
  });
});
