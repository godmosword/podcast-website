import { getPlayground } from "@/data/playgrounds";
import { resolveCollectionBySlug } from "@/lib/playground-collections";
import { describe, expect, it } from "vitest";
import { resolvePlayMapEditorialPick } from "./play-map-editorial";

function place(id: string) {
  const value = getPlayground(id);
  if (!value) throw new Error(`missing fixture ${id}`);
  return value;
}

describe("resolvePlayMapEditorialPick", () => {
  it("does not recommend in unscoped national state, with 0 results, or with 1 result", () => {
    const kidsMuseum = place("ty-kids-museum");
    const linkou = place("nt-linkou-sports");

    expect(
      resolvePlayMapEditorialPick({
        finalResults: [kidsMuseum, linkou],
        scope: "national",
      }),
    ).toBeNull();
    expect(
      resolvePlayMapEditorialPick({ finalResults: [], scope: "city" }),
    ).toBeNull();
    expect(
      resolvePlayMapEditorialPick({
        finalResults: [kidsMuseum],
        scope: "city",
      }),
    ).toBeNull();
  });

  it("intersects final results and prefers active intent matches", () => {
    const kidsMuseum = place("ty-kids-museum");
    const linkou = place("nt-linkou-sports");

    const resolved = resolvePlayMapEditorialPick({
      finalResults: [linkou, kidsMuseum],
      scope: "city",
      activeIntents: ["rainy-day"],
    });

    expect(resolved?.place.id).toBe("ty-kids-museum");
    expect(resolved?.matchedIntentCount).toBe(1);
  });

  it("kaohsiung-free reuses the existing free editorial seed", () => {
    const resolvedCollection = resolveCollectionBySlug("kaohsiung-free");
    expect(resolvedCollection).toBeDefined();

    const resolved = resolvePlayMapEditorialPick({
      finalResults: resolvedCollection!.places,
      scope: "city",
      activeIntents: ["free"],
    });

    expect(resolved?.place.id).toBe("kh-main-library");
    expect(resolved?.pick.placeId).toBe("kh-main-library");
  });

  it("does not recommend a closed place", () => {
    const closed = place("ty-puhsin");
    const other = place("ty-fenghe");

    expect(
      resolvePlayMapEditorialPick({
        finalResults: [closed, other],
        scope: "city",
        picks: [
          {
            placeId: closed.id,
            intents: ["free"],
            reason: "不應出現",
          },
        ],
      }),
    ).toBeNull();
  });

  it("skips invalid and duplicate sidecar entries safely", () => {
    const kidsMuseum = place("ty-kids-museum");
    const linkou = place("nt-linkou-sports");

    const resolved = resolvePlayMapEditorialPick({
      finalResults: [kidsMuseum, linkou],
      scope: "city",
      picks: [
        {
          placeId: "missing-place",
          intents: ["free"],
          reason: "無效",
        },
        {
          placeId: kidsMuseum.id,
          intents: ["free"],
          reason: "第一筆",
          priority: 1,
        },
        {
          placeId: kidsMuseum.id,
          intents: ["rainy-day"],
          reason: "重複，不應覆蓋",
          priority: 100,
        },
        {
          placeId: linkou.id,
          intents: ["free"],
          reason: "第二筆",
        },
      ],
      activeIntents: ["free"],
    });

    expect(resolved?.place.id).toBe(kidsMuseum.id);
    expect(resolved?.pick.reason).toBe("第一筆");
  });

  it("Nearby 同等相關時以距離作 tiebreak，不讓 priority 蓋過距離", () => {
    const nearby = place("ty-fenghe");
    const far = place("kh-main-library");

    const resolved = resolvePlayMapEditorialPick({
      finalResults: [far, nearby],
      scope: "nearby",
      userLatLng: { lat: nearby.lat, lng: nearby.lng },
      activeIntents: ["free"],
      picks: [
        {
          placeId: far.id,
          intents: ["free"],
          reason: "遠處但 priority 高",
          priority: 999,
        },
        {
          placeId: nearby.id,
          intents: ["free"],
          reason: "附近",
          priority: 1,
        },
      ],
    });

    expect(resolved?.place.id).toBe(nearby.id);
  });
});
