// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CharacterLogoMark, { CharacterLogoStrip } from "./CharacterLogoMark";

vi.stubGlobal("React", React);

describe("CharacterLogoMark", () => {
  afterEach(() => {
    cleanup();
  });

  it("載入成功才顯示，失敗則卸下", () => {
    const { container, rerender } = render(
      <CharacterLogoMark slug="xiao-hong" name="小紅" size={32} />,
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("/characters/logo/xiao-hong-32.webp");
    expect(img?.className.includes("ready")).toBe(false);

    fireEvent.load(img!);
    expect(container.querySelector("img")?.className.includes("ready")).toBe(
      true,
    );

    rerender(<CharacterLogoMark slug="dong-dong" name="東東" size={24} />);
    const next = container.querySelector("img");
    fireEvent.error(next!);
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("CharacterLogoStrip", () => {
  afterEach(() => {
    cleanup();
  });

  it("至少一張 load 成功才插入可見列，不預留空 gap", () => {
    const { container } = render(
      <CharacterLogoStrip
        size={24}
        characters={[
          { id: "xiao-hong", name: "小紅" },
          { id: "dong-dong", name: "東東" },
        ]}
      />,
    );

    expect(container.querySelector("[aria-label]")).toBeNull();
    const preload = container.querySelectorAll("span img");
    expect(preload.length).toBe(2);

    fireEvent.load(preload[0]!);
    const strip = container.querySelector("[aria-label]");
    expect(strip?.getAttribute("aria-label")).toBe("出場角色：小紅");
    expect(strip?.querySelectorAll("img").length).toBe(1);
  });
});
