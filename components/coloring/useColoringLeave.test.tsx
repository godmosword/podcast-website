// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useColoringLeave } from "./useColoringLeave";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function renderLeave(unsaved = true) {
  return renderHook(() =>
    useColoringLeave({
      unsaved,
      getDisplay: () => null,
      onBack: () => {},
      saveNow: async () => {},
    }),
  );
}

afterEach(() => {
  cleanup();
});

describe("著色本離開", () => {
  it("還沒收藏時，瀏覽器返回先問，確認後才往回走", () => {
    const go = vi.spyOn(window.history, "go").mockImplementation(() => {});
    const { result } = renderLeave(true);
    expect(result.current.sheet).toBeNull();
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.sheet?.destination).toBe("back");
    act(() => {
      result.current.sheet?.onDiscard();
    });
    expect(go).toHaveBeenCalledWith(-2);
    go.mockRestore();
  });

  it("還沒收藏時，站內連結也先問", () => {
    const { result } = renderLeave(true);
    const anchor = document.createElement("a");
    anchor.href = "/stories";
    document.body.appendChild(anchor);
    act(() => {
      anchor.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
      );
    });
    expect(result.current.sheet?.destination).toBe("back");
    anchor.remove();
  });

  it("已經收藏就不攔返回", () => {
    const { result } = renderLeave(false);
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.sheet).toBeNull();
  });
});
