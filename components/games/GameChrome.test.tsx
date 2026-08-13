// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GameChrome, { GameChromeToolbar } from "./GameChrome";

vi.stubGlobal("React", React);

describe("GameChrome settings by gameId", () => {
  afterEach(() => {
    cleanup();
  });

  it("candy-match 設定不含方塊難度與彩虹模式", () => {
    render(
      <GameChrome gameId="candy-match">
        <GameChromeToolbar />
      </GameChrome>,
    );
    fireEvent.click(screen.getByRole("button", { name: "遊戲設定" }));
    expect(screen.getByRole("dialog", { name: "遊戲設定" })).toBeTruthy();
    expect(screen.queryByRole("radiogroup", { name: "繽紛方塊難度" })).toBeNull();
    expect(screen.queryByRole("radiogroup", { name: "繽紛方塊特殊模式" })).toBeNull();
    expect(screen.getByRole("radiogroup", { name: "動態效果" })).toBeTruthy();
  });

  it("block-drop 設定顯示難度與彩虹模式", () => {
    render(
      <GameChrome gameId="block-drop">
        <GameChromeToolbar />
      </GameChrome>,
    );
    fireEvent.click(screen.getByRole("button", { name: "遊戲設定" }));
    expect(screen.getByRole("radiogroup", { name: "繽紛方塊難度" })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "繽紛方塊特殊模式" })).toBeTruthy();
  });
});
