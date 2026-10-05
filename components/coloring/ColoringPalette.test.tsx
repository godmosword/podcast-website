// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { COLORING_PALETTE } from "@/lib/coloring/tools";
import { ColoringPalette } from "./ColoringPalette";
afterEach(cleanup);
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
  const { rerender } = render(<ColoringPalette colorHex="#e85d4c" onChange={change} />);
  rerender(<ColoringPalette colorHex="#e85d4c" onChange={change} group="forest" />);
  expect(change).not.toHaveBeenCalled();
  expect(screen.getAllByRole("option")).toHaveLength(6);
  expect(screen.getAllByRole("option").filter((o) => o.tabIndex === 0)).toHaveLength(1);
  expect(screen.queryByRole("option", { selected: true })).toBeNull();
  fireEvent.click(screen.getAllByRole("option")[0]!);
  expect(change).toHaveBeenCalledOnce();
});
