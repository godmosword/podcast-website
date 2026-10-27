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
    expect(screen.queryByRole("radiogroup", { name: "方塊轉轉難度" })).toBeNull();
    expect(screen.queryByRole("radiogroup", { name: "方塊轉轉特殊模式" })).toBeNull();
    expect(screen.getByRole("radiogroup", { name: "動態效果" })).toBeTruthy();
  });

  it("會朗讀的遊戲有「念出來」開關，預設開著，關掉會存起來", () => {
    for (const gameId of ["candy-match", "dino-sushi"] as const) {
      window.localStorage.clear();
      render(
        <GameChrome gameId={gameId}>
          <GameChromeToolbar />
        </GameChrome>,
      );
      fireEvent.click(screen.getByRole("button", { name: "遊戲設定" }));
      const voice = screen.getByRole("checkbox", { name: /念出來/ }) as HTMLInputElement;
      expect(voice.checked).toBe(true);
      fireEvent.click(voice);
      expect(voice.checked).toBe(false);
      expect(window.localStorage.getItem("cheche:progress")).toContain('"voiceEnabled":false');
      cleanup();
    }
  });

  it("「念出來」的說明寫的是這款遊戲自己念的東西", () => {
    for (const [gameId, says, notSays] of [
      ["candy-match", "關卡目標", "多多"],
      ["dino-sushi", "多多的話", "關卡目標"],
      ["orange-express", "下一站", "多多"],
    ] as const) {
      render(
        <GameChrome gameId={gameId}>
          <GameChromeToolbar />
        </GameChrome>,
      );
      fireEvent.click(screen.getByRole("button", { name: "遊戲設定" }));
      const row = screen.getByRole("checkbox", { name: /念出來/ }).closest("label")!;
      expect(row.textContent).toContain(says);
      expect(row.textContent).not.toContain(notSays);
      cleanup();
    }
  });

  it("設定打開時外框標 data-settings-open，讓整層蓋過頁面抬頭；關上就拿掉", () => {
    const { container } = render(
      <GameChrome gameId="orange-express">
        <GameChromeToolbar />
      </GameChrome>,
    );
    const wrap = container.firstElementChild!;
    expect(wrap.hasAttribute("data-settings-open")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "遊戲設定" }));
    expect(wrap.hasAttribute("data-settings-open")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "完成" }));
    expect(wrap.hasAttribute("data-settings-open")).toBe(false);
  });

  it("方塊轉轉沒有朗讀，不顯示「念出來」", () => {
    render(
      <GameChrome gameId="block-drop">
        <GameChromeToolbar />
      </GameChrome>,
    );
    fireEvent.click(screen.getByRole("button", { name: "遊戲設定" }));
    expect(screen.queryByRole("checkbox", { name: /念出來/ })).toBeNull();
  });

  it("block-drop 設定顯示難度與彩虹模式", () => {
    render(
      <GameChrome gameId="block-drop">
        <GameChromeToolbar />
      </GameChrome>,
    );
    fireEvent.click(screen.getByRole("button", { name: "遊戲設定" }));
    expect(screen.getByRole("radiogroup", { name: "方塊轉轉難度" })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "方塊轉轉特殊模式" })).toBeTruthy();
  });
});
