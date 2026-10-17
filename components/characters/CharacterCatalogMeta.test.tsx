// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Character } from "@/data/characters";
import CharacterCatalogMeta from "./CharacterCatalogMeta";

vi.stubGlobal("React", React);

let recognized: ReadonlySet<string> = new Set();

vi.mock("@/hooks/useRecognizedCharacters", () => ({
  useRecognizedCharacterIds: () => recognized,
}));

const characters = ["a", "b", "c"].map(
  (id): Character => ({
    id,
    name: id,
    vehicle: "車",
    personality: "",
    appearsIn: [],
  }),
);

describe("CharacterCatalogMeta", () => {
  afterEach(() => {
    cleanup();
    recognized = new Set();
  });

  it("還沒認識任何角色時只顯示總數", () => {
    render(<CharacterCatalogMeta characters={characters} className="meta" />);
    expect(screen.getByText("3 位角色")).toBeTruthy();
    expect(screen.queryByText(/已認識/)).toBeNull();
  });

  it("認識幾位就顯示幾位", () => {
    recognized = new Set(["a", "c"]);
    const { container } = render(
      <CharacterCatalogMeta characters={characters} className="meta" />,
    );
    expect(container.textContent).toBe("3 位角色 · 已認識 2 位");
  });
});
