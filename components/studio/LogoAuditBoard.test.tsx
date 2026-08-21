// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCharacterLogos } from "@/data/character-logos";
import LogoAuditBoard from "./LogoAuditBoard";

vi.stubGlobal("React", React);

describe("LogoAuditBoard", () => {
  afterEach(() => {
    cleanup();
  });

  it("預設 Grid 列出角色，可切到撞型與剪影", () => {
    render(<LogoAuditBoard logos={getCharacterLogos()} />);

    expect(screen.getByText("小紅 · 單一尾翼")).toBeTruthy();
    expect(screen.getByText("暖暖 · 龜殼")).toBeTruthy();
    expect(screen.getByRole("button", { name: "32px" }).getAttribute("aria-pressed")).toBe(
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "撞型並排" }));
    expect(screen.getByRole("heading", { name: /賽車血緣/ })).toBeTruthy();
    expect(
      screen.getByText(/賽車血緣四位共用 #E4402E/),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: /兩台餐車/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "64px" })).toHaveProperty(
      "disabled",
      true,
    );

    fireEvent.click(screen.getByRole("button", { name: "取色比對" }));
    expect(screen.getByText(/從產出圖取樣非背景主色/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "黑白剪影模式" }));
    expect(
      screen.getByRole("button", { name: "黑白剪影模式" }).getAttribute("aria-pressed"),
    ).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "家族分群" }));
    expect(screen.getByRole("heading", { name: /緊急救援/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /人與夥伴/ })).toBeTruthy();
  });
});
