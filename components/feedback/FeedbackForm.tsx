"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useState } from "react";
import { submitFeedback } from "@/app/feedback/actions";
import {
  FEEDBACK_ACTION_IDLE,
  FEEDBACK_HONEYPOT_FIELD,
  FEEDBACK_STARTED_AT_FIELD,
} from "@/lib/feedback-action";
import { feedbackMailtoHref } from "@/lib/contact";
import {
  FEEDBACK_CHAR_REMAINING,
  FEEDBACK_EMAIL_LABEL,
  FEEDBACK_MAILTO_LINK,
  FEEDBACK_MESSAGE_FIELD_ID,
  FEEDBACK_MESSAGE_LABEL,
  FEEDBACK_NICKNAME_LABEL,
  FEEDBACK_PAGE_TITLE_ID,
  FEEDBACK_SUBMIT_LABEL,
} from "@/lib/feedback-copy";
import { FEEDBACK_MESSAGE_MAX } from "@/lib/feedback-schema";
import styles from "./FeedbackForm.module.css";

type Props = {
  available: boolean;
};

export default function FeedbackForm({ available }: Props) {
  const nicknameId = useId();
  const emailId = useId();
  const messageId = FEEDBACK_MESSAGE_FIELD_ID;
  const honeypotId = useId();

  const [state, formAction, pending] = useActionState(submitFeedback, FEEDBACK_ACTION_IDLE);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [startedAt, setStartedAt] = useState("");

  const remaining = FEEDBACK_MESSAGE_MAX - message.length;
  const showMailtoFallback = !available || state.status === "unavailable";
  const mailtoHref = feedbackMailtoHref(
    showMailtoFallback ? { nickname, message } : undefined,
  );

  useEffect(() => {
    setStartedAt(String(Date.now()));
  }, []);

  useEffect(() => {
    if (state.status !== "success") return;
    setNickname("");
    setEmail("");
    setMessage("");
    setStartedAt(String(Date.now()));
  }, [state]);

  return (
    <form
      className={styles.form}
      action={formAction}
      aria-labelledby={FEEDBACK_PAGE_TITLE_ID}
    >
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={honeypotId}>網站</label>
        <input
          id={honeypotId}
          name={FEEDBACK_HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <input type="hidden" name={FEEDBACK_STARTED_AT_FIELD} value={startedAt} />

      {state.status === "success" ? (
        <p className={styles.success} role="status" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <label className={styles.label} htmlFor={nicknameId}>
        {FEEDBACK_NICKNAME_LABEL}
      </label>
      <input
        id={nicknameId}
        className={styles.input}
        type="text"
        name="nickname"
        autoComplete="nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        disabled={pending}
        required
        maxLength={40}
      />

      <label className={styles.label} htmlFor={emailId}>
        {FEEDBACK_EMAIL_LABEL}
      </label>
      <input
        id={emailId}
        className={styles.input}
        type="email"
        name="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={pending}
      />

      <label className={styles.label} htmlFor={messageId}>
        {FEEDBACK_MESSAGE_LABEL}
      </label>
      <textarea
        id={messageId}
        className={styles.textarea}
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={pending}
        required
        maxLength={FEEDBACK_MESSAGE_MAX}
      />
      <div className={styles.messageMeta}>
        <p
          className={styles.charCount}
          aria-live={remaining <= 20 ? "polite" : undefined}
        >
          {FEEDBACK_CHAR_REMAINING(remaining)}
        </p>
      </div>

      <button
        className={styles.submit}
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
      >
        {FEEDBACK_SUBMIT_LABEL}
      </button>

      {state.status === "error" || state.status === "unavailable" ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}

      {showMailtoFallback ? (
        <Link className={styles.mailtoButton} href={mailtoHref}>
          {FEEDBACK_MAILTO_LINK}
        </Link>
      ) : null}
    </form>
  );
}
