/** 圓章背景色輪播（淡色 color-mix 用）。 */
export const FEEDBACK_AVATAR_COLORS = [
  "pink",
  "yellow",
  "mint",
  "sky",
  "teal",
  "lilac",
] as const;

export type FeedbackAvatarColor = (typeof FEEDBACK_AVATAR_COLORS)[number];

/** 暱稱 hash，供穩定配色。 */
export function hashNickname(nickname: string): number {
  let hash = 0;
  for (let i = 0; i < nickname.length; i += 1) {
    hash = (Math.imul(31, hash) + nickname.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** 暱稱 → 圓章色票。 */
export function feedbackAvatarColor(nickname: string): FeedbackAvatarColor {
  return FEEDBACK_AVATAR_COLORS[hashNickname(nickname) % FEEDBACK_AVATAR_COLORS.length];
}

/** 暱稱 → 圓章首字（空白時 ?）。 */
export function feedbackAvatarInitial(nickname: string): string {
  const trimmed = nickname.trim();
  if (!trimmed) return "?";
  return [...trimmed][0] ?? "?";
}
