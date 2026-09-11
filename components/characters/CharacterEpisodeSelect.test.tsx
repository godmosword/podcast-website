// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CharacterEpisodeSelect from "./CharacterEpisodeSelect";

vi.stubGlobal("React", React);

const push = vi.fn();
const playSfx = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/sfx", () => ({
  playSfx: (...args: unknown[]) => playSfx(...args),
}));

describe("CharacterEpisodeSelect", () => {
  afterEach(() => {
    cleanup();
    push.mockClear();
    playSfx.mockClear();
  });

  it("沒有集數時不渲染", () => {
    const { container } = render(
      <CharacterEpisodeSelect characterName="玲玲" episodes={[]} />,
    );
    expect(container.querySelector("select")).toBeNull();
  });

  it("選一集就前往該集頁", () => {
    render(
      <CharacterEpisodeSelect
        characterName="玲玲"
        episodes={[
          { slug: "ep-4", ep: 4, title: "守信用的鈴鈴清潔車" },
          { slug: "ep-15", ep: 15, title: "恐龍車多多洗手故事" },
        ]}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "玲玲的出場故事" }), {
      target: { value: "ep-15" },
    });

    expect(playSfx).toHaveBeenCalledWith("tap");
    expect(push).toHaveBeenCalledWith("/story/ep-15");
  });
});
