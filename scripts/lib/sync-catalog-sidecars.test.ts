import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildReflectionStub,
  inferZoneId,
  upsertCatalogSidecars,
} from "./sync-catalog-sidecars";

const tmpDirs: string[] = [];

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function makeFixtureRoot(): {
  root: string;
  zonesPath: string;
  promptsPath: string;
  datesPath: string;
} {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sync-sidecars-"));
  tmpDirs.push(root);
  const dataDir = path.join(root, "data");
  fs.mkdirSync(dataDir);

  const zonesPath = path.join(dataDir, "story-zones.ts");
  const promptsPath = path.join(dataDir, "reflection-prompts.ts");
  const datesPath = path.join(dataDir, "story-dates.ts");

  fs.writeFileSync(
    zonesPath,
    `import type { ZoneId } from "./universe-zones";

const STORY_ZONES: Record<string, ZoneId> = {
  "ep-18": "ocean", // 水上樂園練習說再見
};

export function getStoryZoneId(slug: string): ZoneId | undefined {
  return STORY_ZONES[slug];
}
`,
    "utf8",
  );

  fs.writeFileSync(
    promptsPath,
    `const REFLECTION_PROMPTS: Record<
  string,
  { child: string; parentFollowUp: string }
> = {
  "ep-18": {
    child: "既有問句？",
    parentFollowUp: "既有追問。",
  },
};

export function getReflectionPrompt(slug: string) {
  return REFLECTION_PROMPTS[slug];
}
`,
    "utf8",
  );

  fs.writeFileSync(
    datesPath,
    `export const storyModifiedDates: Record<string, string> = {
  "ep-18": "2026-07-07T01:45:00Z",
};

export const STORY_MODIFIED_DATE_SOURCE: Record<string, string> = {
  "ep-18": "aaafa19 public/stories/ep-18 MVP sync",
};
`,
    "utf8",
  );

  return { root, zonesPath, promptsPath, datesPath };
}

describe("inferZoneId", () => {
  it("恐龍車 → dino", () => {
    expect(
      inferZoneId("恐龍車多多闖禍了｜不能亂開車門｜安全故事"),
    ).toBe("dino");
  });

  it("水上樂園 → ocean", () => {
    expect(inferZoneId("小紅賽車玩到不想離開｜水上樂園說再見")).toBe("ocean");
  });

  it("消防車 → rescue", () => {
    expect(inferZoneId("雙胞胎消防車合作任務")).toBe("rescue");
  });

  it("挖土機 → forest", () => {
    expect(inferZoneId("東東挖土機的勇氣任務")).toBe("forest");
  });

  it("一般車輛 → car-park", () => {
    expect(inferZoneId("香香的粽子餐車")).toBe("car-park");
  });
});

describe("buildReflectionStub", () => {
  it("child 以問號結尾、parentFollowUp 非空", () => {
    const stub = buildReflectionStub(
      "恐龍車多多闖禍了｜不能亂開車門｜安全故事",
    );
    expect(stub.child).toMatch(/[？?]$/);
    expect(stub.parentFollowUp.trim().length).toBeGreaterThan(0);
  });
});

describe("upsertCatalogSidecars", () => {
  it("新集缺 sidecar 時寫入 zone／reflection／dates", () => {
    const { root, zonesPath, promptsPath, datesPath } = makeFixtureRoot();

    const result = upsertCatalogSidecars(
      [
        {
          slug: "ep-19",
          title: "恐龍車多多闖禍了｜不能亂開車門｜安全故事",
        },
      ],
      {
        root,
        nowIso: "2026-07-15T01:00:00.000Z",
        gitShortSha: "abc1234",
      },
    );

    expect(result.updatedSlugs).toEqual(["ep-19"]);
    expect(fs.readFileSync(zonesPath, "utf8")).toContain(
      '"ep-19": "dino"',
    );
    expect(fs.readFileSync(promptsPath, "utf8")).toContain('"ep-19":');
    expect(fs.readFileSync(promptsPath, "utf8")).toMatch(/[？?]",?\n/);
    expect(fs.readFileSync(datesPath, "utf8")).toContain(
      '"ep-19": "2026-07-15T01:00:00.000Z"',
    );
    expect(fs.readFileSync(datesPath, "utf8")).toContain(
      '"ep-19": "abc1234 sync Apple RSS MVP"',
    );
  });

  it("已有 sidecar 不覆寫", () => {
    const { root, zonesPath, promptsPath, datesPath } = makeFixtureRoot();

    const result = upsertCatalogSidecars(
      [{ slug: "ep-18", title: "水上樂園練習說再見" }],
      {
        root,
        nowIso: "2026-07-15T01:00:00.000Z",
        gitShortSha: "abc1234",
      },
    );

    expect(result.updatedSlugs).toEqual([]);
    expect(fs.readFileSync(zonesPath, "utf8")).toContain(
      '"ep-18": "ocean"',
    );
    expect(fs.readFileSync(promptsPath, "utf8")).toContain("既有問句？");
    expect(fs.readFileSync(datesPath, "utf8")).not.toContain("abc1234");
  });
});
