import { describe, expect, it } from "vitest";
import {
  decideLiveBuild,
  expectedEditionForBranch,
  parseBuildInfo,
  storySlugChanges,
  storySlugsFromChangedPaths,
} from "./live-build";

const SHA = "c1e4a9b2a231354a64c83f8c0918afaf971f671b";

describe("expectedEditionForBranch", () => {
  it("release 對官網，main 對現有全功能站，其他分支不負責正式網域", () => {
    expect(expectedEditionForBranch("release")).toBe("official");
    expect(expectedEditionForBranch("main")).toBe("current");
    expect(expectedEditionForBranch("sync/apple")).toBeNull();
    expect(expectedEditionForBranch("")).toBeNull();
  });
});

describe("parseBuildInfo", () => {
  it("接受 commit 字串或 null，以及三種版別", () => {
    expect(parseBuildInfo({ commit: SHA, edition: "official" })).toEqual({
      commit: SHA,
      edition: "official",
    });
    expect(parseBuildInfo({ commit: null, edition: "current" })).toEqual({
      commit: null,
      edition: "current",
    });
  });

  it("形狀不對就回 null，不猜", () => {
    expect(parseBuildInfo(null)).toBeNull();
    expect(parseBuildInfo("official")).toBeNull();
    expect(parseBuildInfo({ commit: SHA })).toBeNull();
    expect(parseBuildInfo({ commit: SHA, edition: "staging" })).toBeNull();
    expect(parseBuildInfo({ commit: 42, edition: "official" })).toBeNull();
  });
});

describe("decideLiveBuild", () => {
  it("版別對、commit 對才算 ready", () => {
    const probe = { kind: "ok", info: { commit: SHA, edition: "official" } } as const;
    expect(decideLiveBuild(probe, "official", SHA)).toBe("ready");
  });

  it("版別不同代表正式網域不歸這個分支管，直接略過", () => {
    const probe = { kind: "ok", info: { commit: SHA, edition: "current" } } as const;
    expect(decideLiveBuild(probe, "official", SHA)).toBe("not-owner");
  });

  it("版別對但還是舊 commit 時繼續等", () => {
    const probe = { kind: "ok", info: { commit: "0ld", edition: "current" } } as const;
    expect(decideLiveBuild(probe, "current", SHA)).toBe("wait");
  });

  it("讀不到 build-info（404、逾時、還沒部署）時繼續等，不當成略過", () => {
    expect(decideLiveBuild({ kind: "unavailable", reason: "HTTP 404" }, "current", SHA)).toBe(
      "wait",
    );
  });
});

describe("storySlugsFromChangedPaths", () => {
  it("只從 public/stories/ep-N/ 底下的變更取 slug，去重並依集數排序", () => {
    expect(
      storySlugsFromChangedPaths([
        "public/stories/ep-39/audio.mp3",
        "public/stories/ep-39/01.webp",
        "public/stories/ep-4/01.jpg",
        "public/stories/README.md",
        "data/apple-synced.json",
        "public/stories-extra/ep-5/x.jpg",
      ]),
    ).toEqual(["ep-4", "ep-39"]);
  });
});

describe("storySlugChanges", () => {
  it("新核准與新下架的集數都要通知，沒變的不送", () => {
    expect(storySlugChanges(["ep-1", "ep-2", "ep-3"], ["ep-1", "ep-3", "ep-40"])).toEqual([
      "ep-2",
      "ep-40",
    ]);
  });

  it("清單相同時回空陣列", () => {
    expect(storySlugChanges(["ep-1"], ["ep-1"])).toEqual([]);
  });
});
