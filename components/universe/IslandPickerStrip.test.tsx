import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ZONES } from "@/data/universe-zones";
import IslandPickerStrip from "./IslandPickerStrip";

describe("IslandPickerStrip", () => {
  it("為每座島輸出可點 chip（button＋島名），使用 data-picker-zone", () => {
    const html = renderToStaticMarkup(
      <IslandPickerStrip zones={ZONES} onSelect={() => undefined} />,
    );
    expect(html).toContain('aria-label="選擇島嶼"');
    expect(html).toContain('data-testid="island-picker-strip"');
    expect(html).not.toContain("data-zone=");
    for (const zone of ZONES) {
      expect(html).toContain(`data-picker-zone="${zone.id}"`);
      expect(html).toContain(zone.shortName ?? zone.name);
    }
    expect((html.match(/<button/g) ?? []).length).toBe(ZONES.length);
  });

  it("activeZoneId 標 aria-current", () => {
    const html = renderToStaticMarkup(
      <IslandPickerStrip
        zones={ZONES}
        onSelect={() => undefined}
        activeZoneId="car-park"
      />,
    );
    expect(html).toMatch(/data-picker-zone="car-park"[^>]*aria-current="true"/);
  });

  it("onSelect 契約可接 ZoneDef", () => {
    const onSelect = vi.fn();
    onSelect(ZONES[0]!);
    expect(onSelect).toHaveBeenCalledWith(ZONES[0]);
  });
});
