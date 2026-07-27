import {
  isSnowboardCourseId,
  type SnowboardCourseId,
} from "./course";
import {
  isSnowboardVisualPose,
  isSnowboardVisualStage,
} from "./visual-qa";

const SNOWBOARD_EXPORT_PATH = "/snowboard/v2/index.html";

function mayForwardDebugQuery(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

export function snowboardIframeSrc(
  debugFinish?: string,
  visualStage?: string,
  visualPose?: string,
): string {
  const params = new URLSearchParams();
  const allowDebugQuery = mayForwardDebugQuery();
  if (allowDebugQuery && debugFinish && isSnowboardCourseId(debugFinish)) {
    params.set("debugFinish", debugFinish satisfies SnowboardCourseId);
  }
  if (allowDebugQuery && isSnowboardVisualStage(visualStage)) {
    params.set("visualStage", visualStage);
  }
  if (allowDebugQuery && isSnowboardVisualPose(visualPose)) {
    params.set("visualPose", visualPose);
  }
  const query = params.toString();
  return query ? `${SNOWBOARD_EXPORT_PATH}?${query}` : SNOWBOARD_EXPORT_PATH;
}
