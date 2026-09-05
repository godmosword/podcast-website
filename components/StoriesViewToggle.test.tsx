// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  STORIES_VIEW_ATTRIBUTE,
  STORIES_VIEW_LIST,
  STORIES_VIEW_STORAGE_KEY,
} from "@/lib/stories-view";

vi.mock("@/lib/sfx", () => ({ playSfx: vi.fn() }));

function mockLocalStorage() {
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
  vi.stubGlobal("localStorage", localStorageMock);
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });
  return store;
}

beforeEach(() => {
  mockLocalStorage();
  document.documentElement.removeAttribute(STORIES_VIEW_ATTRIBUTE);
});

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute(STORIES_VIEW_ATTRIBUTE);
  vi.unstubAllGlobals();
});

describe("StoriesViewToggle", () => {
  test("點完整會寫 html 旗標與 localStorage，縮圖會清掉屬性", async () => {
    const { default: StoriesViewToggle } = await import("./StoriesViewToggle");
    render(<StoriesViewToggle />);

    const listBtn = screen.getByRole("button", { name: "完整" });
    const gridBtn = screen.getByRole("button", { name: "縮圖" });

    expect(gridBtn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(listBtn);

    expect(document.documentElement.getAttribute(STORIES_VIEW_ATTRIBUTE)).toBe(
      STORIES_VIEW_LIST,
    );
    expect(localStorage.getItem(STORIES_VIEW_STORAGE_KEY)).toBe("list");
    expect(listBtn.getAttribute("aria-pressed")).toBe("true");
    expect(gridBtn.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(gridBtn);
    expect(document.documentElement.hasAttribute(STORIES_VIEW_ATTRIBUTE)).toBe(
      false,
    );
    expect(localStorage.getItem(STORIES_VIEW_STORAGE_KEY)).toBe("grid");
  });
});
