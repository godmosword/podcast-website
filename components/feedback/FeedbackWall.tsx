import { listPublishedFeedback } from "@/lib/feedback-query";
import FeedbackWallView from "./FeedbackWallView";

type Props = {
  available: boolean;
};

export default async function FeedbackWall({ available }: Props) {
  let messages: Awaited<ReturnType<typeof listPublishedFeedback>> = [];

  if (available) {
    try {
      messages = await listPublishedFeedback();
    } catch {
      messages = [];
    }
  }

  return <FeedbackWallView messages={messages} available={available} />;
}
