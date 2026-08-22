// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CharacterLogoMark, { CharacterLogoStrip } from "./CharacterLogoMark";

vi.stubGlobal("React", React);

describe("CharacterLogoMark", () => {
  afterEach(() => {
    cleanup();
  });

  it("未 publish 時不建立必然 404 的圖片請求", () => {
    const { container, rerender } = render(
      <CharacterLogoMark slug="xiao-hong" name="小紅" size={32} />,
    );
    expect(container.querySelector("img")).toBeNull();

    rerender(<CharacterLogoMark slug="dong-dong" name="東東" size={24} />);
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
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });
});
