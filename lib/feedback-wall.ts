/** 有核准留言才列牆；空牆只留 CTA，不寫「共 0 則」。 */
export const FEEDBACK_MIN_PUBLIC_MESSAGES = 1;

export function canShowPublicFeedbackList(count: number): boolean {
  return count >= FEEDBACK_MIN_PUBLIC_MESSAGES;
}
