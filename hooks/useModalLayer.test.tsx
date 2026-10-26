// @vitest-environment jsdom
import React, { useRef } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useModalLayer } from "./useModalLayer";

vi.stubGlobal("React", React);

afterEach(() => {
  cleanup();
  document.documentElement.style.overflow = "";
});

/** 像頂欄抽屜：面板與觸發器在 header 裡面，背景是 header 的其他東西＋main＋footer。 */
function Page({ open, onClose = () => {} }: { open: boolean; onClose?: () => void }) {
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useModalLayer({
    open,
    onClose,
    keepRefs: [panelRef, triggerRef],
    returnFocusRef: triggerRef,
    extraScrollLockSelector: "[data-scroller]",
  });
  return (
    <>
      <header data-testid="header">
        <div data-testid="inner">
          <button type="button" data-testid="brand">
            首頁
          </button>
          <button type="button" ref={triggerRef} data-testid="trigger">
            選單
          </button>
          <nav ref={panelRef} data-testid="panel">
            <button type="button">故事</button>
          </nav>
        </div>
      </header>
      <main data-testid="main" data-scroller="">
        <button type="button">背景</button>
      </main>
      <footer data-testid="footer" />
    </>
  );
}

const byId = (id: string) => document.querySelector(`[data-testid="${id}"]`)!;

describe("useModalLayer：完整模態的背景、捲動與焦點", () => {
  it("開著時面板與觸發器以外的背景都 inert，連同 header 裡的兄弟；含面板的祖先本身不 inert", () => {
    render(<Page open />);
    expect(byId("brand").hasAttribute("inert")).toBe(true);
    expect(byId("main").hasAttribute("inert")).toBe(true);
    expect(byId("footer").hasAttribute("inert")).toBe(true);
    expect(byId("trigger").closest("[inert]")).toBeNull();
    expect(byId("panel").closest("[inert]")).toBeNull();
    expect(byId("header").hasAttribute("inert")).toBe(false);
  });

  it("鎖 html 與指定的捲動容器；關閉後還原原本的 inline style 與 inert", () => {
    document.documentElement.style.overflow = "clip";
    const { rerender } = render(<Page open={false} />);
    (byId("main") as HTMLElement).style.overflow = "auto";
    rerender(<Page open />);
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect((byId("main") as HTMLElement).style.overflow).toBe("hidden");
    expect(document.body.style.overflow).toBe("");
    rerender(<Page open={false} />);
    expect(document.documentElement.style.overflow).toBe("clip");
    expect((byId("main") as HTMLElement).style.overflow).toBe("auto");
    expect(document.querySelector("[inert]")).toBeNull();
  });

  it("原本就 inert 的節點，關閉後仍是 inert", () => {
    const { rerender } = render(<Page open={false} />);
    byId("footer").setAttribute("inert", "");
    rerender(<Page open />);
    rerender(<Page open={false} />);
    expect(byId("footer").hasAttribute("inert")).toBe(true);
    expect(byId("main").hasAttribute("inert")).toBe(false);
  });

  it("Esc 呼叫 onClose；關閉後焦點回到觸發器", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Page open onClose={onClose} />);
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    (byId("panel").querySelector("button") as HTMLElement).focus();
    rerender(<Page open={false} onClose={onClose} />);
    expect(document.activeElement).toBe(byId("trigger"));
  });

  it("開著就卸載也會清乾淨", () => {
    const { unmount } = render(<Page open />);
    unmount();
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("巢狀模態共用同一個背景節點：先關的那層不會把還開著那層的背景解除", () => {
    function Two({ outer, inner }: { outer: boolean; inner: boolean }) {
      const a = useRef<HTMLDivElement>(null);
      const b = useRef<HTMLDivElement>(null);
      useModalLayer({ open: outer, onClose: () => {}, keepRefs: [a], returnFocusRef: a });
      useModalLayer({ open: inner, onClose: () => {}, keepRefs: [b], returnFocusRef: b });
      return (
        <>
          <main data-testid="bg" />
          <div ref={a} data-testid="a" />
          <div ref={b} data-testid="b" />
        </>
      );
    }
    const { rerender } = render(<Two outer inner />);
    expect(byId("bg").hasAttribute("inert")).toBe(true);
    rerender(<Two outer inner={false} />);
    expect(byId("bg").hasAttribute("inert")).toBe(true);
    rerender(<Two outer={false} inner={false} />);
    expect(byId("bg").hasAttribute("inert")).toBe(false);
    expect(byId("bg").hasAttribute("data-modal-inert")).toBe(false);
  });

  it("保留節點分在不同分支：兩條分支裡其他的兄弟都 inert，保留節點本身不 inert", () => {
    function Branches() {
      const a = useRef<HTMLButtonElement>(null);
      const b = useRef<HTMLButtonElement>(null);
      useModalLayer({ open: true, onClose: () => {}, keepRefs: [a, b], returnFocusRef: a });
      return (
        <div>
          <section>
            <button type="button" ref={a} data-testid="keep-a" />
            <button type="button" data-testid="other-a" />
          </section>
          <section>
            <button type="button" data-testid="other-b" />
            <button type="button" ref={b} data-testid="keep-b" />
          </section>
          <aside data-testid="aside" />
        </div>
      );
    }
    render(<Branches />);
    expect(byId("other-a").hasAttribute("inert")).toBe(true);
    expect(byId("other-b").hasAttribute("inert")).toBe(true);
    expect(byId("aside").hasAttribute("inert")).toBe(true);
    expect(byId("keep-a").closest("[inert]")).toBeNull();
    expect(byId("keep-b").closest("[inert]")).toBeNull();
  });
});
