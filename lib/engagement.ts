import {
  getProgressSync,
  updateProgress,
  type ProgressStore,
  type ReflectionShownSource,
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

export function recordReflectionShown(
  slug: string,
  source: ReflectionShownSource,
): void {
  void updateProgress((prev) => {
    const engagement = { ...prev.engagement };
    const exists = engagement.reflectionShown.some(
      (event) => event.slug === slug && event.source === source,
    );
    if (!exists) {
      engagement.reflectionShown = [
        ...engagement.reflectionShown,
        { slug, source },
      ];
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
