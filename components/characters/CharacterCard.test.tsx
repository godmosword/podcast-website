// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCharacters } from "@/data/characters";
import CharacterCard from "./CharacterCard";

vi.stubGlobal("React", React);

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 測試 mock
    <img alt={alt} />
  ),
}));

vi.mock("@/lib/sfx", () => ({
  playSfx: vi.fn(),
}));

function lingLing() {
  const character = getCharacters().find((entry) => entry.id === "ling-ling");
  if (!character) throw new Error("missing ling-ling");
  return character;
}

describe("CharacterCard", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    push.mockClear();
  });

  it("名稱與職責同一排，未認識不顯示貼紙", () => {
    render(<CharacterCard character={lingLing()} recognized={false} />);

    const title = screen.getByRole("heading", { level: 2, name: "玲玲 清潔車" });
    expect(title.textContent).toBe("玲玲 清潔車");
    expect(screen.queryByText("待認識")).toBeNull();
    expect(screen.queryByText("已認識")).toBeNull();
    expect(screen.getByRole("article").getAttribute("aria-label")).toBe(
      "玲玲，清潔車",
    );
  });

  it("已認識才顯示貼紙", () => {
    render(<CharacterCard character={lingLing()} recognized />);

    expect(screen.getByText("已認識")).toBeTruthy();
    expect(screen.queryByText("待認識")).toBeNull();
    expect(screen.getByRole("article").getAttribute("aria-label")).toBe(
      "玲玲，清潔車，已認識",
    );
  });

  it("出場集數改為下拉並帶 10 字內標題", () => {
    render(<CharacterCard character={lingLing()} recognized={false} />);

    const select = screen.getByRole("combobox", { name: "玲玲的出場故事" });
    expect(select).toBeTruthy();
    expect(screen.queryByRole("link", { name: /EP / })).toBeNull();
    expect(screen.getByRole("option", { name: "EP 4 守信用的鈴鈴清潔車" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "EP 9 恐龍車多多的大黃牙" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "EP 15 恐龍車多多洗手故事" })).toBeTruthy();
  });
});
