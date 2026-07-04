"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import type { ZoneId } from "@/data/universe-zones";
import type { WishCategory } from "@/lib/zone-wish-schema";
import { parseWishContact } from "@/lib/zone-wish-schema";
import styles from "./ZoneWishForm.module.css";

type Props = {
  zoneId: ZoneId;
  fallbackHref: string;
  onSubmitSuccess?: (result: { hasEmail: boolean; category: WishCategory }) => void;
};

type FormState = "loading" | "form" | "success" | "error" | "mailto";

export default function ZoneWishForm({ zoneId, fallbackHref, onSubmitSuccess }: Props) {
  const contactId = useId();
  const messageId = useId();
  const [state, setState] = useState<FormState>("loading");
  const [category, setCategory] = useState<WishCategory>("feature");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      try {
        const res = await fetch("/api/zone-wish", { method: "GET" });
        if (!res.ok) throw new Error("probe failed");
        const data = (await res.json()) as { available?: boolean };
        if (!cancelled) {
          setState(data.available ? "form" : "mailto");
        }
      } catch {
        if (!cancelled) setState("mailto");
      }
    }

    void probe();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseWishContact(contact);
    const trimmedMessage = message.trim();

    if (category === "feature" && !parsed.email && !parsed.nickname) return;
    if (category === "story" && !trimmedMessage) return;

    setSubmitting(true);
    setState("form");

    try {
      const res = await fetch("/api/zone-wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId,
          category,
          ...(category === "story" ? { message: trimmedMessage } : {}),
          ...parsed,
        }),
      });

      if (res.status === 503) {
        setState("mailto");
        return;
      }

      if (!res.ok) {
        setState("error");
        return;
      }

      setState("success");
      onSubmitSuccess?.({ hasEmail: Boolean(parsed.email), category });
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "loading") {
    return <p className={styles.hint}>載入中…</p>;
  }

  if (state === "mailto") {
    return (
      <a className={styles.notifyBtn} href={fallbackHref}>
        🔔 通知我開幕
      </a>
    );
  }

  if (state === "success") {
    return (
      <p className={styles.success}>
        {category === "story"
          ? "收到你的故事許願！"
          : "收到你的許願！開幕時通知你"}
      </p>
    );
  }

  const isStory = category === "story";

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.segment} role="group" aria-label="許願類型">
        <button
          type="button"
          className={`${styles.segmentBtn} ${!isStory ? styles.segmentActive : ""}`}
          aria-pressed={!isStory}
          onClick={() => setCategory("feature")}
          disabled={submitting}
        >
          島嶼許願
        </button>
        <button
          type="button"
          className={`${styles.segmentBtn} ${isStory ? styles.segmentActive : ""}`}
          aria-pressed={isStory}
          onClick={() => setCategory("story")}
          disabled={submitting}
        >
          我想聽的車車故事
        </button>
      </div>

      {isStory ? (
        <>
          <label className={styles.srOnly} htmlFor={messageId}>
            想聽的車車故事
          </label>
          <textarea
            id={messageId}
            className={styles.textarea}
            placeholder="小朋友想聽什麼車車的故事呢？（例如：垃圾車半夜去哪裡？）"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
            required
            rows={3}
            maxLength={200}
          />
          <label className={styles.srOnly} htmlFor={contactId}>
            暱稱或 Email（選填）
          </label>
          <input
            id={contactId}
            className={styles.input}
            type="text"
            inputMode="text"
            autoComplete="nickname"
            placeholder="暱稱或 Email（選填）"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            disabled={submitting}
          />
        </>
      ) : (
        <>
          <label className={styles.srOnly} htmlFor={contactId}>
            暱稱或 Email
          </label>
          <input
            id={contactId}
            className={styles.input}
            type="text"
            inputMode="text"
            autoComplete="nickname"
            placeholder="暱稱或 Email"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            disabled={submitting}
            required
          />
        </>
      )}

      <button className={styles.submit} type="submit" disabled={submitting}>
        {submitting
          ? "送出中…"
          : isStory
            ? "送出故事許願"
            : "🔔 通知我開幕"}
      </button>
      {state === "error" ? (
        <p className={styles.error} role="alert">
          送出失敗，請再試一次；或改用{" "}
          <a className={styles.fallbackLink} href={fallbackHref}>
            Email 通知
          </a>
        </p>
      ) : null}
    </form>
  );
}
