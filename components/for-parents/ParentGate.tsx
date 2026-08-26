"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  createParentGateChallenge,
  isParentGateAnswerCorrect,
  writeParentGatePassed,
  type ParentGateChallenge,
} from "@/lib/parent-gate";
import styles from "./ParentGate.module.css";

type ParentGateProps = {
  onPass: () => void;
  /** 測試可注入固定題目。 */
  createChallenge?: () => ParentGateChallenge;
};

/** 進家庭儀表板前的算術閘門（UX-P0-1，僅 dashboard）。 */
export default function ParentGate({
  onPass,
  createChallenge = createParentGateChallenge,
}: ParentGateProps) {
  const questionId = useId();
  const errorId = useId();
  const [challenge, setChallenge] = useState<ParentGateChallenge | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setChallenge(createChallenge());
  }, [createChallenge]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge) return;
    if (isParentGateAnswerCorrect(challenge, value)) {
      writeParentGatePassed();
      onPass();
      return;
    }
    setError(true);
    setValue("");
    setChallenge(createChallenge());
  }

  return (
    <section className={styles.wrap} data-parent-gate="locked">
      <p className={styles.eyebrow}>給爸爸媽媽</p>
      <h1 className={styles.title}>先確認是家長</h1>
      <p className={styles.lede}>
        這頁有兒童模式等設定。請先算一題，避免小朋友誤觸。
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.question} id={questionId} htmlFor={`${questionId}-input`}>
          {challenge ? `${challenge.prompt} 等於多少？` : "算術題載入中"}
        </label>
        <input
          id={`${questionId}-input`}
          className={styles.input}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={3}
          value={value}
          disabled={!challenge}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(false);
          }}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error || undefined}
        />
        {error ? (
          <p className={styles.error} id={errorId} role="alert">
            答案不對，換一題再試。
          </p>
        ) : null}
        <button type="submit" className={styles.submit} disabled={!challenge}>
          打開儀表板
        </button>
      </form>

      <Link href="/for-parents" className={styles.back}>
        ← 回到親子指南
      </Link>
    </section>
  );
}
