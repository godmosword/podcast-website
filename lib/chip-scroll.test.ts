import { describe, expect, it, vi } from "vitest";
import { canScrollHorizontal, scrollChipIntoView } from "./chip-scroll";

describe("chip-scroll", () => {
  it("detects horizontal overflow", () => {
    const el = { scrollWidth: 400, clientWidth: 300 } as HTMLElement;
    expect(canScrollHorizontal(el)).toBe(true);

    const fit = { scrollWidth: 300, clientWidth: 300 } as HTMLElement;
    expect(canScrollHorizontal(fit)).toBe(false);
  });

  it("scrolls chip into view with nearest inline alignment", () => {
    const chip = {
      scrollIntoView: vi.fn(),
    } as unknown as HTMLElement;

    scrollChipIntoView(chip, { behavior: "auto" });

    expect(chip.scrollIntoView).toHaveBeenCalledWith({
      inline: "nearest",
      block: "nearest",
      behavior: "auto",
    });
  });
});
