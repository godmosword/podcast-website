import { describe, expect, it } from "vitest";
import { getCharacters } from "@/data/characters";
import { getCharacterBlurDataUrl } from "./character-image-blur";

describe("character-image-blur", () => {
  it("每個有定裝照的角色都有 blur data URL", () => {
    const withRef = getCharacters().filter((character) => character.ref);
    expect(withRef.length).toBeGreaterThan(0);
    for (const character of withRef) {
      const blur = getCharacterBlurDataUrl(`/${character.ref}`);
      expect(blur, character.ref).toMatch(/^data:image\/jpeg;base64,/);
    }
  });

  it("未知路徑回傳 undefined", () => {
    expect(getCharacterBlurDataUrl("/characters/missing.jpg")).toBeUndefined();
  });
});
