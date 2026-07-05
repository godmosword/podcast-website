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

/** 鈴鐺 icon（取代 🔔 emoji）：1em + currentColor 隨按鈕字級與墨色。 */
function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ verticalAlign: "-0.125em" }}
    >
      <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v.58A6.5 6.5 0 0 1 18.5 10.5v3.9l1.35 2.43a1 1 0 0 1-.87 1.49H5.02a1 1 0 0 1-.87-1.49L5.5 14.4v-3.9a6.5 6.5 0 0 1 5-6.32V3.5A1.5 1.5 0 0 1 12 2Zm-2.45 17.32h4.9a2.45 2.45 0 0 1-4.9 0Z" />
    </svg>
  );
}

export default function ZoneWishForm({ zoneId, fallbackHref, onSubmitSuccess }: Props) {
  const contactId = useId();
  const messageId = useId();
  const consentId = useId();
  const [state, setState] = useState<FormState>("loading");
  const [category, setCategory] = useState<WishCategory>("feature");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [parentConsent, setParentConsent] = useState(false);
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

    if (!parentConsent) return;
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
          parentConsent,
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
        <BellIcon /> 通知我開幕
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
        <span>我是家長／照顧者，同意提供以上資料以接收開幕通知與需求統計</span>
      </label>

      <button
        className={styles.submit}
        type="submit"
        disabled={submitting || !parentConsent}
      >
        {submitting ? (
          "送出中…"
        ) : isStory ? (
          "送出故事許願"
        ) : (
          <>
            <BellIcon /> 通知我開幕
          </>
        )}
      </button>
      <p className={styles.privacyNote}>
        資料如何使用與刪除，請見{" "}
        <a className={styles.fallbackLink} href="/legal#privacy">
          隱私說明
        </a>
      </p>
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
