import { describe, expect, it } from "vitest";
import {
  PROTO_CONTAINER_PRESETS,
  computeProtoMetrics,
  formatProtoMetricsReport,
  listOverlapPairs,
  minCenterGap,
  rectFullyContained,
  rectPartiallyClipped,
  unionRect,
} from "./play-map-proto-metrics";

const outer = { left: 0, top: 0, right: 100, bottom: 80 };

describe("play-map proto metrics", () => {
  it("提供 Phase 0 的兩組容器實測值", () => {
    expect(PROTO_CONTAINER_PRESETS).toEqual([
      { id: "mobile", label: "行動", width: 366, height: 780 },
      { id: "desktop-split", label: "桌機 split", width: 600, height: 512 },
    ]);
  });

  it("完全入框要求四邊都在容器內", () => {
    expect(
      rectFullyContained({ left: 0, top: 0, right: 100, bottom: 80 }, outer),
    ).toBe(true);
    expect(
      rectFullyContained({ left: -1, top: 10, right: 20, bottom: 20 }, outer),
    ).toBe(false);
  });

  it("部分出框是相交但未包含", () => {
    expect(
      rectPartiallyClipped({ left: -10, top: 10, right: 10, bottom: 20 }, outer),
    ).toBe(true);
    expect(
      rectPartiallyClipped({ left: 10, top: 10, right: 20, bottom: 20 }, outer),
    ).toBe(false);
    expect(
      rectPartiallyClipped({ left: 200, top: 200, right: 220, bottom: 220 }, outer),
    ).toBe(false);
  });

  it("聯集把標籤溢出算進入口 rect", () => {
    expect(
      unionRect(
        { left: 10, top: 10, right: 54, bottom: 54 },
        { left: 0, top: -8, right: 50, bottom: 14 },
      ),
    ).toEqual({ left: 0, top: -8, right: 54, bottom: 54 });
  });

  it("重疊對數與最小間距附縣市名", () => {
    const items = [
      { id: "台北市", rect: { left: 0, top: 0, right: 40, bottom: 40 } },
      { id: "新北市", rect: { left: 20, top: 0, right: 60, bottom: 40 } },
      { id: "台中市", rect: { left: 80, top: 0, right: 120, bottom: 40 } },
    ];
    expect(listOverlapPairs(items)).toEqual([{ a: "台北市", b: "新北市" }]);
    const gap = minCenterGap(items);
    expect(gap?.a).toBe("台北市");
    expect(gap?.b).toBe("新北市");
    expect(gap?.px).toBe(20);
  });

  it("B 用需捲動才可見，不用部分出框與重疊", () => {
    const preset = PROTO_CONTAINER_PRESETS[0]!;
    const metrics = computeProtoMetrics({
      variant: "B",
      preset,
      items: [
        { id: "基隆市", rect: { left: 8, top: 8, right: 350, bottom: 90 } },
        {
          id: "高雄市",
          rect: { left: 8, top: 800, right: 350, bottom: 890 },
        },
      ],
    });
    expect(metrics.entranceCount).toBe(2);
    expect(metrics.fullyInFrame).toBe(1);
    expect(metrics.needScrollToSee).toBe(1);
    expect(metrics.partiallyClipped).toBeNull();
    expect(metrics.overlapPairs).toBeNull();
    expect(metrics.westEdge).toBeNull();
  });

  it("報告文字可供 Phase 3 貼上", () => {
    const preset = PROTO_CONTAINER_PRESETS[1]!;
    const text = formatProtoMetricsReport(
      computeProtoMetrics({
        variant: "A",
        preset,
        items: [
          { id: "嘉義市", rect: { left: 0, top: 0, right: 40, bottom: 40 } },
          { id: "嘉義縣", rect: { left: 10, top: 0, right: 50, bottom: 40 } },
        ],
        westEdge: 120.35,
      }),
    );
    expect(text).toContain("variant: A");
    expect(text).toContain("container: desktop-split 600 × 512");
    expect(text).toContain("入口總數: 2");
    expect(text).toContain("重疊對數: 1");
    expect(text).toContain("嘉義市↔嘉義縣");
    expect(text).toContain("視窗西緣: 120.35000（通過）");
  });
});
