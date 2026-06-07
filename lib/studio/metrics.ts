import metricsFile from "@/data/studio-metrics.json";
import type { PlatformMetrics, StudioMetricsFile } from "./types";

const data = metricsFile as StudioMetricsFile;

export function getStudioMetrics(): StudioMetricsFile {
  return data;
}

export function metricsForPlatform(
  platformId: string,
): PlatformMetrics | undefined {
  return data.platforms.find((p) => p.platformId === platformId);
}
