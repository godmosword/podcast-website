// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PlayMapProtoApp from "./PlayMapProtoApp";
import { metadata } from "@/app/for-parents/play-map/proto/page";

vi.stubGlobal("React", React);

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockProtoNationalMap(props: {
      onSelectCity: (next: string | null) => void;
    }) {
      return (
        <div data-testid="proto-map-stub">
          <button
            type="button"
            onClick={() => props.onSelectCity("基隆市")}
          >
            選定基隆市（地圖）
          </button>
        </div>
      );
    },
}));

afterEach(() => {
  cleanup();
});

describe("PlayMapProtoApp 量測殼", () => {
  it("提供行動與桌機 split 兩組容器", () => {
    render(<PlayMapProtoApp />);
    expect(
      screen.getByRole("radio", { name: "行動 366×780" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: "桌機 split 600×512" }),
    ).toBeTruthy();
  });

  it("切換容器會改 viewport 尺寸，指標可複製", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<PlayMapProtoApp />);
    const viewport = screen.getByTestId("proto-viewport");
    expect(viewport.getAttribute("style")).toContain("width: 366px");

    fireEvent.click(screen.getByRole("radio", { name: "桌機 split 600×512" }));
    expect(screen.getByTestId("proto-viewport").getAttribute("style")).toContain(
      "width: 600px",
    );

    fireEvent.click(screen.getByRole("button", { name: "複製指標" }));
    expect(writeText).toHaveBeenCalled();
    const report = String(writeText.mock.calls[0]?.[0]);
    expect(report).toContain("variant: A");
    expect(report).toContain("container: desktop-split 600 × 512");
    expect(report).toContain("入口總數:");
  });

  it("variant 切換不得影響 metadata.robots", () => {
    render(<PlayMapProtoApp />);
    fireEvent.click(screen.getByRole("radio", { name: "B 縣市卡片" }));
    fireEvent.click(screen.getByRole("radio", { name: "C2 修好的 city marker" }));
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("三個 variant 的選定縣市 handler 為同一個參考", () => {
    const spy = vi.fn();
    render(<PlayMapProtoApp onSelectCity={spy} />);

    fireEvent.click(screen.getByRole("button", { name: "選定基隆市（地圖）" }));
    fireEvent.click(screen.getByRole("button", { name: "清除選定" }));

    fireEvent.click(screen.getByRole("radio", { name: "B 縣市卡片" }));
    fireEvent.click(screen.getByRole("button", { name: /選定基隆市/ }));
    fireEvent.click(screen.getByRole("button", { name: "清除選定" }));

    fireEvent.click(screen.getByRole("radio", { name: "C2 修好的 city marker" }));
    fireEvent.click(screen.getByRole("button", { name: "選定基隆市（地圖）" }));

    expect(spy.mock.calls.filter((call) => call[0] === "基隆市")).toHaveLength(
      3,
    );
    expect(spy).toHaveBeenCalledWith("基隆市");
    expect(spy).toHaveBeenCalledWith(null);
  });
});
