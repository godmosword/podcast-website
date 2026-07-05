import { describe, expect, it } from "vitest";
import {
  readGodotLoaderError,
  readGodotLoaderProgress,
} from "./game-load";

function mockDoc(elements: Record<string, HTMLElement | null>): Document {
  return {
    getElementById: (id: string) => elements[id] ?? null,
  } as Document;
}

describe("readGodotLoaderProgress", () => {
  it("依 progress 元素 value/max 回傳百分比", () => {
    const bar = { value: 25, max: 100 } as unknown as HTMLElement;
    const doc = mockDoc({ "status-progress": bar });
    expect(readGodotLoaderProgress(doc)).toBe(25);
  });

  it("無 progress 或 max 為 0 時回傳 null", () => {
    expect(readGodotLoaderProgress(mockDoc({}))).toBeNull();
  });
});

describe("readGodotLoaderError", () => {
  it("notice 顯示時回傳錯誤文字", () => {
    const notice = {
      style: { display: "block" },
      textContent: "WebGL 不可用",
    } as unknown as HTMLElement;
    expect(readGodotLoaderError(mockDoc({ "status-notice": notice }))).toBe(
      "WebGL 不可用",
    );
  });

  it("notice 隱藏時回傳 null", () => {
    const notice = {
      style: { display: "none" },
      textContent: "hidden",
    } as unknown as HTMLElement;
    expect(readGodotLoaderError(mockDoc({ "status-notice": notice }))).toBeNull();
  });
});
