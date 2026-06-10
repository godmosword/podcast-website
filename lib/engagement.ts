import {
  getProgressSync,
  updateProgress,
  type ProgressStore,
} from "@/lib/progress-store";

export type EngagementMetrics = ProgressStore["engagement"];

function touch(): EngagementMetrics {
  return getProgressSync().engagement;
}

export function recordStoryCompleted(slug: string): void {
  void updateProgress((prev) => {
    const engagement = { ...prev.engagement };
    if (!engagement.storiesCompleted.includes(slug)) {
      engagement.storiesCompleted = [...engagement.storiesCompleted, slug];
    }
    return { engagement };
  });
}

export function recordReflectionShown(slug: string): void {
  void updateProgress((prev) => {
    const engagement = { ...prev.engagement };
    if (!engagement.reflectionShown.includes(slug)) {
      engagement.reflectionShown = [...engagement.reflectionShown, slug];
    }
    return { engagement };
  });
}

export function recordPlatformClick(platform: string): void {
  void updateProgress((prev) => {
    const engagement = { ...prev.engagement };
    engagement.platformClicks[platform] =
      (engagement.platformClicks[platform] ?? 0) + 1;
    return { engagement };
  });
}

export function getEngagementMetrics(): EngagementMetrics {
  return touch();
}
