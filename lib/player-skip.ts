import { activeCueIndex } from "./subtitle-cue";

export type IllustrationSkipDirection = -1 | 1;

export type IllustrationSkipInput = {
  currentTime: number;
  duration: number;
  pageCount: number;
  captionTimes?: readonly number[] | null;
  direction: IllustrationSkipDirection;
};

function hasAlignedCueTimes(
  pageCount: number,
  captionTimes: readonly number[] | null | undefined,
): captionTimes is readonly number[] {
  return (
    pageCount > 0 &&
    Array.isArray(captionTimes) &&
    captionTimes.length === pageCount &&
    captionTimes.every((time) => Number.isFinite(time))
  );
}

/** 每一張插圖的起始秒數：優先 captionTimes，否則依音檔時長等分。 */
export function illustrationStartTimes(input: {
  pageCount: number;
  captionTimes?: readonly number[] | null;
  duration: number;
}): number[] {
  const { pageCount, captionTimes, duration } = input;
  if (pageCount <= 0) return [0];
  if (hasAlignedCueTimes(pageCount, captionTimes)) {
    return [...captionTimes];
  }
  if (pageCount === 1) return [0];
  const dur = Number.isFinite(duration) && duration > 0 ? duration : 0;
  if (dur <= 0) {
    return Array.from({ length: pageCount }, () => 0);
  }
  return Array.from({ length: pageCount }, (_, index) => (index * dur) / pageCount);
}

function clampTime(time: number, duration: number): number {
  if (!Number.isFinite(time)) return 0;
  if (Number.isFinite(duration) && duration > 0) {
    return Math.max(0, Math.min(duration, time));
  }
  return Math.max(0, time);
}

/**
 * 快進／倒退改跳插圖：下一張起始秒，或回上一張起始秒。
 * 已在最後一張再快進則維持原時間；第一張倒退回到 0。
 */
export function illustrationSkipTarget(input: IllustrationSkipInput): number {
  const times = illustrationStartTimes(input);
  const currentTime = clampTime(input.currentTime, input.duration);
  const currentIndex = activeCueIndex(times, currentTime, times.length - 1);

  if (input.direction > 0) {
    if (currentIndex >= times.length - 1) return currentTime;
    return clampTime(times[currentIndex + 1] ?? currentTime, input.duration);
  }

  if (currentIndex <= 0) return 0;
  return clampTime(times[currentIndex - 1] ?? 0, input.duration);
}

export function illustrationIndexAt(
  times: readonly number[],
  currentTime: number,
): number {
  if (times.length === 0) return 0;
  return activeCueIndex([...times], currentTime, times.length - 1);
}
