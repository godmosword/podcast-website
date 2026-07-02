"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import type { ZoneId } from "@/data/universe-zones";
import { parseWishContact } from "@/lib/zone-wish-schema";
import styles from "./ZoneWishForm.module.css";

type Props = {
  zoneId: ZoneId;
  fallbackHref: string;
  onSubmitSuccess?: (hasEmail: boolean) => void;
};

type FormState = "loading" | "form" | "success" | "error" | "mailto";

export default function ZoneWishForm({ zoneId, fallbackHref, onSubmitSuccess }: Props) {
  const inputId = useId();
  const [state, setState] = useState<FormState>("loading");
  const [contact, setContact] = useState("");
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
    if (!parsed.email && !parsed.nickname) return;

    setSubmitting(true);
    setState("form");

    try {
      const res = await fetch("/api/zone-wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId, ...parsed }),
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
      onSubmitSuccess?.(Boolean(parsed.email));
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
    return <p className={styles.success}>收到你的許願！開幕時通知你</p>;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.srOnly} htmlFor={inputId}>
        暱稱或 Email
      </label>
      <input
        id={inputId}
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
      <button className={styles.submit} type="submit" disabled={submitting}>
        {submitting ? "送出中…" : "🔔 通知我開幕"}
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
