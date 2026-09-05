"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import type { FeedbackAdminDto, FeedbackStats } from "@/lib/feedback-admin";
import type { FeedbackKind, FeedbackStatus } from "@/lib/feedback-schema";
import styles from "./FeedbackModerationPanel.module.css";

/** 後台文案（繁中）；公開頁文案在 `lib/feedback-copy.ts`，兩邊不共用。 */
export const MOD_LOADING = "正在確認登入狀態…";
export const MOD_SECRET_LABEL = "審核密語";
export const MOD_LOGIN_SUBMIT = "進入審核";
export const MOD_LOGIN_HINT = "這是製作團隊專用頁面，密語只在伺服器端比對。";
export const MOD_LOGIN_FAILED = "密語不對，請再確認一次。";
export const MOD_LOGIN_RATE_LIMITED = "嘗試次數太多，請稍後再試。";
export const MOD_LOGIN_ERROR = "登入失敗，請稍後再試。";
export const MOD_UNAVAILABLE = "審核後台暫時無法使用（資料庫或密語未設定）。";
export const MOD_LOAD_ERROR = "讀取留言失敗，請重新整理。";
export const MOD_ACTION_ERROR = "操作失敗，請再試一次。";
export const MOD_EMPTY = "目前沒有任何留言。";
export const MOD_LIST_HEADING = "留言列表";
export const MOD_STATS_HEADING = "則數統計";
export const MOD_LOGOUT = "登出審核";
export const MOD_PII_FLAG = "疑似個資，請先確認再核准";
export const MOD_APPROVE = "核准公開";
export const MOD_HIDE = "隱藏";
export const MOD_REOPEN = "退回待審";
export const MOD_DELETE = "刪除";
export const MOD_EMAIL_PREFIX = "信箱";
export const MOD_DELETE_CONFIRM = (nickname: string): string =>
  `確定要永久刪除「${nickname}」的留言嗎？暱稱、信箱與正文都會一併消失，無法復原。`;

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  pending: "待審",
  published: "已公開",
  hidden: "已隱藏",
};

const KIND_LABEL: Record<FeedbackKind, string> = {
  general: "想說的話",
  story_request: "想聽的故事",
};

const STAT_ITEMS: { key: keyof FeedbackStats; label: string }[] = [
  { key: "pending", label: "待審" },
  { key: "published", label: "已公開" },
  { key: "hidden", label: "已隱藏" },
  { key: "needsReview", label: "疑似個資" },
  { key: "storyRequest", label: "想聽的故事" },
];

type Phase = "checking" | "locked" | "ready" | "unavailable";

type ModerationPayload = {
  ok?: boolean;
  reason?: string;
  stats?: FeedbackStats;
  messages?: FeedbackAdminDto[];
};

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateFormatter.format(date);
}

export default function FeedbackModerationPanel() {
  const secretInputId = useId();
  const [phase, setPhase] = useState<Phase>("checking");
  const [secret, setSecret] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [messages, setMessages] = useState<FeedbackAdminDto[]>([]);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/studio/feedback", { method: "GET" });
      if (res.status === 401) {
        setPhase("locked");
        return;
      }
      if (res.status === 503) {
        setPhase("unavailable");
        return;
      }
      if (!res.ok) {
        setActionError(MOD_LOAD_ERROR);
        setPhase("locked");
        return;
      }

      const data = (await res.json()) as ModerationPayload;
      setStats(data.stats ?? null);
      setMessages(data.messages ?? []);
      setActionError(null);
      setPhase("ready");
    } catch {
      setActionError(MOD_LOAD_ERROR);
      setPhase("locked");
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleLogin(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!secret) return;

    setSubmitting(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/studio/feedback/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });

      if (res.status === 429) {
        setLoginError(MOD_LOGIN_RATE_LIMITED);
        return;
      }
      if (res.status === 401) {
        setLoginError(MOD_LOGIN_FAILED);
        return;
      }
      if (!res.ok) {
        setLoginError(MOD_LOGIN_ERROR);
        return;
      }

      setSecret("");
      await loadData();
    } catch {
      setLoginError(MOD_LOGIN_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout(): Promise<void> {
    try {
      await fetch("/api/studio/feedback/auth", { method: "DELETE" });
    } catch {
      // 忽略：無論如何都回到密語表單。
    }
    setStats(null);
    setMessages([]);
    setPhase("locked");
  }

  async function patchStatus(id: string, status: FeedbackStatus): Promise<void> {
    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/studio/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        setPhase("locked");
        return;
      }
      if (!res.ok) {
        setActionError(MOD_ACTION_ERROR);
        return;
      }
      await loadData();
    } catch {
      setActionError(MOD_ACTION_ERROR);
    } finally {
      setBusyId(null);
    }
  }

  async function removeMessage(item: FeedbackAdminDto): Promise<void> {
    if (!window.confirm(MOD_DELETE_CONFIRM(item.nickname))) return;

    setBusyId(item.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/studio/feedback/${item.id}`, { method: "DELETE" });
      if (res.status === 401) {
        setPhase("locked");
        return;
      }
      if (!res.ok) {
        setActionError(MOD_ACTION_ERROR);
        return;
      }
      await loadData();
    } catch {
      setActionError(MOD_ACTION_ERROR);
    } finally {
      setBusyId(null);
    }
  }

  if (phase === "checking") {
    return (
      <p className={styles.hint} role="status">
        {MOD_LOADING}
      </p>
    );
  }

  if (phase === "unavailable") {
    return (
      <p className={styles.unavailable} role="status">
        {MOD_UNAVAILABLE}
      </p>
    );
  }

  if (phase === "locked") {
    return (
      <form className={styles.loginForm} onSubmit={handleLogin}>
        <label className={styles.label} htmlFor={secretInputId}>
          {MOD_SECRET_LABEL}
        </label>
        <input
          id={secretInputId}
          className={styles.input}
          type="password"
          autoComplete="current-password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          disabled={submitting}
          required
        />
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={submitting || secret.length === 0}
          aria-busy={submitting || undefined}
        >
          {MOD_LOGIN_SUBMIT}
        </button>
        <p className={styles.hint}>{MOD_LOGIN_HINT}</p>
        {loginError ? (
          <p className={styles.error} role="alert">
            {loginError}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className={styles.panel}>
      <section className={styles.statsSection} aria-labelledby="feedback-stats-heading">
        <h2 id="feedback-stats-heading" className={styles.heading}>
          {MOD_STATS_HEADING}
        </h2>
        <dl className={styles.statsGrid}>
          {STAT_ITEMS.map((item) => (
            <div key={item.key} className={styles.stat}>
              <dt className={styles.statLabel}>{item.label}</dt>
              <dd className={styles.statValue}>{stats?.[item.key] ?? 0}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.listSection} aria-labelledby="feedback-list-heading">
        <div className={styles.listHead}>
          <h2 id="feedback-list-heading" className={styles.heading}>
            {MOD_LIST_HEADING}
          </h2>
          <button className={styles.ghostButton} type="button" onClick={handleLogout}>
            {MOD_LOGOUT}
          </button>
        </div>

        {actionError ? (
          <p className={styles.error} role="alert">
            {actionError}
          </p>
        ) : null}

        {messages.length === 0 ? (
          <p className={styles.hint}>{MOD_EMPTY}</p>
        ) : (
          <ul className={styles.list}>
            {messages.map((item) => (
              <li
                key={item.id}
                className={`${styles.item} ${item.needsReview ? styles.flagged : ""}`}
              >
                <div className={styles.itemHead}>
                  <span className={styles.nickname}>{item.nickname}</span>
                  <time className={styles.time} dateTime={item.createdAt}>
                    {formatCreatedAt(item.createdAt)}
                  </time>
                  <span className={styles.badge}>{STATUS_LABEL[item.status]}</span>
                  <span className={styles.badge}>{KIND_LABEL[item.kind]}</span>
                </div>

                {item.needsReview ? (
                  <p className={styles.piiFlag}>{MOD_PII_FLAG}</p>
                ) : null}

                <p className={styles.message}>{item.message}</p>
                <p className={styles.email}>
                  {MOD_EMAIL_PREFIX}：{item.email}
                </p>

                <div className={styles.actions}>
                  <button
                    className={styles.actionButton}
                    type="button"
                    disabled={busyId === item.id || item.status === "published"}
                    onClick={() => void patchStatus(item.id, "published")}
                    aria-label={`${MOD_APPROVE}：${item.nickname}`}
                  >
                    {MOD_APPROVE}
                  </button>
                  <button
                    className={styles.actionButton}
                    type="button"
                    disabled={busyId === item.id || item.status === "hidden"}
                    onClick={() => void patchStatus(item.id, "hidden")}
                    aria-label={`${MOD_HIDE}：${item.nickname}`}
                  >
                    {MOD_HIDE}
                  </button>
                  {item.status === "hidden" ? (
                    <button
                      className={styles.actionButton}
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void patchStatus(item.id, "pending")}
                      aria-label={`${MOD_REOPEN}：${item.nickname}`}
                    >
                      {MOD_REOPEN}
                    </button>
                  ) : null}
                  <button
                    className={styles.dangerButton}
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void removeMessage(item)}
                    aria-label={`${MOD_DELETE}：${item.nickname}`}
                  >
                    {MOD_DELETE}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
