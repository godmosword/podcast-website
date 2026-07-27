export const SNOWBOARD_COURSES = [
  {
    id: "bonbon-peak",
    name: "糖霜雪峰",
    length: 1200,
    parTimeMs: 95_000,
    snowflakesTotal: 12,
    checkpointSpacing: 120,
    unlockAfter: null,
  },
  {
    id: "pine-trail",
    name: "森林小徑",
    length: 1320,
    parTimeMs: 108_000,
    snowflakesTotal: 14,
    checkpointSpacing: 120,
    unlockAfter: "bonbon-peak",
  },
  {
    id: "glacier-night",
    name: "冰河夜滑",
    length: 1440,
    parTimeMs: 122_000,
    snowflakesTotal: 16,
    checkpointSpacing: 120,
    unlockAfter: "pine-trail",
  },
] as const;

export const SNOWBOARD_COURSE_ID = SNOWBOARD_COURSES[0].id;
export const SNOWBOARD_PAR_TIME_MS = SNOWBOARD_COURSES[0].parTimeMs;
export const SNOWBOARD_SNOWFLAKES_TOTAL = SNOWBOARD_COURSES[0].snowflakesTotal;

export type SnowboardCourse = (typeof SNOWBOARD_COURSES)[number];
export type SnowboardCourseId = SnowboardCourse["id"];

export function isSnowboardCourseId(value: unknown): value is SnowboardCourseId {
  return SNOWBOARD_COURSES.some((course) => course.id === value);
}

export function snowboardCourseById(
  value: string,
): SnowboardCourse | undefined {
  return SNOWBOARD_COURSES.find((course) => course.id === value);
}

export function snowboardCourseIndex(id: SnowboardCourseId): number {
  return SNOWBOARD_COURSES.findIndex((course) => course.id === id);
}
