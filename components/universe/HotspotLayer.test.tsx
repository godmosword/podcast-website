// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HotspotLayer from "./HotspotLayer";

const prefetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ prefetch, push: vi.fn(), back: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    scroll: _scroll,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
    scroll?: boolean;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("HotspotLayer", () => {
  afterEach(() => {
    cleanup();
    prefetch.mockClear();
  });

  it("恐龍島渲染種子熱點並 prefetch", () => {
    render(<HotspotLayer zoneId="dino" />);
    expect(screen.getByLabelText("打開故事屋入口").getAttribute("href")).toBe(
      "/adventures/dino/story-house",
    );
    expect(
      screen.getByLabelText("恐龍巢穴（尚未開放）").getAttribute("href"),
    ).toBe("/adventures/dino/dino-nest");
    expect(prefetch).toHaveBeenCalled();
    expect(prefetch.mock.calls.flat()).toContain(
      "/adventures/dino/story-house",
    );
  });

  it("無熱點的島不渲染層", () => {
    const { container } = render(<HotspotLayer zoneId="ocean" />);
    expect(container.innerHTML).toBe("");
  });
});
