"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { CandyMatchBoard } from "@/components/games/CandyMatchBoard";
import { CandyMatchMap, type CandyStationPreview } from "@/components/games/CandyMatchMap";
import { CandyMatchPropBar } from "@/components/games/CandyMatchPropBar";
import { CandyMatchResult } from "@/components/games/CandyMatchResult";
import { CandyMatchTaskBar } from "@/components/games/CandyMatchTaskBar";
import { CandyMatchTip } from "@/components/games/CandyMatchTip";
import { CandyMatchTitleSteps } from "@/components/games/CandyMatchTitleSteps";
import { IconPlay, IconStar } from "@/components/games/ClayIcons";
import type { GameAudioBus, OverlayProps } from "@/lib/gamekit/adapter";
import type { CandyMatchInstance } from "@/lib/gamekit/games/candy-match/adapter";
import {
  loadCandyMatchPrefs,
  markCandyTipSeen,
  resolveCandyMode,
  saveCandyMatchMode,
  type CandyMatchPrefs,
  type CandyMatchTipId,
} from "@/lib/gamekit/progress/candy-match-prefs";
import { medalCount } from "@/lib/gamekit/progress/meta";
import { loadPlayerProfile } from "@/lib/gamekit/progress/save";
import { GAMEKIT_PROGRESS_EVENT } from "@/lib/gamekit/progress/session";
import { candyMatchCellPx } from "@/lib/games/candy-match/cell-size";
import { CANDY_MATCH_LEVELS } from "@/lib/games/candy-match/levels";
import { buildRound, type CandyMatchRound, type CandyMode } from "@/lib/games/candy-match/stages";
import { goalsSummary, goalTheme } from "@/lib/games/candy-match/tasks";
import { gameBySlug } from "@/data/games";
import { useCandyMatchPlay } from "./useCandyMatchPlay";
import styles from "./CandyMatchView.module.css";

type Screen = "title" | "map" | "play";

export type CandyMatchController = {
  goToMap(): void;
  goToTitle(): void;
  startLevel(index: number): void;
  restartCurrentLevel(): void;
};

export type CandyMatchViewProps = OverlayProps & {
  audio?: GameAudioBus;
  instance: CandyMatchInstance;
};

/** 無音效環境的穩定 fallback（見 CandyMatchView 內 ensureAudio／tone）。 */
/** 標題頁封面：與遊樂園卡片同一張圖（data/games.ts 為唯一來源）。 */
const TITLE_COVER_SRC = gameBySlug("candy-match").art.cover;
const noopAudio: GameAudioBus["ensureAudio"] = () => {};
const noopTone: GameAudioBus["tone"] = () => {};

/** 寬螢幕與橫向手機：任務／道具放側欄，棋盤在主欄（與 CSS 斷點一致）。 */
const WIDE_LAYOUT_QUERY =
  "(min-width: 900px), (min-width: 640px) and (orientation: landscape) and (max-height: 520px)";
/** 棋盤到下方道具列的 grid 間距（與 CSS .playLayout gap 一致）。 */
const LAYOUT_GAP = 6;
/** 卡面底部內距＋邊框＋棋盤框內距的保留量。 */
const SURFACE_BOTTOM = 12;
const GIFT_EXIT_ROW = 30;
const EMPTY_PREFS: CandyMatchPrefs = { mode: null, tipsSeen: [] };

function roundKey(mode: CandyMode, index: number, replay: boolean): string {
  return `${mode}:${index}:${replay ? "replay" : "main"}`;
}

export function CandyMatchView({
  kidsMode,
  reducedMotion,
  status,
  syncHost,
  audio,
  instance,
}: CandyMatchViewProps) {
  // fallback 取模組層 noop：寫成 `?? (() => {})` 會每次 render 產生新函式，
  // 讓所有以此為依賴的 useCallback 每幀失效（lint exhaustive-deps 亦會警告）。
  const ensureAudio = audio?.ensureAudio ?? noopAudio;
  const tone = audio?.tone ?? noopTone;

  const [screen, setScreen] = useState<Screen>("title");
  const [medals, setMedals] = useState<number[]>([]);
  const [prefs, setPrefs] = useState<CandyMatchPrefs>(EMPTY_PREFS);
  const [brandFontsEnabled, setBrandFontsEnabled] = useState(false);
  const [cellPx, setCellPx] = useState(56);
  const mode = resolveCandyMode(prefs.mode, kidsMode);
  const inputPaused = instance.isInputPaused() || status === "paused";

  const pendingRef = useRef<Record<string, CandyMatchRound>>({});
  const lastStageRef = useRef<Record<string, string | undefined>>({});
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const propSlotRef = useRef<HTMLDivElement | null>(null);

  const onTipSeen = useCallback((id: CandyMatchTipId) => {
    markCandyTipSeen(id);
    setPrefs((p) => (p.tipsSeen.includes(id) ? p : { ...p, tipsSeen: [...p.tipsSeen, id] }));
  }, []);

  const game = useCandyMatchPlay({
    instance,
    ensureAudio,
    tone,
    reducedMotion,
    inputPaused,
    syncHost,
    tipsSeen: prefs.tipsSeen,
    onTipSeen,
  });
  const { play, actions } = game;

  const refreshMedals = useCallback(() => {
    setMedals(loadPlayerProfile().medals["candy-match"]?.slice() ?? []);
  }, []);
  useEffect(() => {
    refreshMedals();
    setPrefs(loadCandyMatchPrefs());
    window.addEventListener(GAMEKIT_PROGRESS_EVENT, refreshMedals);
    return () => window.removeEventListener(GAMEKIT_PROGRESS_EVENT, refreshMedals);
  }, [refreshMedals]);
  const maxCleared = medals.reduce((m, f, i) => (medalCount(f) > 0 ? Math.max(m, i + 1) : m), 0);
  const starsGot = CANDY_MATCH_LEVELS.reduce((sum, _, i) => sum + medalCount(medals[i] ?? 0), 0);
  const starsTotal = CANDY_MATCH_LEVELS.length * 3;

  /**
   * 下一局的配置：地圖預覽與開始用同一份（pendingRef 快取，抽一次就固定）；
   * 尚未通關＝教學主線，通關後＝重玩變體。
   */
  const planRound = useCallback(
    (index: number): CandyMatchRound => {
      const replay = medalCount(medals[index] ?? 0) > 0;
      const key = roundKey(mode, index, replay);
      const cached = pendingRef.current[key];
      if (cached) return cached;
      const round = buildRound(index, mode, {
        replay,
        previousId: lastStageRef.current[`${mode}:${index}`],
        rng: Math.random,
      });
      pendingRef.current[key] = round;
      return round;
    },
    [medals, mode],
  );

  const previewFor = useCallback(
    (index: number): CandyStationPreview => {
      const round = planRound(index);
      return {
        goals: round.stage.goals,
        summary: goalsSummary(round.stage.goals),
        moves: round.stage.moves,
        replay: round.replay,
      };
    },
    [planRound],
  );

  const startLevel = useCallback(
    (index: number) => {
      ensureAudio();
      const round = planRound(index);
      delete pendingRef.current[roundKey(round.mode, index, round.replay)];
      lastStageRef.current[`${round.mode}:${index}`] = round.stage.id;
      actions.start(round);
      setScreen("play");
      instance.notifyPlaying(index, 0);
      syncHost();
    },
    [actions, ensureAudio, instance, planRound, syncHost],
  );

  const goToMap = useCallback(() => {
    actions.leave();
    setBrandFontsEnabled(true);
    setScreen("map");
    instance.notifyReady("map");
    syncHost();
  }, [actions, instance, syncHost]);

  const goToTitle = useCallback(() => {
    actions.leave();
    setScreen("title");
    instance.notifyReady("title");
    syncHost();
  }, [actions, instance, syncHost]);

  const currentIndex = play?.round.index ?? 0;
  const restartCurrentLevel = useCallback(() => {
    startLevel(currentIndex);
  }, [currentIndex, startLevel]);

  const changeMode = useCallback((next: CandyMode) => {
    saveCandyMatchMode(next);
    setPrefs((p) => ({ ...p, mode: next }));
  }, []);

  /*
   * G-C1：controller 一律經 ref 轉呼叫、只在 mount 註冊一次。
   * 若把 startLevel 等放進 deps，host `status` 變 `paused` → `inputPaused`
   * 連鎖換新 callback，effect 重跑會再呼叫 `notifyReady("title")` 把 adapter
   * 打回 `ready`，暫停鈕直接消失、棋盤照常可點。
   */
  const controllerRef = useRef({ goToMap, goToTitle, startLevel, restartCurrentLevel });
  controllerRef.current = { goToMap, goToTitle, startLevel, restartCurrentLevel };
  const syncHostRef = useRef(syncHost);
  syncHostRef.current = syncHost;

  useEffect(() => {
    instance.registerController({
      goToMap: () => controllerRef.current.goToMap(),
      goToTitle: () => controllerRef.current.goToTitle(),
      startLevel: (index) => controllerRef.current.startLevel(index),
      restartCurrentLevel: () => controllerRef.current.restartCurrentLevel(),
    });
    instance.notifyReady("title");
    syncHostRef.current();
    return () =>
      instance.registerController({
        goToMap: () => {},
        goToTitle: () => {},
        startLevel: () => {},
        restartCurrentLevel: () => {},
      });
  }, [instance]);

  const roundId = play ? `${play.round.mode}:${play.round.index}:${play.round.stage.id}` : "";
  const roundCols = play?.round.cols ?? 6;
  const roundRows = play?.round.rows ?? 6;
  const hasGifts = Boolean(play?.round.stage.dropCount);
  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el || screen !== "play") return;
    const apply = () => {
      const wide = window.matchMedia?.(WIDE_LAYOUT_QUERY).matches ?? false;
      const top = el.getBoundingClientRect().top + window.scrollY;
      // 只算固定的道具列；道具說明、特殊糖引導等暫時內容出現時讓整頁捲動，不回頭縮格子
      const below = wide ? 0 : LAYOUT_GAP + (propSlotRef.current?.offsetHeight ?? 0);
      const exits = hasGifts ? GIFT_EXIT_ROW : 0;
      const height = window.innerHeight - top - below - exits - SURFACE_BOTTOM;
      const width = el.clientWidth > 0 ? el.clientWidth : window.innerWidth;
      setCellPx(candyMatchCellPx(width, roundCols, height, roundRows));
    };
    apply();
    // 只在寬度變化時重量；棋盤自己的高度變化（格寬改變）不必再觸發
    let lastWidth = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === lastWidth) return;
      lastWidth = el.clientWidth;
      apply();
    });
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [screen, roundId, roundCols, roundRows, hasGifts]);

  const theme = play && screen === "play" ? play.round : CANDY_MATCH_LEVELS[0]!;
  const surfaceStyle: CSSProperties = {
    background: `linear-gradient(160deg, ${theme.themeA} 0%, ${theme.themeB} 100%)`,
  };
  const isLastLevel = play ? play.round.index === CANDY_MATCH_LEVELS.length - 1 : false;

  return (
    <div
      style={surfaceStyle}
      className={styles.surface}
      data-screen={screen}
      data-mode={mode}
      data-task={play && screen === "play" ? goalTheme(play.round.stage.goals) : undefined}
      data-challenge={play && screen === "play" ? play.round.stage.id : undefined}
      data-candy-fonts={brandFontsEnabled ? "ready" : undefined}
      /* 外框的操作提示（點兩格交換…）一律收起：第 1 站棋盤上的手指示範就是說明，不再重複講三次 */
      data-play-hints="off"
    >
      {screen === "title" && (
        <div className={styles.titleScreen}>
          {/* 封面舞台：與遊樂園卡片同一張封面，點進來看到的是同一個畫面。小朋友會去點這張最大的圖，
              點了也進冒險；它與「開始冒險」重複，所以對讀屏與鍵盤隱藏（aria-hidden＋tabIndex -1）。 */}
          <button
            type="button"
            className={styles.titleArt}
            onClick={goToMap}
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={TITLE_COVER_SRC}
              alt=""
              fill
              priority
              sizes="(max-width: 799px) calc(100vw - 64px), 55vw"
              className={styles.titleArtImg}
            />
          </button>
          <div className={styles.titlePanel}>
            {/* 頁面唯一 h1 屬 GamePageShell；此處為關卡畫面標題，降為 h2 避免重複 h1。 */}
            <h2 className={styles.titleHeading}>準備找糖果！</h2>
            {/* 拿到幾顆星：圖＋數字，不寫「完成小任務，就有星星」這種要讀的句子 */}
            <p className={styles.titleStars} role="img" aria-label={`已經拿到 ${starsGot} 顆星，全部 ${starsTotal} 顆`}>
              <IconStar size={22} />
              <b aria-hidden>{starsGot}</b>
              <span aria-hidden>/ {starsTotal}</span>
            </p>
            <CandyMatchTitleSteps />
            {/* 只留一顆大圓「開始」；「怎麼玩」改在第 1 站棋盤上用手指示範 */}
            <div className={styles.titleStart}>
              <button type="button" className={styles.startButton} onClick={goToMap} aria-label="開始冒險">
                <IconPlay size={46} />
              </button>
              <span className={styles.startCaption} aria-hidden>
                開始
              </span>
            </div>
          </div>
        </div>
      )}

      {screen === "map" && (
        <div className={styles.mapScreen}>
          <h2 className={styles.visuallyHidden}>遊樂園地圖</h2>
          <CandyMatchMap
            levels={CANDY_MATCH_LEVELS}
            stars={CANDY_MATCH_LEVELS.map((_, i) => medalCount(medals[i] ?? 0))}
            maxCleared={maxCleared}
            mode={mode}
            onModeChange={changeMode}
            previewFor={previewFor}
            onStart={startLevel}
          />
        </div>
      )}

      {screen === "play" && play && (
        <div className={styles.playLayout}>
          <div className={styles.playTask}>
            <CandyMatchTaskBar round={play.round} progress={play.progress} movesLeft={play.movesLeft} />
          </div>

          <div ref={boardWrapRef} className={styles.boardWrap}>
            {/* 交換教學只靠棋盤上的手指；特殊糖、厚污漬這些新東西第一次出現時才用小泡泡 */}
            {game.tip && game.tip !== "swap" ? (
              <CandyMatchTip tip={game.tip} selected={game.selected != null} onDismiss={actions.dismissTip} />
            ) : null}
            <CandyMatchBoard
              board={play.board}
              cellPx={cellPx}
              selected={game.selected}
              hint={game.hint}
              popping={game.popping}
              shaking={game.shaking}
              disabled={game.busy || game.outcome !== null || inputPaused}
              teach={game.teachMove}
              onTapCell={actions.tapCell}
              onSwipeCell={actions.attemptSwap}
              preview={game.propPreview}
              onHoverCell={actions.hoverCell}
              onCancel={actions.cancel}
              motion={{
                swap: game.motion.swap,
                falls: game.motion.falls,
                sweep: game.motion.sweep,
                reduced: reducedMotion,
                cheer: game.cheer,
              }}
            />
          </div>

          <div className={styles.playBelow}>
            <div ref={propSlotRef}>
              <CandyMatchPropBar
                offered={play.round.props}
                left={play.propsLeft}
                active={game.propMode}
                hasPreview={game.propPreview.size > 0}
                disabled={game.busy || game.outcome !== null || inputPaused}
                onSelect={actions.selectProp}
                onCancel={actions.cancel}
                onHint={actions.manualHint}
              />
            </div>
            {/* 鼓勵句只給讀屏（畫面上的鼓勵交給音效和閃光）；任務列每步都變，整面 live 會讓讀屏每步重唸 */}
            <p className={styles.visuallyHidden} aria-live="polite">
              {game.message}
            </p>
          </div>

          {game.outcome ? (
            <CandyMatchResult
              round={play.round}
              outcome={game.outcome}
              isLastLevel={isLastLevel}
              reducedMotion={reducedMotion}
              onNext={() => startLevel(play.round.index + 1)}
              onReplay={restartCurrentLevel}
              onMap={goToMap}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
