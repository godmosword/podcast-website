import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SNOWBOARD_COURSES,
  SNOWBOARD_COURSE_ID,
  isSnowboardCourseId,
  snowboardCourseIndex,
} from "./course";

describe("snowboard course contract", () => {
  it("three tracks have stable ids, unlock order and positive par", () => {
    expect(SNOWBOARD_COURSES.map((course) => course.id)).toEqual([
      "bonbon-peak",
      "pine-trail",
      "glacier-night",
    ]);
    expect(SNOWBOARD_COURSES[0].unlockAfter).toBeNull();
    expect(SNOWBOARD_COURSES[1].unlockAfter).toBe("bonbon-peak");
    expect(SNOWBOARD_COURSES[2].unlockAfter).toBe("pine-trail");
    expect(SNOWBOARD_COURSES.every((course) => course.parTimeMs > 0)).toBe(true);
  });

  it("keeps the Godot data-driven Course resource contract visible", () => {
    const course = readFileSync(
      join(process.cwd(), "snowboard-game/scripts/course.gd"),
      "utf8",
    );
    const data = readFileSync(
      join(process.cwd(), "snowboard-game/scripts/course_data.gd"),
      "utf8",
    );
    expect(course).toContain("CourseData");
    expect(course).toContain('"pine-trail"');
    expect(course).toContain('"glacier-night"');
    expect(data).toContain("extends Resource");
    expect(data).toContain("@export var snowflakes");
    expect(data).toContain("@export var ramps");
  });

  it("validates course ids and indexes for medals/unlocks", () => {
    expect(SNOWBOARD_COURSE_ID).toBe("bonbon-peak");
    expect(isSnowboardCourseId("pine-trail")).toBe(true);
    expect(isSnowboardCourseId("unknown")).toBe(false);
    expect(snowboardCourseIndex("glacier-night")).toBe(2);
  });
});
