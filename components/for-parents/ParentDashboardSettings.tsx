"use client";

import { useState } from "react";
import { clearActivityLog } from "@/lib/activity-log";
import {
  saveGameKitSettingsToStore,
  setSfxEnabledInStore,
} from "@/lib/progress-store";
import styles from "./parent-dashboard.module.css";

function SettingSwitch({
  label,
  hint,
  checked,
  onToggle,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={styles.settingRow}>
      <div>
        <span className={styles.settingLabel}>{label}</span>
        <span className={styles.settingHint}>{hint}</span>
      </div>
      <button
        type="button"
        className={`${styles.toggle}${checked ? ` ${styles.toggleOn}` : ""}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
      >
        <span className={styles.toggleKnob} aria-hidden />
      </button>
    </div>
  );
}

function ClearActivityControl() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div className={styles.settingRow}>
        <div>
          <span className={styles.settingLabel}>活動紀錄</span>
          <span className={styles.settingHint}>
            只清除這台裝置上的收聽與遊戲時間
          </span>
        </div>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => setConfirming(true)}
        >
          清除活動紀錄
        </button>
      </div>
    );
  }

  return (
    <div className={styles.confirmBlock}>
      <p className={styles.settingHint}>
        會清掉這台裝置上的收聽與遊戲時間。收藏、星星和聽完紀錄會保留。
      </p>
      <div className={styles.confirmActions}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => setConfirming(false)}
        >
          取消
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.actionButtonStrong}`}
          onClick={() => {
            clearActivityLog();
            setConfirming(false);
          }}
        >
          確定清除
        </button>
      </div>
    </div>
  );
}

/** 家長設定：兒童模式、音效、清除活動紀錄（二段確認）。 */
export function ParentDashboardSettings({
  kidsMode,
  sfxEnabled,
}: {
  kidsMode: boolean;
  sfxEnabled: boolean;
}) {
  return (
    <section className={styles.card} aria-labelledby="settings-heading">
      <h2 id="settings-heading" className={styles.cardTitle}>
        家長快速設定
      </h2>
      <div className={styles.settings}>
        <SettingSwitch
          label="兒童模式"
          hint="簡化遊戲介面，減少干擾選項"
          checked={kidsMode}
          onToggle={() => saveGameKitSettingsToStore({ kidsMode: !kidsMode })}
        />
        <SettingSwitch
          label="遊戲音效"
          hint="關閉後故事與遊戲音效會靜音"
          checked={sfxEnabled}
          onToggle={() => setSfxEnabledInStore(!sfxEnabled)}
        />
        <ClearActivityControl />
      </div>
    </section>
  );
}
