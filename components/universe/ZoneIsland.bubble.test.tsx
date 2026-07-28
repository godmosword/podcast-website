// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveUniverseMap } from "@/lib/universe-map";
import ZoneIsland from "./ZoneIsland";

vi.stubGlobal("React", React);

vi.mock("./IslandRoamerLayer", () => ({ default: () => null }));

const dino = resolveUniverseMap().zones.find((z) => z.id === "dino")!;

describe("ZoneIsland 鎖島（狀態字樣已移除）", () => {
  afterEach(cleanup);

  it("點鎖島不再冒出狀態泡泡", () => {
    render(
      <ZoneIsland
        zone={dino}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /恐龍島/ }));

    expect(screen.queryByText("還在蓋喔！")).toBeNull();
    expect(screen.queryByText("建造中")).toBeNull();
  });

  it("木牌只顯示島名，不含狀態 pill", () => {
    const { container } = render(
      <ZoneIsland
        zone={dino}
        onActivate={() => undefined}
        reduced
        paused={false}
        night={false}
      />,
    );
    expect(container.textContent).toContain("恐龍島");
    expect(container.textContent).not.toContain("建造中");
    expect(container.textContent).not.toContain("🚧");
  });
});
