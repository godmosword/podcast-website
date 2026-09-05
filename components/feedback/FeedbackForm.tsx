"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import { feedbackMailtoHref } from "@/lib/contact";
import {
  FEEDBACK_CHAR_REMAINING,
  FEEDBACK_EMAIL_HINT,
  FEEDBACK_EMAIL_LABEL,
  FEEDBACK_ERROR,
  FEEDBACK_LOADING_LABEL,
  FEEDBACK_MAILTO_LEAD,
  FEEDBACK_MAILTO_LINK,
  FEEDBACK_MESSAGE_HINT,
  FEEDBACK_MESSAGE_LABEL,
  FEEDBACK_NICKNAME_LABEL,
  FEEDBACK_PARENT_CONSENT_AFTER,
  FEEDBACK_PARENT_CONSENT_BEFORE,
  FEEDBACK_PARENT_CONSENT_LINK,
  FEEDBACK_PUBLISH_CONSENT,
  FEEDBACK_RATE_LIMITED,
  FEEDBACK_SUBMIT_DISABLED_HINT,
  FEEDBACK_SUBMIT_LABEL,
  FEEDBACK_SUCCESS,
  FEEDBACK_VALIDATION_ERROR,
} from "@/lib/feedback-copy";
import { FEEDBACK_MESSAGE_MAX } from "@/lib/feedback-schema";
import styles from "./FeedbackForm.module.css";

export const FEEDBACK_MESSAGE_FIELD_ID = "feedback-message";

type FormState = "loading" | "form" | "success" | "error" | "unavailable";

export default function FeedbackForm() {
  const nicknameId = useId();
  const emailId = useId();
  const messageId = FEEDBACK_MESSAGE_FIELD_ID;
  const parentConsentId = useId();
  const publishConsentId = useId();

  const [state, setState] = useState<FormState>("loading");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [parentConsent, setParentConsent] = useState(false);
  const [publishConsent, setPublishConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorCopy, setErrorCopy] = useState(FEEDBACK_ERROR);

  const remaining = FEEDBACK_MESSAGE_MAX - message.length;
  const bothConsented = parentConsent && publishConsent;

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      try {
        const res = await fetch("/api/feedback", { method: "GET" });
        if (!res.ok) throw new Error("probe failed");
        const data = (await res.json()) as { available?: boolean };
        if (!cancelled) {
          setState(data.available ? "form" : "unavailable");
        }
      } catch {
        if (!cancelled) setState("unavailable");
      }
    }

    void probe();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!bothConsented) return;

    setSubmitting(true);
    setState("form");
    setErrorCopy(FEEDBACK_ERROR);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          email,
          message,
          parentConsent: true,
          publishConsent: true,
        }),
      });

      if (res.status === 503) {
        setState("unavailable");
        return;
      }

      if (res.status === 429) {
        setErrorCopy(FEEDBACK_RATE_LIMITED);
        setState("error");
        return;
      }

      if (res.status === 400) {
        setErrorCopy(FEEDBACK_VALIDATION_ERROR);
        setState("error");
        return;
      }

      if (res.status !== 201) {
        setState("error");
        return;
      }

      setMessage("");
      setState("success");
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "loading") {
    return (
      <p className={styles.loading} role="status">
        {FEEDBACK_LOADING_LABEL}
      </p>
    );
  }

  if (state === "unavailable") {
    return (
      <p className={styles.unavailable}>
        {FEEDBACK_MAILTO_LEAD}{" "}
        <Link href={feedbackMailtoHref()}>{FEEDBACK_MAILTO_LINK}</Link>
      </p>
    );
  }

  if (state === "success") {
    return (
      <p className={styles.success} role="status">
        {FEEDBACK_SUCCESS}
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={styles.label} htmlFor={nicknameId}>
        {FEEDBACK_NICKNAME_LABEL}
      </label>
      <input
        id={nicknameId}
        className={styles.input}
        type="text"
        autoComplete="nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        disabled={submitting}
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
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting}
        required
      />
      <p className={styles.hint}>{FEEDBACK_EMAIL_HINT}</p>

      <label className={styles.label} htmlFor={messageId}>
        {FEEDBACK_MESSAGE_LABEL}
      </label>
      <textarea
        id={messageId}
        className={styles.textarea}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={submitting}
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

      <label className={styles.consent} htmlFor={parentConsentId}>
        <input
          id={parentConsentId}
          className={styles.consentCheckbox}
          type="checkbox"
          checked={parentConsent}
          onChange={(e) => setParentConsent(e.target.checked)}
          disabled={submitting}
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
          checked={publishConsent}
          onChange={(e) => setPublishConsent(e.target.checked)}
          disabled={submitting}
          required
        />
        <span>{FEEDBACK_PUBLISH_CONSENT}</span>
      </label>

      <button
        className={styles.submit}
        type="submit"
        disabled={submitting || !bothConsented}
        aria-busy={submitting || undefined}
      >
        {FEEDBACK_SUBMIT_LABEL}
      </button>

      {!bothConsented ? (
        <p className={styles.disabledHint}>{FEEDBACK_SUBMIT_DISABLED_HINT}</p>
      ) : null}

      {state === "error" ? (
        <p className={styles.error} role="alert">
          {errorCopy}
        </p>
      ) : null}
    </form>
  );
}
