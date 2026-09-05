export const FEEDBACK_HONEYPOT_FIELD = "website";
export const FEEDBACK_STARTED_AT_FIELD = "startedAt";
export const FEEDBACK_MIN_FILL_MS = 3000;

export type FeedbackActionState = {
  status: "idle" | "success" | "error" | "unavailable";
  message: string;
};

export const FEEDBACK_ACTION_IDLE: FeedbackActionState = {
  status: "idle",
  message: "",
};
