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
  FEEDBACK_EMAIL_HINT,
  FEEDBACK_EMAIL_LABEL,
  FEEDBACK_EYEBROW,
  FEEDBACK_FORM_HEADING,
  FEEDBACK_FORM_HEADING_ID,
  FEEDBACK_FORM_LEAD,
  FEEDBACK_INVITE_PARENT,
  FEEDBACK_MAILTO_LEAD,
  FEEDBACK_MAILTO_LINK,
  FEEDBACK_MESSAGE_FIELD_ID,
  FEEDBACK_MESSAGE_HINT,
  FEEDBACK_MESSAGE_LABEL,
  FEEDBACK_NICKNAME_LABEL,
  FEEDBACK_PARENT_CONSENT_AFTER,
  FEEDBACK_PARENT_CONSENT_BEFORE,
  FEEDBACK_PARENT_CONSENT_LINK,
  FEEDBACK_PUBLISH_CONSENT,
  FEEDBACK_REVIEW_LEAD,
  FEEDBACK_STARTERS,
  FEEDBACK_STARTERS_LABEL,
  FEEDBACK_SUBMIT_DISABLED_HINT,
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
  const parentConsentId = useId();
  const publishConsentId = useId();
  const honeypotId = useId();
  const startersId = useId();

  const [state, formAction, pending] = useActionState(submitFeedback, FEEDBACK_ACTION_IDLE);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [parentConsent, setParentConsent] = useState(false);
  const [publishConsent, setPublishConsent] = useState(false);
  const [startedAt, setStartedAt] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const remaining = FEEDBACK_MESSAGE_MAX - message.length;
  const bothConsented = parentConsent && publishConsent;
  const showMailtoFallback = !available || state.status === "unavailable";
  const mailtoHref = feedbackMailtoHref(
    showMailtoFallback ? { nickname, message } : undefined,
  );

  useEffect(() => {
    setHydrated(true);
    setStartedAt(String(Date.now()));
  }, []);

  useEffect(() => {
    if (state.status !== "success") return;
    setNickname("");
    setEmail("");
    setMessage("");
    setParentConsent(false);
    setPublishConsent(false);
    setStartedAt(String(Date.now()));
  }, [state]);

  const submitDisabled = pending || (hydrated && !bothConsented);

  return (
    <form
      className={styles.form}
      action={formAction}
      aria-labelledby={FEEDBACK_FORM_HEADING_ID}
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

      <h2 id={FEEDBACK_FORM_HEADING_ID} className={styles.heading}>
        {FEEDBACK_FORM_HEADING}
      </h2>
      <p className={styles.lead}>{FEEDBACK_FORM_LEAD}</p>

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
        required
      />
      <p className={styles.hint}>{FEEDBACK_EMAIL_HINT}</p>

      <label className={styles.label} htmlFor={messageId}>
        {FEEDBACK_MESSAGE_LABEL}
      </label>
      <p id={startersId} className={styles.startersLabel}>
        {FEEDBACK_STARTERS_LABEL}
      </p>
      <div className={styles.starters} role="group" aria-labelledby={startersId}>
        {FEEDBACK_STARTERS.map((starter) => {
          const pressed = message === starter.text;
          return (
            <button
              key={starter.id}
              type="button"
              className={styles.starter}
              aria-pressed={pressed}
              disabled={pending}
              onClick={() => setMessage(starter.text)}
            >
              {starter.label}
            </button>
          );
        })}
      </div>
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
      <p className={styles.hint}>{FEEDBACK_MESSAGE_HINT}</p>
      <div className={styles.messageMeta}>
        <p
          className={styles.charCount}
          aria-live={remaining <= 20 ? "polite" : undefined}
        >
          {FEEDBACK_CHAR_REMAINING(remaining)}
        </p>
      </div>

      <p className={styles.parentNote}>
        <span className={styles.eyebrow}>{FEEDBACK_EYEBROW}</span>
        {FEEDBACK_INVITE_PARENT} {FEEDBACK_REVIEW_LEAD}
      </p>

      <label className={styles.consent} htmlFor={parentConsentId}>
        <input
          id={parentConsentId}
          className={styles.consentCheckbox}
          type="checkbox"
          name="parentConsent"
          value="on"
          checked={parentConsent}
          onChange={(e) => setParentConsent(e.target.checked)}
          disabled={pending}
          required
        />
        <span>
          {FEEDBACK_PARENT_CONSENT_BEFORE}
          <Link href="/legal#privacy" aria-label="閱讀隱私說明">
            {FEEDBACK_PARENT_CONSENT_LINK}
          </Link>
          {FEEDBACK_PARENT_CONSENT_AFTER}
        </span>
      </label>

      <label className={styles.consent} htmlFor={publishConsentId}>
        <input
          id={publishConsentId}
          className={styles.consentCheckbox}
          type="checkbox"
          name="publishConsent"
          value="on"
          checked={publishConsent}
          onChange={(e) => setPublishConsent(e.target.checked)}
          disabled={pending}
          required
        />
        <span>{FEEDBACK_PUBLISH_CONSENT}</span>
      </label>

      <button
        className={styles.submit}
        type="submit"
        disabled={submitDisabled}
        aria-busy={pending || undefined}
      >
        {FEEDBACK_SUBMIT_LABEL}
      </button>

      {!bothConsented ? (
        <p className={styles.disabledHint}>{FEEDBACK_SUBMIT_DISABLED_HINT}</p>
      ) : null}

      {state.status === "error" || state.status === "unavailable" ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}

      {showMailtoFallback ? (
        <div className={styles.fallback}>
          {state.status !== "unavailable" ? (
            <p className={styles.fallbackLead}>{FEEDBACK_MAILTO_LEAD}</p>
          ) : null}
          <Link className={styles.mailtoButton} href={mailtoHref}>
            {FEEDBACK_MAILTO_LINK}
          </Link>
        </div>
      ) : null}
    </form>
  );
}
