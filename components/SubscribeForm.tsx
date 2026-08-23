"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import { trackSubscribeSubmit } from "@/lib/analytics";
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
        正在準備訂閱表單…
      </p>
    );
  }

  if (state === "unavailable") {
    return (
      <p className={styles.unavailable}>
        訂閱名單暫時無法線上登記，請改從頁尾的{" "}
        <Link href="/#connect">收聽平台</Link> 訂閱節目。
      </p>
    );
  }

  if (state === "success") {
    return (
      <p className={styles.success} role="status">
        確認信已寄出，請到信箱點擊連結；完成確認後才會收到新集通知。
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor={emailId}>
        Email
      </label>
      <input
        id={emailId}
        className={styles.input}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="家長的 Email"
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
          我是家長／照顧者，已閱讀並同意
          <Link href="/legal#privacy" aria-label="閱讀隱私說明">
            隱私說明
          </Link>
          ，同意留下 Email 以接收新集通知
        </span>
      </label>

      <button
        className={styles.submit}
        type="submit"
        disabled={submitting || !parentConsent}
        aria-busy={submitting || undefined}
      >
        {submitting ? "送出中…" : "訂閱新集通知"}
      </button>

      <p className={styles.privacyNote}>
        僅用於新集數通知，不會公開或轉售。詳見{" "}
        <Link className={styles.privacyLink} href="/legal#privacy">
          隱私說明
        </Link>
        。
      </p>

      {state === "error" ? (
        <p className={styles.error} role="alert">
          送出失敗，請再試一次。
        </p>
      ) : null}
    </form>
  );
}
