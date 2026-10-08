// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ColoringPage } from "@/data/coloring-pages";
import { saveColoringArtwork } from "@/lib/coloring/artwork-storage";
import { useColoringArtworkSave } from "./useColoringArtworkSave";

vi.mock("@/lib/coloring/artwork-storage", () => ({ saveColoringArtwork: vi.fn() }));
vi.mock("@/lib/coloring/bitmap", () => ({
  canvasBlob: vi.fn(async () => new Blob(["x"])),
  thumbnailCanvas: (c: HTMLCanvasElement) => c,
}));

const page = { id: "char-猛猛", title: "猛猛", lineArtRevision: 1 } as ColoringPage;
const canvas = () => document.createElement("canvas");

beforeEach(() => {
  vi.mocked(saveColoringArtwork).mockReset().mockResolvedValue(undefined);
});

describe("useColoringArtworkSave", () => {
  it("塗了是還沒存，存好就不是", async () => {
    const { result } = renderHook(() => useColoringArtworkSave(page));
    act(() => result.current.notePaint(true));
    expect(result.current.unsaved).toBe(true);
    const shot = await result.current.capture(canvas());
    await act(() => result.current.save(shot));
    expect(result.current.unsaved).toBe(false);
  });

  it("擷取後才落的筆觸不算已存", async () => {
    const { result } = renderHook(() => useColoringArtworkSave(page));
    act(() => result.current.notePaint(true));
    const shot = await result.current.capture(canvas());
    act(() => result.current.notePaint(true)); // 存檔前又塗一筆
    await act(() => result.current.save(shot));
    expect(result.current.unsaved).toBe(true);
    const next = await result.current.capture(canvas());
    await act(() => result.current.save(next));
    expect(saveColoringArtwork).toHaveBeenCalledTimes(2);
  });

  it("同一版本同時存兩次只寫一筆", async () => {
    let finish!: () => void;
    vi.mocked(saveColoringArtwork).mockImplementation(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const { result } = renderHook(() => useColoringArtworkSave(page));
    act(() => result.current.notePaint(true));
    const shot = await result.current.capture(canvas());
    let both!: Promise<unknown>;
    act(() => {
      both = Promise.all([result.current.save(shot), result.current.save(shot)]);
    });
    await act(async () => {
      finish();
      await both;
    });
    expect(saveColoringArtwork).toHaveBeenCalledTimes(1);
    await act(() => result.current.save(shot));
    expect(saveColoringArtwork).toHaveBeenCalledTimes(1);
  });

  it("開新稿後同一版本可以再存", async () => {
    const { result } = renderHook(() => useColoringArtworkSave(page));
    act(() => result.current.notePaint(true));
    const shot = await result.current.capture(canvas());
    await act(() => result.current.save(shot));
    act(() => result.current.forgetSaved());
    await act(() => result.current.save(shot));
    expect(saveColoringArtwork).toHaveBeenCalledTimes(2);
  });
});
