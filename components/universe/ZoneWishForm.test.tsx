// @vitest-environment jsdom
import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ZoneWishForm from "./ZoneWishForm";

vi.stubGlobal("React", React);

describe("ZoneWishForm", () => {

  it("載入態輸出提示", () => {
    vi.stubGlobal("fetch", vi.fn());
    const { container } = render(
      <ZoneWishForm zoneId="dino" fallbackHref="mailto:test@example.com" />,
    );
    expect(container.textContent).toContain("載入中");
  });

  it("UX-P0-3：表單態顯示家長向隱私說明與故事 placeholder 勿含個資提示", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      }),
    );

    render(
      <ZoneWishForm zoneId="dino" fallbackHref="mailto:test@example.com" />,
    );

    await waitFor(() => {
      expect(screen.getByText(/留言僅用於節目製作與開幕通知/)).toBeTruthy();
    });

    expect(screen.getByText(/不會公開/)).toBeTruthy();
    expect(screen.getByText(/不要留下孩子的個人資料/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "隱私說明" }).getAttribute("href")).toBe(
      "/legal#privacy",
    );

    const storyTab = screen.getByRole("button", { name: "我想聽的車車故事" });
    await act(async () => {
      storyTab.click();
    });

    const textarea = screen.getByPlaceholderText(
      /請勿填寫姓名、電話或地址/,
    ) as HTMLTextAreaElement;
    expect(textarea.placeholder).toContain("請勿填寫姓名、電話或地址");
  });
});
