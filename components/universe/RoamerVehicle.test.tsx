import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Roamer } from "@/data/universe-roamers";
import RoamerVehicle from "./RoamerVehicle";

vi.stubGlobal("React", React);

const baseRoamer: Roamer = {
  id: "test-roamer",
  characterId: "test",
  routeId: "map-sea-orbit",
  speed: 10,
  src: "/front.png",
  sprites: {
    front: "/front.png",
    rear: "/rear.png",
  },
};

describe("RoamerVehicle", () => {
  it("renders map roamers with the same 2.5D body/shadow hooks as island roamers", () => {
    const html = renderToStaticMarkup(
      <RoamerVehicle
        roamer={baseRoamer}
        usePlaceholder={false}
        night={false}
        sizeKind="map"
      />,
    );

    expect(html).toContain('data-roamer-id="test-roamer"');
    expect(html).toContain("data-roamer-shadow");
    expect(html).toContain('data-roamer-body="test-roamer"');
    expect(html).toContain("/front.png");
    expect(html).toContain("/rear.png");
  });

  it("falls back to the front sprite when no rear view exists", () => {
    const html = renderToStaticMarkup(
      <RoamerVehicle
        roamer={{ ...baseRoamer, sprites: undefined }}
        usePlaceholder={false}
        night={false}
        sizeKind="map"
      />,
    );

    expect(html).toContain("/front.png");
    expect(html).not.toContain("/rear.png");
  });
});
