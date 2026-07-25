import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RoamerVehicle from "./RoamerVehicle";
import type { Roamer } from "@/data/universe-roamers";

vi.stubGlobal("React", React);

const baseRoamer: Roamer = {
  id: "roam-test",
  characterId: "xiao-hong",
  routeId: "dino-walkway",
  speed: 30,
  src: "/adventures/roamers/xiao-hong.png",
  enabled: true,
};

describe("RoamerVehicle", () => {
  it("front 輸出 picture + webp source", () => {
    const html = renderToStaticMarkup(
      <RoamerVehicle roamer={baseRoamer} usePlaceholder={false} night={false} sizeKind="map" />,
    );
    expect(html).toContain("<picture>");
    expect(html).toContain('type="image/webp"');
    expect(html).toContain("/adventures/roamers/xiao-hong.webp");
    expect(html).toContain("/adventures/roamers/xiao-hong.png");
  });

  it("rear sprite 帶 fetchpriority=low", () => {
    const roamer: Roamer = {
      ...baseRoamer,
      sprites: {
        front: "/adventures/roamers/a-ku.png",
        rear: "/adventures/roamers/a-ku.rear.png",
      },
    };
    const html = renderToStaticMarkup(
      <RoamerVehicle roamer={roamer} usePlaceholder={false} night={false} sizeKind="island" />,
    );
    expect(html).toContain("/adventures/roamers/a-ku.rear.webp");
    expect(html).toMatch(/fetchpriority="low"/i);
  });

  it("帶 greeting 時輸出問候泡泡與 data-greet", () => {
    const html = renderToStaticMarkup(
      <RoamerVehicle
        roamer={baseRoamer}
        usePlaceholder={false}
        night={false}
        sizeKind="map"
        greeting={{ message: "嗨！我是小紅賽車！", key: 1 }}
        reduced={false}
      />,
    );

    expect(html).toContain('data-greet="true"');
    expect(html).toContain("嗨！我是小紅賽車！");
  });
});
