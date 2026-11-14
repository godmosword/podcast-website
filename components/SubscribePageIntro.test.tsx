import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  SUBSCRIBE_CLOSED_PAGE_LEDE,
  SUBSCRIBE_CLOSED_PAGE_TITLE,
  SUBSCRIBE_HONESTY_NEEDLE,
  SUBSCRIBE_NO_EPISODE_MAIL_NEEDLE,
  SUBSCRIBE_PAGE_TITLE,
} from "@/lib/subscribe-copy";
import SubscribePageIntro from "./SubscribePageIntro";

vi.stubGlobal("React", React);

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const render = (initialOpen: boolean) =>
  renderToStaticMarkup(
    <SubscribePageIntro initialOpen={initialOpen} titleClassName="t" ledeClassName="l" />,
  );

describe("SubscribePageIntro", () => {
  it("登記開放：請人留 Email，並誠實聲明只收名單、不寄新集上線信", () => {
    const html = render(true);
    expect(html).toContain(`<h1 class="t">${SUBSCRIBE_PAGE_TITLE}</h1>`);
    expect(html).toContain(SUBSCRIBE_HONESTY_NEEDLE);
    expect(html).toContain(SUBSCRIBE_NO_EPISODE_MAIL_NEEDLE);
  });

  it("登記關閉：不請人留 Email，改帶去收聽平台", () => {
    const html = render(false);
    expect(html).toContain(`<h1 class="t">${SUBSCRIBE_CLOSED_PAGE_TITLE}</h1>`);
    expect(html).toContain(SUBSCRIBE_CLOSED_PAGE_LEDE);
    expect(html).not.toContain("留下家長 Email");
  });
});
