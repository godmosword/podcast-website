import {
  isSnowboardCourseId,
  type SnowboardCourseId,
} from "./course";

const SNOWBOARD_EXPORT_PATH = "/snowboard/index.html";
const VISUAL_STAGES = ["start", "forest", "valley", "finish"] as const;
const VISUAL_POSES = ["ride", "carve", "jump", "landing"] as const;

export function snowboardIframeSrc(
  debugFinish?: string,
  visualStage?: string,
  visualPose?: string,
): string {
  const params = new URLSearchParams();
  if (debugFinish && isSnowboardCourseId(debugFinish)) {
    params.set("debugFinish", debugFinish satisfies SnowboardCourseId);
  }
  if (visualStage && VISUAL_STAGES.some((stage) => stage === visualStage)) {
    params.set("visualStage", visualStage);
  }
  if (visualPose && VISUAL_POSES.some((pose) => pose === visualPose)) {
    params.set("visualPose", visualPose);
  }
  const query = params.toString();
  return query ? `${SNOWBOARD_EXPORT_PATH}?${query}` : SNOWBOARD_EXPORT_PATH;
}
