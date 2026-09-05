/** 核准則數未達門檻時只示範，不列真留言、不寫「共 0 則」。 */
export const FEEDBACK_MIN_PUBLIC_MESSAGES = 3;

export function canShowPublicFeedbackList(count: number): boolean {
  return count >= FEEDBACK_MIN_PUBLIC_MESSAGES;
}
