export const SNOWBOARD_COURSE_ID = "bonbon-peak" as const;
export const SNOWBOARD_PAR_TIME_MS = 95_000;
export const SNOWBOARD_SNOWFLAKES_TOTAL = 12;

export type SnowboardCourseId = typeof SNOWBOARD_COURSE_ID;

export function isSnowboardCourseId(value: string): value is SnowboardCourseId {
  return value === SNOWBOARD_COURSE_ID;
}
