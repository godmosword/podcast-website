import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PlayMapProps } from "./PlayMap";

const searchParamsRef = vi.hoisted(() => ({
  current: new URLSearchParams(""),
}));

vi.stubGlobal("React", React);

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsRef.current,
}));

vi.mock("./PlayMap", () => ({
  default: function MockPlayMap(props: PlayMapProps) {
    return (
      <div
        data-testid="play-map"
        data-city={props.initialCity ?? ""}
        data-type={props.initialType ?? ""}
        data-free={props.initialFreeOnly ? "1" : "0"}
        data-rain={props.initialRainyDayOnly ? "1" : "0"}
        data-view={props.initialView ?? "cards"}
      />
    );
  },
}));

import PlayMapClient, { PlayMapFallback } from "./PlayMapClient";

describe("PlayMapClient", () => {
  beforeEach(() => {
    searchParamsRef.current = new URLSearchParams("");
  });

  test("fallback 不讀 URL，維持預設全台 cards", () => {
    searchParamsRef.current = new URLSearchParams(
      "city=桃園市&free=1&view=map",
    );
    const html = renderToStaticMarkup(<PlayMapFallback />);
    expect(html).toContain('data-city=""');
    expect(html).toContain('data-view="cards"');
    expect(html).toContain('data-free="0"');
  });

  test("從 URL 解析 city／free／view 傳給 PlayMap", () => {
    searchParamsRef.current = new URLSearchParams(
      "city=桃園市&free=1&view=map",
    );
    const html = renderToStaticMarkup(<PlayMapClient />);
    expect(html).toContain('data-city="桃園市"');
    expect(html).toContain('data-free="1"');
    expect(html).toContain('data-view="map"');
    expect(html).toContain('data-rain="0"');
  });

  test("無縣市的 view=map 傳給 PlayMap 時已是 cards", () => {
    searchParamsRef.current = new URLSearchParams("view=map&free=1");
    const html = renderToStaticMarkup(<PlayMapClient />);
    expect(html).toContain('data-view="cards"');
    expect(html).toContain('data-free="1"');
  });

  test("從 URL 解析 rain contextual filter", () => {
    searchParamsRef.current = new URLSearchParams("rain=1");
    const html = renderToStaticMarkup(<PlayMapClient />);
    expect(html).toContain('data-rain="1"');
  });

  test("重複 query 取第一個值，對齊 parsePlayMapQuery", () => {
    searchParamsRef.current = new URLSearchParams("city=新北市");
    searchParamsRef.current.append("city", "台中市");
    const html = renderToStaticMarkup(<PlayMapClient />);
    expect(html).toContain('data-city="新北市"');
    expect(html).not.toContain('data-city="台中市"');
  });
});
