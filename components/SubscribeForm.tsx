"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import { trackSubscribeSubmit } from "@/lib/analytics";
import {
  SUBSCRIBE_CONSENT_AFTER_PRIVACY,
  SUBSCRIBE_CONSENT_BEFORE_PRIVACY,
  SUBSCRIBE_EMAIL_LABEL,
  SUBSCRIBE_EMAIL_PLACEHOLDER,
  SUBSCRIBE_ERROR,
  SUBSCRIBE_LOADING_LABEL,
  SUBSCRIBE_PRIVACY_LINK_LABEL,
  SUBSCRIBE_PRIVACY_NOTE,
  SUBSCRIBE_SUBMIT_LABEL,
  SUBSCRIBE_SUBMITTING_LABEL,
  SUBSCRIBE_SUCCESS,
  SUBSCRIBE_UNAVAILABLE_LINK,
  SUBSCRIBE_UNAVAILABLE_PREFIX,
  SUBSCRIBE_UNAVAILABLE_SUFFIX,
} from "@/lib/subscribe-copy";
import styles from "./SubscribeForm.module.css";

type FormState = "loading" | "form" | "success" | "error" | "unavailable";

type Props = {
  /** Analytics／DB 來源標記 */
  source?: string;
};

export default function SubscribeForm({ source = "subscribe_page" }: Props) {
  const emailId = useId();
  const consentId = useId();
  const [state, setState] = useState<FormState>("loading");
  const [email, setEmail] = useState("");
  const [parentConsent, setParentConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      try {
        const res = await fetch("/api/subscribe", { method: "GET" });
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
    if (!parentConsent) return;

    setSubmitting(true);
    setState("form");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, parentConsent, source }),
      });

      if (res.status === 503) {
        setState("unavailable");
        return;
      }

      if (!res.ok) {
        setState("error");
        return;
      }

      setState("success");
      trackSubscribeSubmit(source);
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "loading") {
    return (
      <p className={styles.hint} role="status">
        {SUBSCRIBE_LOADING_LABEL}
      </p>
    );
  }

  if (state === "unavailable") {
    return (
      <p className={styles.unavailable}>
        {SUBSCRIBE_UNAVAILABLE_PREFIX}{" "}
        <Link href="/#connect">{SUBSCRIBE_UNAVAILABLE_LINK}</Link>{" "}
        {SUBSCRIBE_UNAVAILABLE_SUFFIX}
      </p>
    );
  }

  if (state === "success") {
    return (
      <p className={styles.success} role="status">
        {SUBSCRIBE_SUCCESS}
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor={emailId}>
        {SUBSCRIBE_EMAIL_LABEL}
      </label>
      <input
        id={emailId}
        className={styles.input}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={SUBSCRIBE_EMAIL_PLACEHOLDER}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting}
        required
      />

      <label className={styles.consent} htmlFor={consentId}>
        <input
          id={consentId}
          className={styles.consentCheckbox}
          type="checkbox"
          checked={parentConsent}
          onChange={(e) => setParentConsent(e.target.checked)}
          disabled={submitting}
          required
        />
        <span>
          {SUBSCRIBE_CONSENT_BEFORE_PRIVACY}
          <Link href="/legal#privacy" aria-label="閱讀隱私說明">
            {SUBSCRIBE_PRIVACY_LINK_LABEL}
          </Link>
          {SUBSCRIBE_CONSENT_AFTER_PRIVACY}
        </span>
      </label>

      <button
        className={styles.submit}
        type="submit"
        disabled={submitting || !parentConsent}
        aria-busy={submitting || undefined}
      >
        {submitting ? SUBSCRIBE_SUBMITTING_LABEL : SUBSCRIBE_SUBMIT_LABEL}
      </button>

      <p className={styles.privacyNote}>
        {SUBSCRIBE_PRIVACY_NOTE} 詳見{" "}
        <Link className={styles.privacyLink} href="/legal#privacy">
          {SUBSCRIBE_PRIVACY_LINK_LABEL}
        </Link>
        。
      </p>

      {state === "error" ? (
        <p className={styles.error} role="alert">
          {SUBSCRIBE_ERROR}
        </p>
      ) : null}
    </form>
  );
}
