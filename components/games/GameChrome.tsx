"use client";

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
  SNOWBOARD_DIFFICULTIES,
} from "@/lib/gamekit/progress/settings";
import Icon from "@/components/ui/Icon";
import styles from "./GameChrome.module.css";

type ChromeContextValue = {
  openSettings: () => void;
};

const ChromeContext = createContext<ChromeContextValue>({
  openSettings: () => {},
});

function useOpenGameSettings(): () => void {
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
    // 返回動線由 GamePageShell 的抬頭唯一持有（它就在遊戲正上方、恆在首屏內）。
    // 這裡不再放第二顆「回遊樂園」，避免同頁兩個同名連結與多餘 chrome。
    <div className={styles.toolbar} role="group" aria-label="遊戲控制">
      {canPause && (
        <button
          type="button"
          className={styles.toolBtn}
          onClick={togglePause}
          aria-label={paused ? "繼續遊戲" : "暫停遊戲"}
        >
          <Icon name={paused ? "play" : "pause"} size={22} />
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
          <Icon name={soundOn ? "volume-on" : "volume-off"} size={22} />
        </button>
      )}
      <button
        type="button"
        className={styles.toolBtn}
        onClick={openSettings}
        aria-label="遊戲設定"
        aria-haspopup="dialog"
      >
        <Icon name="settings" size={22} />
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
    snowboardDifficulty,
    gameVolume,
    motionPreference,
    setKidsMode,
    setBlockDropDifficulty,
    setBlockDropSpecialMode,
    setSnowboardDifficulty,
    setGameVolume,
    setMotionPreference,
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
            <strong>阿蹦雪板難度</strong>
            <small>調整速度、障礙密度與失誤寬容度。</small>
          </div>
          <div className={styles.segmented} role="radiogroup" aria-label="阿蹦雪板難度">
            {SNOWBOARD_DIFFICULTIES.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.segmentBtn}
                aria-pressed={snowboardDifficulty === option.id}
                data-active={snowboardDifficulty === option.id}
                onClick={() => setSnowboardDifficulty(option.id)}
                title={option.hint}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <label className={styles.settingRow}>
          <span>
            <strong>遊戲音量</strong>
            <small>{Math.round(gameVolume * 100)}%</small>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={gameVolume}
            onChange={(e) => setGameVolume(Number(e.target.value))}
            aria-label="遊戲音量"
          />
        </label>
        <div className={styles.settingBlock}>
          <div className={styles.settingHeading}>
            <strong>動態效果</strong>
            <small>可覆寫系統的減少動態偏好。</small>
          </div>
          <div className={styles.segmented} role="radiogroup" aria-label="動態效果">
            {([
              ["system", "跟隨系統"],
              ["on", "減少動態"],
              ["off", "完整動態"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={styles.segmentBtn}
                aria-pressed={motionPreference === id}
                data-active={motionPreference === id}
                onClick={() => setMotionPreference(id)}
              >
                {label}
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

/** 遊戲外框：設定對話框、即時播報（Phase 7）。 */
export default function GameChrome({
  children,
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
        <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </ChromeContext.Provider>
  );
}
