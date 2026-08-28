"use client";

import {
  FormEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  PARENT_GATE_COPY,
  checkParentGateAnswer,
  createParentGateChallenge,
  readParentGatePassed,
  writeParentGatePassed,
  type ParentGateChallenge,
} from "@/lib/parent-gate";
import styles from "./ParentGate.module.css";

/**
 * 家長閘門：防止孩子誤觸家長設定的減速帶，不是驗證、授權或安全機制。
 *
 * 範圍僅 `/for-parents/dashboard` 的儀表板內容。不含 GameKit 兒童模式開關：
 * 1. `lib/gamekit/progress/settings.ts` 的 `kidsMode` 預設為 `true`。
 *    孩子誤觸只會停在安全值，沒有要防的損害。
 * 2. 把算術題擋在遊戲模式切換前，等於在孩子的主路徑上放一道為大人設計的牆，
 *    與稽核「兒童主路徑 B+」的方向相反。
 * 3. 之後真需要再擴容易；從已上線的大範圍縮回來要動既有行為，成本高得多。
 */
type ParentGateProps = {
  children: ReactNode;
};

type GateStatus = "checking" | "locked" | "open";

export function ParentGate({ children }: ParentGateProps) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [challenge, setChallenge] = useState<ParentGateChallenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [showRetry, setShowRetry] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (readParentGatePassed()) {
      setStatus("open");
      return;
    }
    setChallenge(createParentGateChallenge());
    setStatus("locked");
  }, []);

  useEffect(() => {
    if (status !== "locked") return;
    inputRef.current?.focus();
  }, [status, challenge]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge) return;
    if (checkParentGateAnswer(challenge, answer)) {
      writeParentGatePassed();
      setStatus("open");
      return;
    }
    setAnswer("");
    setShowRetry(true);
    setChallenge(createParentGateChallenge());
  }

  if (status === "checking") {
    return (
      <div className={styles.placeholder} aria-hidden="true" />
    );
  }

  if (status === "open") {
    return <>{children}</>;
  }

  const questionLabel = `${PARENT_GATE_COPY.questionPrefix} ${challenge?.prompt ?? ""}`;

  return (
    <section className={styles.panel} aria-labelledby="parent-gate-title">
      <h2 id="parent-gate-title" className={styles.title}>
        {PARENT_GATE_COPY.title}
      </h2>
      <p className={styles.hint}>{PARENT_GATE_COPY.hint}</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="parent-gate-answer">
          {questionLabel}
        </label>
        <input
          ref={inputRef}
          id="parent-gate-answer"
          className={styles.input}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="done"
          placeholder={PARENT_GATE_COPY.answerPlaceholder}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          aria-describedby={showRetry ? "parent-gate-retry" : undefined}
          aria-invalid={showRetry || undefined}
        />
        {showRetry ? (
          <p
            id="parent-gate-retry"
            className={styles.retry}
            role="alert"
          >
            {PARENT_GATE_COPY.retry}
          </p>
        ) : null}
        <button className={styles.submit} type="submit">
          {PARENT_GATE_COPY.submit}
        </button>
      </form>
    </section>
  );
}
