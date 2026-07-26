import {
  isSnowboardCourseId,
  type SnowboardCourseId,
} from "./course";
import {
  isSnowboardVisualPose,
  isSnowboardVisualStage,
} from "./visual-qa";

const SNOWBOARD_EXPORT_PATH = "/snowboard/index.html";

export function snowboardIframeSrc(
  debugFinish?: string,
  visualStage?: string,
  visualPose?: string,
): string {
  const params = new URLSearchParams();
  if (debugFinish && isSnowboardCourseId(debugFinish)) {
    params.set("debugFinish", debugFinish satisfies SnowboardCourseId);
  }
  if (isSnowboardVisualStage(visualStage)) {
    params.set("visualStage", visualStage);
  }
  if (isSnowboardVisualPose(visualPose)) {
    params.set("visualPose", visualPose);
  }
  const query = params.toString();
  return query ? `${SNOWBOARD_EXPORT_PATH}?${query}` : SNOWBOARD_EXPORT_PATH;
}
