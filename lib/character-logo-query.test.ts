import { describe, expect, it } from "vitest";
import { getCharacters } from "@/data/characters";
import {
  CHARACTER_LOGO_PX,
  characterForPortraitRef,
  characterLogoAssetPath,
} from "./character-logo-query";

describe("characterLogoAssetPath", () => {
  it("對齊 SPEC 的 32／128／512 檔名", () => {
    expect(CHARACTER_LOGO_PX).toEqual([32, 128, 512]);
    expect(characterLogoAssetPath("xiao-hong")).toBe(
      "/characters/logo/xiao-hong-32.webp",
    );
    expect(characterLogoAssetPath("dong-dong", 128)).toBe(
      "/characters/logo/dong-dong-128.webp",
    );
    expect(characterLogoAssetPath("nuan-nuan-turtle", 512)).toBe(
      "/characters/logo/nuan-nuan-turtle-512.webp",
    );
  });
});

describe("characterForPortraitRef", () => {
  it("用定裝照路徑對回角色，供著色本選角掛 logo", () => {
    const duo = characterForPortraitRef("characters/恐龍車多多.jpg");
    expect(duo?.id).toBe("duo-duo");
    expect(duo?.logoFamily).toBe("fantasy");
    expect(duo?.logoFeature).toBe("背鰭");
  });

  it("對不到時回 undefined", () => {
    expect(characterForPortraitRef("characters/不存在.jpg")).toBeUndefined();
    expect(characterForPortraitRef(undefined)).toBeUndefined();
  });

  it("每位有 ref 的角色都能對回自己", () => {
    for (const character of getCharacters()) {
      if (!character.ref) continue;
      expect(characterForPortraitRef(character.ref)?.id).toBe(character.id);
    }
  });
});
