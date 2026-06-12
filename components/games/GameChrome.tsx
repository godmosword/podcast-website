"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGameKitSettings } from "@/hooks/useGameKitSettings";
import {
  BLOCK_DROP_DIFFICULTIES,
  BLOCK_DROP_SPECIAL_MODES,
} from "@/lib/gamekit/settings";
import styles from "./GameChrome.module.css";

type ChromeContextValue = {
  openSettings: () => void;
};

const ChromeContext = createContext<ChromeContextValue>({
  openSettings: () => {},
});

export function useOpenGameSettings(): () => void {
  return useContext(ChromeContext).openSettings;
}

export type GameChromeProps = {
  children: ReactNode;
  canPause?: boolean;
  paused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  announce?: string;
  className?: string;
};

export function GameChromeToolbar({
  canPause = false,
  paused = false,
  onPause,
  onResume,
  soundOn = true,
  onToggleSound,
}: {
  canPause?: boolean;
  paused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  soundOn?: boolean;
  onToggleSound?: () => void;
}) {
  const openSettings = useOpenGameSettings();

  const togglePause = () => {
    if (paused) onResume?.();
    else onPause?.();
  };

  return (
    <div className={styles.toolbar} role="group" aria-label="遊戲控制">
      <Link href="/games" className={styles.toolBtn} aria-label="回遊樂園">
        🎡
      </Link>
      {canPause && (
        <button
          type="button"
          className={styles.toolBtn}
          onClick={togglePause}
          aria-label={paused ? "繼續遊戲" : "暫停遊戲"}
        >
          {paused ? "▶" : "⏸"}
        </button>
      )}
      {onToggleSound && (
        <button
          type="button"
          className={styles.toolBtn}
          onClick={onToggleSound}
          aria-label={soundOn ? "關閉音效" : "開啟音效"}
          aria-pressed={soundOn}
        >
          {soundOn ? "🔊" : "🔇"}
        </button>
      )}
      <button
        type="button"
        className={styles.toolBtn}
        onClick={openSettings}
        aria-label="遊戲設定"
        aria-haspopup="dialog"
      >
        ⚙️
      </button>
    </div>
  );
}

function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    kidsMode,
    blockDropDifficulty,
    blockDropSpecialMode,
    setKidsMode,
    setBlockDropDifficulty,
    setBlockDropSpecialMode,
  } = useGameKitSettings();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className={styles.dialogTitle}>
          遊戲設定
        </h2>
        <label className={styles.settingRow}>
          <span>
            <strong>兒童模式</strong>
            <small>較慢節奏、減少失敗壓力（建議 3–7 歲）</small>
          </span>
          <input
            type="checkbox"
            checked={kidsMode}
            onChange={(e) => setKidsMode(e.target.checked)}
            className={styles.checkbox}
          />
        </label>
        <div className={styles.settingBlock}>
          <div className={styles.settingHeading}>
            <strong>繽紛方塊難度</strong>
            <small>會調整落下速度、鎖定時間與結算加分。</small>
          </div>
          <div className={styles.segmented} role="radiogroup" aria-label="繽紛方塊難度">
            {BLOCK_DROP_DIFFICULTIES.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.segmentBtn}
                aria-pressed={blockDropDifficulty === option.id}
                data-active={blockDropDifficulty === option.id}
                onClick={() => setBlockDropDifficulty(option.id)}
                title={option.hint}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.settingBlock}>
          <div className={styles.settingHeading}>
            <strong>特殊模式</strong>
            <small>彩虹消除會在連續消行時給額外回饋。</small>
          </div>
          <div className={styles.segmented} role="radiogroup" aria-label="繽紛方塊特殊模式">
            {BLOCK_DROP_SPECIAL_MODES.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.segmentBtn}
                aria-pressed={blockDropSpecialMode === option.id}
                data-active={blockDropSpecialMode === option.id}
                onClick={() => setBlockDropSpecialMode(option.id)}
                title={option.hint}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <p className={styles.settingNote}>
          鍵盤：方向鍵／WASD 操作 · P 或 Esc 暫停 · 手把 D-pad／搖桿亦可操作（若瀏覽器支援）。
        </p>
        <button type="button" className={styles.primaryBtn} onClick={onClose}>
          完成
        </button>
      </div>
    </div>
  );
}

function PauseOverlay({
  open,
  onResume,
  onRestart,
  onOpenSettings,
}: {
  open: boolean;
  onResume: () => void;
  onRestart?: () => void;
  onOpenSettings: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") onResume();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onResume]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 id={titleId} className={styles.dialogTitle}>
          暫停中
        </h2>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.primaryBtn} onClick={onResume}>
            繼續玩 ▶
          </button>
          {onRestart && (
            <button type="button" className={styles.secondaryBtn} onClick={onRestart}>
              重新開始
            </button>
          )}
          <button type="button" className={styles.secondaryBtn} onClick={onOpenSettings}>
            設定 ⚙️
          </button>
          <Link href="/games" className={styles.secondaryBtn}>
            回遊樂園 🎡
          </Link>
        </div>
      </div>
    </div>
  );
}

/** 遊戲外框：暫停選單、設定對話框、即時播報（Phase 7）。 */
export default function GameChrome({
  children,
  canPause = false,
  paused = false,
  onPause,
  onResume,
  onRestart,
  announce,
  className,
}: GameChromeProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <ChromeContext.Provider value={{ openSettings: () => setSettingsOpen(true) }}>
      <div className={`${styles.wrap}${className ? ` ${className}` : ""}`}>
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announce ?? ""}
        </div>
        {children}
        <PauseOverlay
          open={Boolean(paused && canPause)}
          onResume={() => onResume?.()}
          onRestart={onRestart}
          onOpenSettings={() => {
            onResume?.();
            setSettingsOpen(true);
          }}
        />
        <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </ChromeContext.Provider>
  );
}
