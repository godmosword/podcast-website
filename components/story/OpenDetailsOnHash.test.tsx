// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OpenDetailsOnHash from "./OpenDetailsOnHash";

vi.stubGlobal("React", React);

afterEach(() => {
  cleanup();
  window.location.hash = "";
});

function setup() {
  return render(
    <>
      <a href="#co-listen">給爸媽：一起聊聊</a>
      <details id="co-listen">
        <summary>給爸媽</summary>
        內容
      </details>
      <OpenDetailsOnHash id="co-listen" />
    </>,
  );
}

describe("OpenDetailsOnHash", () => {
  it("進頁時網址已帶 #co-listen 就展開", () => {
    window.location.hash = "#co-listen";
    const { container } = setup();
    expect(container.querySelector("details")?.open).toBe(true);
  });

  it("點了頁內的 #co-listen 連結（hashchange）就展開", () => {
    const { container } = setup();
    const details = container.querySelector("details")!;
    expect(details.open).toBe(false);
    act(() => {
      window.location.hash = "#co-listen";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(details.open).toBe(true);
  });

  it("其他錨點不動它", () => {
    const { container } = setup();
    act(() => {
      window.location.hash = "#story-intro-heading";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(container.querySelector("details")?.open).toBe(false);
  });

  it("網址已經是 #co-listen、收合後再點頂部連結，仍會重新展開", () => {
    window.location.hash = "#co-listen";
    const { container, getByRole } = setup();
    const details = container.querySelector("details")!;
    details.open = false;
    act(() => {
      getByRole("link", { name: "給爸媽：一起聊聊" }).click();
    });
    expect(details.open).toBe(true);
  });

  it("點連結展開後焦點移到摘要列（鍵盤與讀屏接得上）；進頁自動展開不搶焦點", () => {
    window.location.hash = "#co-listen";
    const { container, getByRole } = setup();
    const summary = container.querySelector("summary")!;
    expect(document.activeElement).not.toBe(summary);
    act(() => {
      getByRole("link", { name: "給爸媽：一起聊聊" }).click();
    });
    expect(document.activeElement).toBe(summary);
  });
});
