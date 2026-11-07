// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadDinoSushiDays } from "@/lib/gamekit/progress/dino-sushi-days";
import { PROGRESS_CHANGE_EVENT } from "@/lib/progress-keys";
import { useDinoSushiDayProgress } from "./useDinoSushiDayProgress";

function breakStorage() {
  return vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("QuotaExceededError");
  });
}

function setup(flushSessions = vi.fn(() => true)) {
  return { flushSessions, ...renderHook(() => useDinoSushiDayProgress({ flushSessions })) };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("壽司屋關卡進度：存檔寫不進去", () => {
  it("存得進去：回傳新的天數、沒有提示", () => {
    const { result } = setup();
    let days: readonly number[] = [];
    act(() => {
      days = result.current.recordDay(1, 1);
    });
    expect(days[0]).toBe(1);
    expect(result.current.dayFlags[0]).toBe(1);
    expect(result.current.saveFailed).toBe(false);
    expect(loadDinoSushiDays()[0]).toBe(1);
  });

  it("寫不進去：不丟例外，下一天照樣開著，重讀存檔也不會鎖回去", () => {
    const { result } = setup();
    const setItem = breakStorage();
    let days: readonly number[] = [];
    act(() => {
      days = result.current.recordDay(1, 1);
    });
    expect(days[0]).toBe(1);
    expect(result.current.saveFailed).toBe(true);
    setItem.mockRestore();
    expect(loadDinoSushiDays()[0]).toBe(0);
    act(() => {
      window.dispatchEvent(new Event(PROGRESS_CHANGE_EVENT));
    });
    expect(result.current.dayFlags[0]).toBe(1);
  });

  it("再存一次：還是壞的就留著提示；好了就寫進存檔、提示收掉", () => {
    const { result } = setup();
    const setItem = breakStorage();
    act(() => {
      result.current.recordDay(2, 3);
    });
    act(() => result.current.retry());
    expect(result.current.saveFailed).toBe(true);
    setItem.mockRestore();
    act(() => result.current.retry());
    expect(result.current.saveFailed).toBe(false);
    expect(loadDinoSushiDays()[1]).toBe(3);
  });

  it("下一輪存得進去時，上一輪沒存好的一起寫進去", () => {
    const { result } = setup();
    const setItem = breakStorage();
    act(() => {
      result.current.recordDay(1, 1);
    });
    setItem.mockRestore();
    act(() => {
      result.current.recordDay(2, 1);
    });
    expect(result.current.saveFailed).toBe(false);
    expect(loadDinoSushiDays().slice(0, 2)).toEqual([1, 1]);
  });

  it("全站紀錄沒寫進去也要提示；再存一次會補寫，全部好了才收掉", () => {
    const flush = vi.fn(() => false);
    const { result } = setup(flush);
    act(() => result.current.noteReport(false));
    expect(result.current.saveFailed).toBe(true);
    act(() => result.current.retry());
    expect(flush).toHaveBeenCalledTimes(1);
    expect(result.current.saveFailed).toBe(true);
    flush.mockReturnValue(true);
    act(() => result.current.retry());
    expect(result.current.saveFailed).toBe(false);
  });
});
