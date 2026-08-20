// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listCities } from "@/data/playgrounds";
import ProtoCityGrid from "./ProtoCityGrid";

vi.stubGlobal("React", React);

afterEach(() => {
  cleanup();
});

describe("ProtoCityGrid", () => {
  it("依 listCities 由北到南排出 15 張卡，室內 0 不顯示該行", () => {
    render(<ProtoCityGrid onSelectCity={vi.fn()} onSample={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.getAttribute("data-city"))).toEqual(
      listCities(),
    );

    const miaoli = screen.getByRole("button", { name: /選定苗栗縣/ });
    expect(miaoli.textContent).toContain("免費 3／5");
    expect(miaoli.textContent).not.toContain("室內");
    expect(miaoli.textContent).not.toContain("戶外");
    expect(miaoli.textContent).toContain("5 處");

    const chiayiCounty = screen.getByRole("button", { name: /選定嘉義縣/ });
    expect(chiayiCounty.textContent).toContain("室內 5／5");
  });

  it("點卡片呼叫 onSelectCity", () => {
    const onSelectCity = vi.fn();
    render(<ProtoCityGrid onSelectCity={onSelectCity} onSample={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /選定基隆市/ }));
    expect(onSelectCity).toHaveBeenCalledWith("基隆市");
  });
});
