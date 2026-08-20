/**
 * Play Map proto 全國層量測：用入口元素的渲染 rect，不用圓心或宣告 iconSize。
 *
 * 縣市名標籤是 position:absolute 溢出 44px 按鈕，按鈕自身的
 * getBoundingClientRect() 不含標籤。量測時把按鈕與 `.playMapMarkerName`
 * 取聯集，才符合「標籤被切掉的針不是可用入口」。
 */

export const PROTO_VARIANTS = ["A", "B", "C2"] as const;
export type ProtoVariant = (typeof PROTO_VARIANTS)[number];

export type ProtoContainerPreset = {
  id: "mobile" | "desktop-split";
  label: string;
  width: number;
  height: number;
};

export const PROTO_CONTAINER_PRESETS: readonly ProtoContainerPreset[] = [
  { id: "mobile", label: "行動", width: 366, height: 780 },
  { id: "desktop-split", label: "桌機 split", width: 600, height: 512 },
];

export type RectBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type NamedRect = {
  id: string;
  rect: RectBox;
};

export type ProtoMetrics = {
  variant: ProtoVariant;
  containerId: ProtoContainerPreset["id"];
  width: number;
  height: number;
  entranceCount: number;
  fullyInFrame: number;
  partiallyClipped: number | null;
  overlapPairs: number | null;
  overlapPairNames: readonly string[] | null;
  minGap: { px: number; a: string; b: string } | null;
  needScrollToSee: number | null;
  westEdge: number | null;
  westEdgeOk: boolean | null;
  c2Unsolved: readonly string[];
};

export function unionRect(a: RectBox, b: RectBox): RectBox {
  return {
    left: Math.min(a.left, b.left),
    top: Math.min(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
  };
}

export function clientRectToBox(rect: {
  left: number;
  top: number;
  right: number;
  bottom: number;
}): RectBox {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  };
}

export function relativeToContainer(inner: RectBox, container: RectBox): RectBox {
  return {
    left: inner.left - container.left,
    top: inner.top - container.top,
    right: inner.right - container.left,
    bottom: inner.bottom - container.top,
  };
}

export function rectsIntersect(a: RectBox, b: RectBox): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function rectFullyContained(inner: RectBox, outer: RectBox): boolean {
  return (
    inner.left >= outer.left &&
    inner.top >= outer.top &&
    inner.right <= outer.right &&
    inner.bottom <= outer.bottom
  );
}

export function rectPartiallyClipped(inner: RectBox, outer: RectBox): boolean {
  return rectsIntersect(inner, outer) && !rectFullyContained(inner, outer);
}

export function rectCenter(rect: RectBox): { x: number; y: number } {
  return {
    x: (rect.left + rect.right) / 2,
    y: (rect.top + rect.bottom) / 2,
  };
}

export function listOverlapPairs(
  items: readonly NamedRect[],
): Array<{ a: string; b: string }> {
  const pairs: Array<{ a: string; b: string }> = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const left = items[i];
      const right = items[j];
      if (!left || !right) continue;
      if (rectsIntersect(left.rect, right.rect)) {
        pairs.push({ a: left.id, b: right.id });
      }
    }
  }
  return pairs;
}

export function minCenterGap(
  items: readonly NamedRect[],
): { px: number; a: string; b: string } | null {
  let best: { px: number; a: string; b: string } | null = null;
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const left = items[i];
      const right = items[j];
      if (!left || !right) continue;
      const a = rectCenter(left.rect);
      const b = rectCenter(right.rect);
      const px = Math.hypot(a.x - b.x, a.y - b.y);
      if (!best || px < best.px) {
        best = { px, a: left.id, b: right.id };
      }
    }
  }
  return best;
}

/**
 * 從入口根節點量渲染 rect。地圖針把縣市名標籤聯集進去。
 */
export function entranceRectFromElement(el: Element): RectBox {
  let box = clientRectToBox(el.getBoundingClientRect());
  const name = el.querySelector(".playMapMarkerName");
  if (name) {
    box = unionRect(box, clientRectToBox(name.getBoundingClientRect()));
  }
  return box;
}

export function collectNamedRects(
  root: Element,
  container: RectBox,
): NamedRect[] {
  return [...root.querySelectorAll("[data-proto-entrance]")].map((el) => ({
    id: el.getAttribute("data-city") ?? "",
    rect: relativeToContainer(entranceRectFromElement(el), container),
  }));
}

const VIEWPORT_BOX = (width: number, height: number): RectBox => ({
  left: 0,
  top: 0,
  right: width,
  bottom: height,
});

export function computeProtoMetrics(args: {
  variant: ProtoVariant;
  preset: ProtoContainerPreset;
  items: readonly NamedRect[];
  westEdge?: number | null;
  c2Unsolved?: readonly string[];
}): ProtoMetrics {
  const outer = VIEWPORT_BOX(args.preset.width, args.preset.height);
  const fullyInFrame = args.items.filter((item) =>
    rectFullyContained(item.rect, outer),
  ).length;
  const isMap = args.variant === "A" || args.variant === "C2";
  const overlap = isMap ? listOverlapPairs(args.items) : null;
  const westEdge = isMap ? (args.westEdge ?? null) : null;

  return {
    variant: args.variant,
    containerId: args.preset.id,
    width: args.preset.width,
    height: args.preset.height,
    entranceCount: args.items.length,
    fullyInFrame,
    partiallyClipped: isMap
      ? args.items.filter((item) => rectPartiallyClipped(item.rect, outer)).length
      : null,
    overlapPairs: overlap ? overlap.length : null,
    overlapPairNames: overlap
      ? overlap.map((pair) => `${pair.a}↔${pair.b}`)
      : null,
    minGap: isMap ? minCenterGap(args.items) : null,
    needScrollToSee: args.variant === "B" ? args.items.length - fullyInFrame : null,
    westEdge,
    westEdgeOk:
      westEdge === null ? null : westEdge >= 120.35 - 1e-6,
    c2Unsolved: args.c2Unsolved ?? [],
  };
}

export function formatProtoMetricsReport(metrics: ProtoMetrics): string {
  const dash = "—";
  const minGap = metrics.minGap
    ? `${metrics.minGap.px.toFixed(1)}px（${metrics.minGap.a}↔${metrics.minGap.b}）`
    : dash;
  const west =
    metrics.westEdge === null
      ? dash
      : `${metrics.westEdge.toFixed(5)}（${metrics.westEdgeOk ? "通過" : "未通過"}）`;
  const unsolved =
    metrics.variant === "C2"
      ? metrics.c2Unsolved.length === 0
        ? "無"
        : metrics.c2Unsolved.join("、")
      : dash;

  return [
    `variant: ${metrics.variant}`,
    `container: ${metrics.containerId} ${metrics.width} × ${metrics.height}`,
    `入口總數: ${metrics.entranceCount}`,
    `完全入框數: ${metrics.fullyInFrame}`,
    `部分出框數: ${metrics.partiallyClipped ?? dash}`,
    `重疊對數: ${metrics.overlapPairs ?? dash}`,
    `重疊縣市: ${metrics.overlapPairNames?.join("、") || dash}`,
    `最小間距: ${minGap}`,
    `需捲動才可見: ${metrics.needScrollToSee ?? dash}`,
    `視窗西緣: ${west}`,
    `C2 無解: ${unsolved}`,
  ].join("\n");
}
