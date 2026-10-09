// @vitest-environment jsdom
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GamePlayChromeProvider,
  GamePlayHeader,
  useGamePlayLeaveGuard,
  type GamePlayLeaveGuard,
} from "./GamePlayChromeSlot";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock("@/components/ThemeToggle", () => ({ default: () => null }));

afterEach(cleanup);

function Game({ guard }: { guard: GamePlayLeaveGuard | null }) {
  useGamePlayLeaveGuard(guard);
  return null;
}

function renderHeader(guard: GamePlayLeaveGuard | null) {
  render(
    <GamePlayChromeProvider>
      <GamePlayHeader playTitle="繪本塗塗鴉" />
      <Game guard={guard} />
    </GamePlayChromeProvider>,
  );
  return screen.getByRole("link", { name: /回遊樂園/ });
}

/** fireEvent 回傳 false 代表 preventDefault 被呼叫。 */
const click = (el: HTMLElement, init?: MouseEventInit) =>
  fireEvent.click(el, { button: 0, ...init });

describe("GamePlayHeader 離開守門", () => {
  it("圖示返回仍叫回遊樂園", () => {
    render(
      <GamePlayChromeProvider>
        <GamePlayHeader playTitle="繪本塗塗鴉" iconBack />
      </GamePlayChromeProvider>,
    );
    const link = screen.getByRole("link", { name: "回遊樂園" });
    expect(link.querySelector("svg")).toBeTruthy();
    expect(link.textContent).toContain("回遊樂園");
    expect(link.textContent).not.toContain("←");
  });

  it("沒註冊時照常離開", () => {
    expect(click(renderHeader(null))).toBe(true);
  });

  it("守門回 false 時擋下，並讓遊戲接手", () => {
    const guard = vi.fn(() => false);
    expect(click(renderHeader(guard))).toBe(false);
    expect(guard).toHaveBeenCalledOnce();
  });

  it("守門回 true 時放行", () => {
    expect(click(renderHeader(() => true))).toBe(true);
  });

  it("按著 Cmd／Ctrl 另開分頁不攔", () => {
    const guard = vi.fn(() => false);
    expect(click(renderHeader(guard), { metaKey: true })).toBe(true);
    expect(guard).not.toHaveBeenCalled();
  });
});
