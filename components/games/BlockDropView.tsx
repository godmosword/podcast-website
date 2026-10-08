"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import type { GameAudioBus, OverlayProps } from "@/lib/gamekit/adapter";
import { BlockDropOverlay } from "@/components/games/BlockDropOverlay";
import { BlockDropWell } from "@/components/games/BlockDropWell";
import {
  BlockDropCompactScorePanel,
  BlockDropHoldButton,
  BlockDropNextPanel,
  BlockDropScorePanel,
  BlockDropTutorialCard,
} from "@/components/games/BlockDropHud";
import { BlockDropMap, type BlockStationPreview } from "@/components/games/BlockDropMap";
import { BlockDropResult } from "@/components/games/BlockDropResult";
import { BlockDropTaskBar } from "@/components/games/BlockDropTaskBar";
import { releaseBoardPointerCapture, useBlockDropGame } from "@/components/games/useBlockDropGame";
import { useGameKitSettings } from "@/hooks/useGameKitSettings";
import { BLOCK_DROP_DIFFICULTIES, type BlockDropDifficulty } from "@/lib/gamekit/progress/settings";
import type { BlockDropInstance } from "@/lib/gamekit/games/block-drop/adapter";
import { loadBlockDropPrefs, saveBlockDropMode, type BlockDropMode } from "@/lib/gamekit/progress/block-drop-prefs";
import { medalCount } from "@/lib/gamekit/progress/meta";
import { loadPlayerProfile } from "@/lib/gamekit/progress/save";
import { GAMEKIT_PROGRESS_EVENT } from "@/lib/gamekit/progress/session";
import { blockGoalsSummary } from "@/lib/games/block-drop/goals";
import {
  BLOCK_STATIONS,
  buildBlockRound,
  dangerRowFor,
  type BlockMode,
  type BlockRound,
} from "@/lib/games/block-drop/stages";
import {
  BlockDropKeys,
  getLayoutMetrics,
  layoutModeFor,
  type LayoutMode,
} from "@/components/games/BlockDropControls";
import { CELL, MACARON_THEME, secondaryBtn } from "@/components/games/blockDropTheme";
import {
  IconFlame,
  IconKid,
  IconRainbow,
  IconSprout,
  IconStar,
} from "@/components/games/ClayIcons";

/** 自由堆疊速度（與設定面板同一份標籤：慢慢／一般／快快，避免和輕鬆／挑戰冒險撞名）。 */
const DIFFICULTY_LABEL = Object.fromEntries(
  BLOCK_DROP_DIFFICULTIES.map((d) => [d.id, d.label]),
) as Record<BlockDropDifficulty, string>;
const DIFFICULTY_ICON: Record<BlockDropDifficulty, ReactNode> = {
  relaxed: <IconSprout size={16} />,
  standard: <IconStar size={16} />,
  challenge: <IconFlame size={16} />,
};
const DIFFICULTY_ORDER: BlockDropDifficulty[] = [
  "relaxed",
  "standard",
  "challenge",
];
/** 第 1–3 站缺口加亮框（教「填缺口」） */
const GAP_HINT_LAST_STATION = 2;
/** 井下鍵列與井之間的距離（BlockDropKeys bar marginTop） */
const KEY_BAR_GAP = 6;
const MIN_BOARD_H_PORTRAIT = 300;
const MIN_BOARD_H_LANDSCAPE = 200;
/** 遊戲列比這矮時，待機面省略玩法示範動畫 */
const COMPACT_OVERLAY_H = 420;
/** 直向手機 HUD 列與井之間的距離 */
const HUD_ROW_GAP = 6;
/** G-H1：小朋友點得準、看得清的最小格子（390×664 等有工具列的真實手機高度也要達到） */
const MIN_COMFORT_CELL = 25;
/** 矮手機自由堆疊把分數／下一個移到井旁的窄欄寬度 */
const PHONE_SIDE_W = 64;
const FONT = "var(--font-sans, 'PingFang TC','Microsoft JhengHei',system-ui,sans-serif)";

type Screen = "home" | "map" | "play";

export type { BlockDropController } from "@/components/games/useBlockDropGame";

export type BlockDropViewProps = OverlayProps & {
  audio?: GameAudioBus;
  instance: BlockDropInstance;
};

export { releaseBoardPointerCapture };

function roundKey(mode: BlockMode, index: number, replay: boolean): string {
  return `${mode}:${index}:${replay ? "replay" : "main"}`;
}

/** 偏好存的是上次在地圖選的玩法；沒選過（或舊值 free）依兒童模式。 */
function mapModeOf(pref: BlockDropMode | null, kidsMode: boolean): BlockMode {
  if (pref === "easy" || pref === "challenge") return pref;
  return kidsMode ? "easy" : "challenge";
}

export function BlockDropView({
  best,
  kidsMode,
  reducedMotion,
  onStart,
  onResume,
  onRestart,
  onOpenTutorial,
  syncHost,
  audio,
  instance,
}: BlockDropViewProps) {
  const isCoarse = useCoarsePointer();
  const {
    blockDropDifficulty,
    blockDropSpecialMode,
    setBlockDropDifficulty,
  } = useGameKitSettings();
  const boardScaleRef = useRef(1.6);
  const [screen, setScreen] = useState<Screen>("home");
  const [medals, setMedals] = useState<number[]>([]);
  const [prefMode, setPrefMode] = useState<BlockDropMode | null>(null);
  const mapMode = mapModeOf(prefMode, kidsMode);
  const pendingRef = useRef<Record<string, BlockRound>>({});
  const lastStageRef = useRef<Record<string, string | undefined>>({});
  const hostBeginRef = useRef<() => void>(() => undefined);

  const {
    G,
    roundRef,
    outcome,
    idleHint,
    dropMode,
    startGame,
    leaveRound,
    dropPress,
    dropRelease,
    boardTransform,
    difficultyRef,
    toasts,
    clearFx,
    tutorialStep,
    skipTutorial,
    lockFxRef,
    newBestRef,
    rotate,
    holdPiece,
    startMoveRepeat,
    stopMoveRepeat,
    gestures,
  } = useBlockDropGame({
    instance,
    audio,
    best,
    reducedMotion,
    onStart,
    syncHost,
    blockDropDifficulty,
    blockDropSpecialMode,
    boardScaleRef,
    onHostBegin: () => hostBeginRef.current(),
  });
  const reduced = reducedMotion;

  const refreshMedals = useCallback(() => {
    setMedals(loadPlayerProfile().medals["block-drop"]?.slice() ?? []);
  }, []);
  useEffect(() => {
    refreshMedals();
    setPrefMode(loadBlockDropPrefs().mode);
    window.addEventListener(GAMEKIT_PROGRESS_EVENT, refreshMedals);
    return () => window.removeEventListener(GAMEKIT_PROGRESS_EVENT, refreshMedals);
  }, [refreshMedals]);
  const maxCleared = medals.reduce((m, f, i) => (medalCount(f) > 0 ? Math.max(m, i + 1) : m), 0);

  /** 地圖預覽與開始用同一份配置（抽一次就固定）；通關過的站重玩換變體。 */
  const planRound = useCallback(
    (index: number): BlockRound => {
      const replay = medalCount(medals[index] ?? 0) > 0;
      const key = roundKey(mapMode, index, replay);
      const cached = pendingRef.current[key];
      if (cached) return cached;
      const round = buildBlockRound(index, mapMode, {
        replay,
        previousId: lastStageRef.current[`${mapMode}:${index}`],
        rng: Math.random,
      });
      pendingRef.current[key] = round;
      return round;
    },
    [medals, mapMode],
  );

  const previewFor = useCallback(
    (index: number): BlockStationPreview => {
      const round = planRound(index);
      return {
        stones: round.stage.stones,
        goals: round.stage.goals,
        summary: blockGoalsSummary(round.stage.goals),
        pieceCap: round.stage.pieceCap,
        replay: round.replay,
      };
    },
    [planRound],
  );

  const startStation = useCallback(
    (index: number) => {
      const round = planRound(index);
      delete pendingRef.current[roundKey(round.mode, index, round.replay)];
      lastStageRef.current[`${round.mode}:${index}`] = round.stage.id;
      setScreen("play");
      startGame(round);
    },
    [planRound, startGame],
  );

  const startFree = useCallback(() => {
    setScreen("play");
    startGame(null);
  }, [startGame]);

  const goToMap = useCallback(() => {
    leaveRound();
    setScreen("map");
  }, [leaveRound]);

  const goHome = useCallback(() => {
    leaveRound();
    setScreen("home");
  }, [leaveRound]);

  const changeMode = useCallback((next: BlockMode) => {
    saveBlockDropMode(next);
    setPrefMode(next);
  }, []);

  // Host 的開始／確認鍵／再玩一次：標題面進地圖；地圖與冒險結算有自己的按鈕；其餘重開目前玩法
  hostBeginRef.current = () => {
    if (screen === "home") {
      setScreen("map");
      return;
    }
    if (screen === "map") return;
    const round = roundRef.current;
    const status = G.current.status;
    if (round && (status === "over" || status === "won")) return;
    if (round) startStation(round.station.index);
    else startGame(null);
  };

  // ── 直向手機／平板／桌機／橫向手機四種版面 ──
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("mobile");
  useEffect(() => {
    const apply = () => setLayoutMode(layoutModeFor(window.innerWidth || 390, window.innerHeight || 844));
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  const wide = layoutMode === "tablet" || layoutMode === "desktop";
  const landscape = layoutMode === "landscape";
  const layout = getLayoutMetrics(layoutMode, isCoarse);
  const keys = layout.keys;
  const barKeys = keys != null && layout.keyLayout === "bar";
  const keyBarH = barKeys && keys ? keys.key + KEY_BAR_GAP : 0;

  const g = G.current;
  const cols = g.board[0]?.length ?? 10;
  const rows = g.board.length;
  const round = screen === "play" ? roundRef.current : null;
  const inRound = g.status === "playing" || g.status === "paused";

  // ── 棋盤填滿可用寬高，連續縮放（DOM 方塊非像素畫，免整數倍）；井下鍵列的高度先扣掉 ──
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const [boardScale, setBoardScale] = useState(1.6);
  boardScaleRef.current = boardScale;
  // 直向手機自由堆疊：井上方那列 HUD 會讓 10×20 的井在矮螢幕縮到 25px 以下；
  // 這時改把 HUD 放到井旁窄欄（hudSide），多出一整列高度給井。
  const [hudSide, setHudSide] = useState(false);
  const hudRowRef = useRef<HTMLDivElement | null>(null);
  /** HUD 列（含與井的間距）高度；窄欄模式量不到時沿用上次量到的值 */
  const hudRowHRef = useRef(59 + HUD_ROW_GAP);
  const hasRound = round != null;
  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;
    const apply = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const reserve = landscape
        ? 6
        : layoutMode === "desktop"
          ? 48
          : layoutMode === "tablet"
            ? 40
            : isCoarse
              ? 8
              : 32;
      const minH = landscape ? MIN_BOARD_H_LANDSCAPE : MIN_BOARD_H_PORTRAIT;
      const avail = (window.innerHeight || 800) - top - reserve - keyBarH;
      const side = wantsSideHud(el, w, avail);
      if (side !== hudSide) {
        // 換版面後井的位置與寬度會變，等下一輪 effect 用新版面重算
        setHudSide(side);
        return;
      }
      const maxH = Math.max(minH, avail);
      setBoardScale(Math.min(w / (cols * CELL), maxH / (rows * CELL)));
    };
    /** 只在直向手機自由堆疊、而且原版面格子不到 MIN_COMFORT_CELL 時才改窄欄。 */
    const wantsSideHud = (el: HTMLElement, w: number, avail: number): boolean => {
      const freePlay = screen === "play" && !hasRound;
      if (wide || landscape || !freePlay) return false;
      const rowEl = hudRowRef.current;
      if (rowEl) hudRowHRef.current = rowEl.getBoundingClientRect().height + HUD_ROW_GAP;
      const rowW = el.parentElement?.clientWidth ?? w;
      const rowAvail = hudSide ? avail - hudRowHRef.current : avail;
      const sideAvail = hudSide ? avail : avail + hudRowHRef.current;
      // 與實際縮放同一套下限，極矮螢幕的估算才對得上
      const rowCell = Math.min(rowW / cols, Math.max(MIN_BOARD_H_PORTRAIT, rowAvail) / rows);
      const sideCell = Math.min(
        (rowW - PHONE_SIDE_W - layout.playGap) / cols,
        Math.max(MIN_BOARD_H_PORTRAIT, sideAvail) / rows,
      );
      return rowCell < MIN_COMFORT_CELL && sideCell > rowCell + 0.5;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
    // 局內會收掉卡內 chip 列、任務列出現，井的 top 會變 → 以 inRound／hasRound 觸發重算
  }, [isCoarse, layoutMode, landscape, wide, keyBarH, inRound, hasRound, cols, rows, screen, hudSide, layout.playGap]);

  const boardDisplayW = Math.round(cols * CELL * boardScale);
  const boardDisplayH = Math.round(rows * CELL * boardScale);
  const currentDifficultyLabel = DIFFICULTY_LABEL[blockDropDifficulty];
  const specialMode = blockDropSpecialMode;
  const topOut = g.status === "over" && g.overReason === "topout";
  const showHold = round ? round.stage.hold : true;

  const switchToRelaxedAndRestart = () => {
    difficultyRef.current = "relaxed";
    setBlockDropDifficulty("relaxed");
    startGame(null);
  };

  const cycleDifficulty = () => {
    if (inRound) return;
    const i = DIFFICULTY_ORDER.indexOf(blockDropDifficulty);
    setBlockDropDifficulty(DIFFICULTY_ORDER[(i + 1) % DIFFICULTY_ORDER.length]);
  };

  const keyProps = keys
    ? {
        metrics: keys,
        dropMode,
        showHold,
        holdType: g.hold,
        canHold: g.status === "playing" && g.canHold,
        dropGlow: idleHint,
        onRotate: () => rotate(1),
        onMoveLeftDown: () => startMoveRepeat(-1),
        onMoveRightDown: () => startMoveRepeat(1),
        onMoveStop: stopMoveRepeat,
        onDropDown: dropPress,
        onDropUp: dropRelease,
        onHold: holdPiece,
      }
    : null;
  // 鍵列在局外也佔位（隱藏），開局時井不跳動
  const keysHidden = !inRound;

  const adventureResult =
    round && outcome ? (
      <BlockDropResult
        round={round}
        outcome={outcome}
        medalStars={medalCount(medals[round.station.index] ?? 0)}
        isLast={round.station.index === BLOCK_STATIONS.length - 1}
        font={FONT}
        onNext={() => startStation(round.station.index + 1)}
        onReplay={() => startStation(round.station.index)}
        onEasier={() => startStation(Math.max(0, round.station.index - 1))}
        onMap={goToMap}
      />
    ) : undefined;

  const showChips = screen === "home" || (screen === "play" && !round && (wide || !inRound));
  const showLocalHold = showHold && !keys;
  // 標題面只有待機卡：HUD、側欄與鍵列等開局後才出現
  const onPlayScreen = screen === "play";

  const taskOrScore = (compact: boolean) =>
    round ? (
      <BlockDropTaskBar round={round} g={g} />
    ) : compact ? (
      <BlockDropCompactScorePanel g={g} />
    ) : (
      <BlockDropScorePanel g={g} wide={wide} layoutMode={layoutMode} />
    );

  const well = (
    <div
      ref={boardWrapRef}
      style={{
        flex: 1,
        minWidth: 0,
        maxWidth: layout.boardMaxW,
        height: boardDisplayH,
        margin: wide || landscape ? "0 auto" : 0,
      }}
    >
      {/* 內層與縮放後的棋盤同寬：遮罩、手勢層、提示都貼齊棋盤本體 */}
      <div
        style={{
          position: "relative",
          width: boardDisplayW,
          maxWidth: "100%",
          height: "100%",
          margin: "0 auto",
        }}
      >
        <BlockDropWell
          g={g}
          boardScale={boardScale}
          boardTransform={boardTransform}
          reduced={reduced}
          lockFxRef={lockFxRef}
          gestures={gestures}
          clearFx={clearFx}
          toasts={toasts}
          dangerRow={round ? dangerRowFor(rows) : undefined}
          highlightGaps={round != null && round.station.index <= GAP_HINT_LAST_STATION}
        />
      </div>
    </div>
  );

  const sideColumn = (children: ReactNode, width: number = layout.sideColW, maxHeight?: number) => (
    <div
      style={{
        position: "relative",
        width,
        maxHeight,
        overflow: maxHeight == null ? undefined : "hidden",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: landscape ? 8 : 10,
      }}
    >
      {children}
    </div>
  );

  return (
    <div
      data-layout={layoutMode}
      data-status={g.status}
      data-screen={screen}
      /* 首頁與地圖還沒有井，外框的操作提示（左右移動…）此時沒有對象，先收起 */
      data-play-hints={onPlayScreen ? undefined : "off"}
      data-mode={round ? round.mode : screen === "play" ? "free" : undefined}
      data-stage={round?.stage.id}
      data-theme="macaron-clay"
      style={{
        fontFamily: FONT,
        // G-M4：拿掉壓到 ~20% 的封面底圖（看起來像圖沒載完）；封面留給 hub 卡，局內是乾淨的馬卡龍面
        background:
          "linear-gradient(160deg,#fff9ee 0%,#f3fbff 52%,#fff0f7 100%)",
        padding: layout.shellPad,
        borderRadius: 28,
        width: "100%",
        maxWidth: layout.shellMaxW,
        boxSizing: "border-box",
        overflow: "hidden",
        margin: "0 auto",
        border: "2px solid rgba(255,255,255,.92)",
        boxShadow:
          "0 20px 42px rgba(144,116,128,.2), inset 0 2px 0 rgba(255,255,255,.95), inset 0 -8px 18px rgba(255,198,214,.18)",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes lineFlash { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.42;transform:scale(1.08)} }
        @keyframes blockSquash {
          0% { transform: scale(1) }
          35% { transform: scale(1.16, .7) }
          70% { transform: scale(.94, 1.08) }
          100% { transform: scale(1) }
        }
        @keyframes popIn { 0%{transform:scale(.72);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes toastUp {
          0% { transform: translateY(10px) scale(.85); opacity: 0 }
          15% { transform: none; opacity: 1 }
          72% { transform: none; opacity: 1 }
          100% { transform: translateY(-16px); opacity: 0 }
        }
        @keyframes clearBurst {
          0% { transform: translate(-50%,-50%) scale(.72); opacity: 0 }
          18% { transform: translate(-50%,-50%) scale(1.08); opacity: 1 }
          72% { transform: translate(-50%,-55%) scale(1); opacity: 1 }
          100% { transform: translate(-50%,-72%) scale(.94); opacity: 0 }
        }
        @keyframes candyPop {
          0% { transform: translateY(10px) scale(.5); opacity: 0 }
          22% { opacity: 1 }
          100% { transform: translateY(-42px) scale(1.08); opacity: 0 }
        }
      `}</style>

      {screen === "map" ? (
        <BlockDropMap
          stations={BLOCK_STATIONS}
          stars={BLOCK_STATIONS.map((_, i) => medalCount(medals[i] ?? 0))}
          maxCleared={maxCleared}
          mode={mapMode}
          font={FONT}
          onModeChange={changeMode}
          previewFor={previewFor}
          onStart={startStation}
          onFree={startFree}
          onHome={goHome}
        />
      ) : (
        <>
          {/* 標題面與自由堆疊局外：速度 chip（≥44px）；任務冒險不顯示（速度由站點決定） */}
          {showChips && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: wide ? 10 : 6 }}>
              {kidsMode && <IconKid size={wide ? 19 : 16} />}
              <button
                type="button"
                onClick={cycleDifficulty}
                aria-label={`落下速度 ${currentDifficultyLabel}，點一下切換`}
                disabled={inRound}
                style={{
                  color: MACARON_THEME.ink,
                  background: "rgba(255,255,255,.68)",
                  border: "1px solid rgba(255,255,255,.9)",
                  borderRadius: 999,
                  minHeight: 44,
                  padding: "4px 14px",
                  fontSize: 14,
                  fontWeight: 900,
                  boxShadow: "0 4px 10px rgba(126,96,112,.1)",
                  cursor: inRound ? "default" : "pointer",
                  opacity: inRound ? 0.55 : 1,
                  fontFamily: FONT,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {DIFFICULTY_ICON[blockDropDifficulty]} {currentDifficultyLabel}
              </button>
              {specialMode === "rainbow" && (
                <span
                  role="img"
                  aria-label="彩虹消除模式"
                  style={{
                    background: "linear-gradient(90deg,#ffe889,#b9f3db,#d8c7ff)",
                    borderRadius: 999,
                    minHeight: 44,
                    padding: "4px 12px",
                    boxSizing: "border-box",
                    boxShadow: "0 4px 10px rgba(126,96,112,.1)",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <IconRainbow size={18} />
                </span>
              )}
            </div>
          )}

          {/* 直向手機：單列 HUD（任務列或分數·Lv）＋下一個；自由堆疊教學蓋在這一列上。
              矮手機自由堆疊改放井旁窄欄（hudSide），見下方遊戲列。 */}
          {onPlayScreen && !wide && !landscape && !hudSide && (
            <div
              ref={hudRowRef}
              style={{ position: "relative", display: "flex", gap: 6, marginBottom: HUD_ROW_GAP, alignItems: "stretch" }}
            >
              {showLocalHold && <BlockDropHoldButton g={g} font={FONT} cell={layout.hud.hold} holdPiece={holdPiece} />}
              {taskOrScore(true)}
              <BlockDropNextPanel g={g} firstCell={layout.hud.nextFirst} restCell={layout.hud.nextRest} compact />
              <BlockDropTutorialCard g={g} wide={false} tutorialStep={tutorialStep} skipTutorial={skipTutorial} />
            </div>
          )}

          {wide && <BlockDropTutorialCard g={g} wide tutorialStep={tutorialStep} skipTutorial={skipTutorial} />}

          {/* 寬螢幕：左欄資訊、中間棋盤、右欄預覽。橫向手機：兩側鍵欄夾著井 */}
          <div
            style={{
              position: "relative",
              display: "flex",
              gap: layout.playGap,
              alignItems: landscape ? "center" : "flex-start",
              justifyContent: "center",
              width: "100%",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {onPlayScreen && wide &&
              sideColumn(
                <>
                  {taskOrScore(false)}
                  {showLocalHold && <BlockDropHoldButton g={g} font={FONT} cell={layout.hud.hold} holdPiece={holdPiece} />}
                </>,
              )}
            {onPlayScreen && landscape &&
              sideColumn(
                <>
                  {taskOrScore(true)}
                  {keyProps && (
                    <div style={{ visibility: keysHidden ? "hidden" : "visible" }}>
                      <BlockDropKeys {...keyProps} part="left" />
                    </div>
                  )}
                  {showLocalHold && <BlockDropHoldButton g={g} font={FONT} cell={layout.hud.hold} holdPiece={holdPiece} />}
                  <BlockDropTutorialCard g={g} wide={false} tutorialStep={tutorialStep} skipTutorial={skipTutorial} />
                </>,
              )}

            {well}

            {onPlayScreen && wide &&
              sideColumn(<BlockDropNextPanel g={g} firstCell={layout.hud.nextFirst} restCell={layout.hud.nextRest} />)}
            {/* 窄欄不得比井高：長出去會把井下鍵列擠出畫面 */}
            {onPlayScreen && hudSide &&
              sideColumn(
                <>
                  {showLocalHold && <BlockDropHoldButton g={g} font={FONT} cell={layout.hud.hold} holdPiece={holdPiece} />}
                  <BlockDropCompactScorePanel g={g} narrow />
                  <BlockDropNextPanel g={g} firstCell={layout.hud.nextFirst} restCell={layout.hud.nextRest} compact narrow />
                  <BlockDropTutorialCard g={g} wide={false} narrow tutorialStep={tutorialStep} skipTutorial={skipTutorial} />
                </>,
                PHONE_SIDE_W,
                boardDisplayH,
              )}
            {onPlayScreen && landscape &&
              sideColumn(
                <>
                  <BlockDropNextPanel g={g} firstCell={layout.hud.nextFirst} restCell={layout.hud.nextRest} compact />
                  {keyProps && (
                    <div style={{ visibility: keysHidden ? "hidden" : "visible" }}>
                      <BlockDropKeys {...keyProps} part="right" />
                    </div>
                  )}
                </>,
              )}
            {/* 待機／暫停／結算蓋住整個遊戲列（不只井）：窄井（8 欄、橫向）也放得下結算卡 */}
            <BlockDropOverlay
              g={g}
              topOut={topOut}
              newBest={newBestRef.current}
              font={FONT}
              reduced={reduced}
              blockDropDifficulty={blockDropDifficulty}
              onResume={onResume}
              onRestart={onRestart}
              onOpenTutorial={onOpenTutorial}
              switchToRelaxedAndRestart={switchToRelaxedAndRestart}
              onAdventure={() => setScreen("map")}
              onFree={startFree}
              adventure={adventureResult}
              compact={landscape || boardDisplayH < COMPACT_OVERLAY_H}
              exitAction={
                <button
                  type="button"
                  onClick={round ? goToMap : goHome}
                  style={{ ...secondaryBtn(FONT), display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                >
                  {round ? "回地圖" : "回標題"}
                </button>
              }
            />
          </div>

          {/* 井下鍵列：◀ ▶ 左拇指、轉／↓／暫存右拇指（直向手機、平板觸控） */}
          {onPlayScreen && barKeys && keyProps && (
            <div style={{ visibility: keysHidden ? "hidden" : "visible", maxWidth: wide ? 520 : undefined, margin: wide ? "0 auto" : undefined }}>
              <BlockDropKeys {...keyProps} part="bar" />
            </div>
          )}
        </>
      )}

      {/* G-M6：操作提示只留 GamePageShell 的 `.playHints` 一處 */}
    </div>
  );
}
