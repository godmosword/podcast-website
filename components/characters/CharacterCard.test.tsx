// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCharacters } from "@/data/characters";
import {
  CATALOG_EPISODE_TITLE_MAX,
  catalogEpisodeLabel,
  catalogEpisodesFor,
} from "@/lib/character-catalog";
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

    const title = screen.getByRole("heading", { level: 2, name: "鈴鈴 清潔車" });
    expect(title.textContent).toBe("鈴鈴 清潔車");
    expect(screen.queryByText("待認識")).toBeNull();
    expect(screen.queryByText("已認識")).toBeNull();
    expect(screen.getByRole("article").getAttribute("aria-label")).toBe(
      "鈴鈴，清潔車",
    );
  });

  it("已認識才顯示貼紙", () => {
    render(<CharacterCard character={lingLing()} recognized />);

    expect(screen.getByText("已認識")).toBeTruthy();
    expect(screen.queryByText("待認識")).toBeNull();
    expect(screen.getByRole("article").getAttribute("aria-label")).toBe(
      "鈴鈴，清潔車，已認識",
    );
  });

  it("出場集數改為下拉並帶 10 字內標題", () => {
    const character = lingLing();
    render(<CharacterCard character={character} recognized={false} />);

    const select = screen.getByRole("combobox", { name: "鈴鈴的出場故事" });
    expect(select).toBeTruthy();
    expect(screen.queryByRole("link", { name: /EP / })).toBeNull();

    // 集數標題來自 Apple RSS，sync 會改寫主標。對齊 catalog 輸出，
    // 避免寫死舊文案（例如 ep-9）讓同步 workflow 的單元測試失敗。
    const episodes = catalogEpisodesFor(character.appearsIn);
    expect(episodes.map((episode) => episode.slug)).toEqual([
      "ep-4",
      "ep-9",
      "ep-14",
      "ep-15",
    ]);
    for (const episode of episodes) {
      expect([...episode.title].length).toBeLessThanOrEqual(
        CATALOG_EPISODE_TITLE_MAX,
      );
      const option = screen.getByRole("option", {
        name: catalogEpisodeLabel(episode),
      });
      expect(option.getAttribute("value")).toBe(episode.slug);
    }
  });
});
