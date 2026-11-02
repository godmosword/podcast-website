"use client";

import { useState, type FormEvent } from "react";
import { NEWSLETTER_HONEYPOT_FIELD } from "@/lib/newsletter-subscribe";
import styles from "./NewsletterSubscribeForm.module.css";

const COPY = {
  success: "訂閱成功，之後會在信箱看到新的一期。",
  duplicate: "這個信箱已經訂閱過了。",
  invalid: "請填一個可以收信的電子信箱。",
  unavailable: "電子報訂閱暫時沒有開放，請稍後再試。",
  failed: "訂閱沒有送出，請稍後再試。",
} as const;

export function NewsletterSubscribeForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          [NEWSLETTER_HONEYPOT_FIELD]: String(data.get(NEWSLETTER_HONEYPOT_FIELD) ?? ""),
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; reason?: string; duplicate?: boolean };
      if (payload.ok && payload.duplicate) {
        setMessage(COPY.duplicate);
        return;
      }
      if (payload.ok) {
        setMessage(COPY.success);
        form.reset();
        return;
      }
      if (payload.reason === "invalid_email") {
        setMessage(COPY.invalid);
        return;
      }
      if (payload.reason === "unavailable") {
        setMessage(COPY.unavailable);
        return;
      }
      setMessage(COPY.failed);
    } catch {
      setMessage(COPY.failed);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} aria-label="訂閱電子報">
      <p className={styles.lead}>想收到新的一期，留下信箱就好。下面仍可讀過去的每一期。</p>
      <label className={styles.label} htmlFor="newsletter-email">
        電子信箱
      </label>
      <input
        id="newsletter-email"
        className={styles.input}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        maxLength={254}
      />
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="newsletter-website">網站</label>
        <input
          id="newsletter-website"
          name={NEWSLETTER_HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? "送出中" : "訂閱"}
      </button>
      {message ? (
        <p className={styles.status} role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
