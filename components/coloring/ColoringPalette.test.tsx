// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { COLORING_PALETTE, hexToRgba } from "@/lib/coloring/tools";
import { playSfx } from "@/lib/sfx";
import { ColoringPalette } from "./ColoringPalette";
vi.mock("@/lib/sfx", () => ({ playSfx: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.mocked(playSfx).mockClear();
});
function Palette() {
  const [color, setColor] = useState(COLORING_PALETTE[0]!.hex);
  return <ColoringPalette colorHex={color} onChange={setColor} />;
}
test("one tab stop follows keyboard selection, with wrapping, Home and End", () => {
  render(<Palette />);
  const options = screen.getAllByRole("option");
  options[0]!.focus();
  for (const [key, index] of [["ArrowRight", 1], ["End", 11], ["ArrowRight", 0], ["ArrowLeft", 11], ["Home", 0]] as const) {
    fireEvent.keyDown(document.activeElement!, { key });
    expect(document.activeElement).toBe(options[index]);
    expect(options[index]!.getAttribute("aria-selected")).toBe("true");
    expect(options.filter((o) => o.tabIndex === 0)).toHaveLength(1);
  }
});
test("a color group never changes the artist's selected color on its own", () => {
  const change = vi.fn();
  const red = COLORING_PALETTE.find((swatch) => swatch.id === "red")!.hex;
  const { rerender } = render(<ColoringPalette colorHex={red} onChange={change} />);
  rerender(<ColoringPalette colorHex={red} onChange={change} group="forest" />);
  expect(change).not.toHaveBeenCalled();
  expect(screen.getAllByRole("option")).toHaveLength(6);
  expect(screen.getAllByRole("option").filter((o) => o.tabIndex === 0)).toHaveLength(1);
  expect(screen.queryByRole("option", { selected: true })).toBeNull();
  fireEvent.click(screen.getAllByRole("option")[0]!);
  expect(change).toHaveBeenCalledOnce();
});
test("每色都有圖案與色名，深底才用淺色圖案", () => {
  render(<Palette />);
  for (const swatch of COLORING_PALETTE) {
    const option = screen.getByRole("option", { name: swatch.name });
    const mark = option.querySelector("svg");
    expect(mark?.getAttribute("data-pattern")).toBe(swatch.id);
    expect(mark?.getAttribute("data-mark")).toBe(
      swatch.id === "green" || swatch.id === "black" ? "light" : "ink",
    );
    expect(option.textContent).toContain(swatch.name);
    const [r, g, b] = hexToRgba(swatch.hex);
    expect(
      option.querySelector<HTMLElement>("[data-swatch-disc]")?.style.background,
    ).toBe(`rgb(${r}, ${g}, ${b})`);
  }
});
test("點色票有輕輕的 tap 音（音效開關由 lib/sfx 把關）", () => {
  render(<Palette />);
  fireEvent.click(screen.getAllByRole("option")[3]!);
  expect(playSfx).toHaveBeenCalledWith("pick");
});
