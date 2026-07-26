import {
  isSnowboardCourseId,
  type SnowboardCourseId,
} from "./course";

const SNOWBOARD_EXPORT_PATH = "/snowboard/index.html";

export function snowboardIframeSrc(debugFinish?: string): string {
  if (!debugFinish || !isSnowboardCourseId(debugFinish)) {
    return SNOWBOARD_EXPORT_PATH;
  }
  const params = new URLSearchParams({
    debugFinish: debugFinish satisfies SnowboardCourseId,
  });
  return `${SNOWBOARD_EXPORT_PATH}?${params.toString()}`;
}
