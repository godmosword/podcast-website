import { describe, expect, it } from "vitest";
import { getCharacters } from "@/data/characters";
import {
  computeRecognizedCharacterIds,
  isCharacterRecognized,
} from "./character-recognition";

describe("character-recognition", () => {
  const anAn = getCharacters().find((c) => c.id === "an-an");
  const watt = getCharacters().find((c) => c.id === "watt");

  it("聽完出場故事即已認識", () => {
    expect(anAn).toBeDefined();
    const completed = new Set(["ep-6"]);
    expect(
      isCharacterRecognized(anAn!, completed, new Set()),
    ).toBe(true);
  });

  it("未聽完且未解鎖為待認識", () => {
    expect(
      isCharacterRecognized(anAn!, new Set(), new Set()),
    ).toBe(false);
  });

  it("unlocks.characters 可顯式標記已認識", () => {
    expect(
      isCharacterRecognized(anAn!, new Set(), new Set(["an-an"])),
    ).toBe(true);
  });

  it("computeRecognizedCharacterIds 批次計算", () => {
    expect(watt).toBeDefined();
    const characters = getCharacters();
    const recognized = computeRecognizedCharacterIds(
      characters,
      new Set(["ep-6", "ep-1"]),
      new Set(),
    );
    expect(recognized.has("an-an")).toBe(true);
    expect(recognized.has("watt")).toBe(true);
    expect(recognized.size).toBeGreaterThan(0);
  });
});
