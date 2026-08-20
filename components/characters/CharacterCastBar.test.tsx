// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCharactersForStory } from "@/data/characters";
import CharacterCastBar from "./CharacterCastBar";

vi.stubGlobal("React", React);

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("CharacterCastBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("空名單不渲染", () => {
    const { container } = render(<CharacterCastBar characters={[]} />);
    expect(container.querySelector("ul")).toBeNull();
  });

  it("每位出場角色連到圖鑑錨點", () => {
    const characters = getCharactersForStory("ep-3");
    expect(characters.length).toBeGreaterThan(0);
    render(<CharacterCastBar characters={characters} />);

    for (const character of characters) {
      expect(
        screen.getByRole("link", { name: character.name }).getAttribute("href"),
      ).toBe(`/characters#${character.id}`);
    }
  });
});
