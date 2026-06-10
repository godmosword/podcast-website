/** Whether a horizontal scroll container has overflow content. */
export function canScrollHorizontal(el: HTMLElement): boolean {
  return el.scrollWidth > el.clientWidth + 1;
}

export type ScrollChipOptions = {
  behavior?: ScrollBehavior;
};

/** Keep the active chip visible inside a horizontal chip row. */
export function scrollChipIntoView(
  chip: HTMLElement,
  options: ScrollChipOptions = {},
): void {
  chip.scrollIntoView({
    inline: "nearest",
    block: "nearest",
    behavior: options.behavior ?? "smooth",
  });
}
