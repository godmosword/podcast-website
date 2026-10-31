"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameAudioBus, OverlayProps } from "@/lib/gamekit/adapter";
import type { GameAction } from "@/lib/gamekit/types";
import { useGameLoop } from "@/lib/gamekit/react/useGameLoop";
import { keyAction } from "@/lib/gamekit/runtime/input";
import {
  loadOrangeExpressCoach,
  loadOrangeExpressLevel,
  resolveOrangeExpressDriver,
  resolveOrangeExpressLevel,
  saveOrangeExpressCoach,
  saveOrangeExpressLevel,
} from "@/lib/gamekit/progress/orange-express-prefs";
import { OrangeExpressCab } from "@/components/games/OrangeExpressCab";
import Image from "next/image";
import { LevelGlyph, XiaojuFace } from "@/components/games/OrangeExpressGlyphs";
import { OrangeExpressResult } from "@/components/games/OrangeExpressResult";
import { useOrangeExpressDisplay } from "@/components/games/OrangeExpressSettings";
import { OrangeExpressWindshield } from "@/components/games/OrangeExpressWindshield";
import type { OrangeExpressInstance } from "@/lib/gamekit/games/orange-express/adapter";
import { announce, nextStationAnnouncement, speechMs } from "@/lib/games/orange-express/announce";
import {
  ANNOUNCE_CHIME,
  ARRIVAL_MELODY,
  ARRIVE_CHIME,
  AUTO_BRAKE_DING,
  DOOR_CHIME,
  EMERGENCY_CLICK,
  HORN,
  NOTCH_CLICK,
  PASS_WHOOSH,
  POINT_OK,
  jointClack,
} from "@/lib/games/orange-express/chime";
import { coachBeat, type CoachBeat } from "@/lib/games/orange-express/coach";
import { coachThisRun, learnCoach, startCoachRun } from "@/lib/games/orange-express/coach-record";
import { COPY, DRIVER_HINT, DRIVER_NAME, GRADE_TEXT, LEVEL_DOTS } from "@/lib/games/orange-express/copy";
import { medalsFor, starMissReason } from "@/lib/games/orange-express/medals";
import { COURSE_RULES } from "@/lib/games/orange-express/routes";
import { nextSpeech, type SpeechItem } from "@/lib/games/orange-express/notice";
import {
  clampPower,
  createRun,
  currentStation,
  inTunnel,
  onBridge,
  step,
  stepBrake,
  stepPower,
  withHook,
} from "@/lib/games/orange-express/reducer";
import { DriveSound, driveMix, jointsCrossed } from "@/lib/games/orange-express/sound";
import { NO_SWAY, decayBump, swayAt } from "@/lib/games/orange-express/sway";
import { EMERGENCY, type LevelId, type RunState } from "@/lib/games/orange-express/types";
import { speakText } from "@/lib/games/shared/speech";
import { gameBySlug } from "@/data/games";
import styles from "./orange-express.module.css";

/** 標題主視覺：封面還是暫代的 SVG 時，用向量小橘站在山坡上頂著（B20）。 */
const TITLE_COVER_SRC = gameBySlug("orange-express").art.cover;

function TitleHero() {
  return (
    <div className={styles.titleHero} data-testid="orange-express-title-hero" aria-hidden>
      {TITLE_COVER_SRC.endsWith(".svg") ? (
        <span className={styles.titleHeroStandIn}>
          <XiaojuFace className={styles.titleHeroFace} />
        </span>
      ) : (
        <Image
          src={TITLE_COVER_SRC}
          alt=""
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 720px) 420px, calc(100vw - 32px)"
          className={styles.titleHeroImage}
        />
      )}
    </div>
  );
}

type Screen = "title" | "drive" | "result";

const LEVELS: readonly LevelId[] = ["look", "drive", "captain"];
const SOUND_RETRY_MS = 1000;
/** 「叮咚」之後再念站名。 */
const ANNOUNCE_DELAY_MS = 650;
/** 乘客卡滑完（600ms）、愛心泡泡冒出來的時候。 */
const BOARD_CHIME_DELAY_MS = 640;
/** 門還沒亮就按：前窗提示留這麼久。 */
const DOOR_HINT_MS = 2400;
/** 「門亮了再按」排在廣播後面；等太久才輪到就不念了，孩子早就不記得剛剛按過。 */
const DOOR_SPEECH_STALE_MS = 4000;
/** 對向列車擦身時「咻」的時間點（秒）。 */
const WHOOSH_AT = 1.45;
const DRIVE_KEYS: ReadonlySet<GameAction> = new Set([
  "move-up",
  "move-down",
  "move-left",
  "move-right",
  "dash",
  "action",
]);

function liveText(run: RunState, doorHint: boolean, coach: CoachBeat): string {
  if (run.phase === "reversing") return COPY.reversing;
  if (doorHint) return COPY.earlyDoorHint;
  if (coach === "brake") return COPY.coachBrake;
  if (run.autoBrake) return COPY.autoBrakeOn;
  if (run.phase === "doors-open") {
    const waiting = run.boarded < currentStation(run).passengers.length;
    return waiting ? COPY.boarding : COPY.friendsAboard;
  }
  if (run.phase === "stopped") {
    const grade = run.grades[run.stationIndex];
    return grade ? `${COPY.atStation}，${GRADE_TEXT[grade]}` : COPY.atStation;
  }
  if (run.misses > 0 && run.phase === "running" && run.speed === 0) return COPY.tryStopAgain;
  if (onBridge(run)) return run.bridgeGreeted ? COPY.bridgeGreeted : COPY.bridge;
  if (inTunnel(run)) return COPY.tunnel;
  return "";
}

export function OrangeExpressView({
  status,
  kidsMode,
  reducedMotion,
  soundOn,
  voiceEnabled,
  gameVolume,
  audio,
  instance,
  onStart,
  onResume,
  onOpenTutorial,
  syncHost,
}: OverlayProps & {
  audio?: GameAudioBus;
  instance: OrangeExpressInstance;
}) {
  const [screen, setScreen] = useState<Screen>("title");
  const [level, setLevel] = useState<LevelId>("look");
  const [run, setRun] = useState<RunState | null>(null);
  const [shake, setShake] = useState(false);
  /** 門還沒亮就按了：前窗（或停車目標條）當下說「門亮了再按」，不等到結算。 */
  const [doorHint, setDoorHint] = useState(false);
  /** 這一趟要不要做第一次進站的停車示範；停好學會了就關掉。 */
  const [coachOn, setCoachOn] = useState(false);
  const [honked, setHonked] = useState(0);
  /** 車停著時 run 不會變；廣播念完後用它叫朗讀再看一次前窗。 */
  const [voiceTick, setVoiceTick] = useState(0);
  const [display] = useOrangeExpressDisplay();
  const runRef = useRef<RunState | null>(null);
  const levelRef = useRef(level);
  const screenRef = useRef(screen);
  const phaseRef = useRef<RunState["phase"] | null>(null);
  const picked = useRef(false);
  const frozen = useRef(false);
  const swayRef = useRef<HTMLDivElement | null>(null);
  const swayClock = useRef(0);
  const bump = useRef(0);
  const sound = useRef<DriveSound | null>(null);
  const soundTriedAt = useRef(0);
  const announceTimer = useRef<number | null>(null);
  /** 這一趟念過的前窗提示（「站號:種類:位置」）。 */
  const spoken = useRef<Set<string>>(new Set());
  /** 車內廣播或上一句提示大約念到這個時間（performance.now）；之前不念新的提示。 */
  const voiceBusyUntil = useRef(0);
  /** 等著念的「門亮了再按」：一站只念一次，排在廣播後面。 */
  const doorSpeech = useRef<{ item: SpeechItem; at: number } | null>(null);
  /** 等著念的「右邊拉，停在綠區」：一站一次，排在最前面，不套逾時（還在第二拍就念）。 */
  const coachSpeech = useRef<SpeechItem | null>(null);
  /** 這一趟示範過了沒（小小司機的趟數只加一次）。 */
  const coachCounted = useRef(false);
  /** 示範在哪一站真的出現過；停好時要是這一站才算學會（直接跳到停好、示範沒出現過不算）。 */
  const coachShownAt = useRef<number | null>(null);
  const driver = resolveOrangeExpressDriver(display.driver, kidsMode);
  const driverRef = useRef(driver);
  const voiceRef = useRef(false);
  levelRef.current = level;
  screenRef.current = screen;
  driverRef.current = driver;
  voiceRef.current = soundOn && voiceEnabled && gameVolume > 0;
  const volumeRef = useRef(gameVolume);
  volumeRef.current = gameVolume;

  const swayOn = display.sway && !reducedMotion;
  /** 第一次進站示範的這一拍；暫停、離開駕駛畫面、這一趟不示範時都是 none。 */
  const beat: CoachBeat =
    run && coachOn && status === "playing" && screen === "drive" ? coachBeat(run) : "none";

  const apply = useCallback((next: RunState) => {
    runRef.current = next;
    setRun(next);
  }, []);

  const stopSound = useCallback(() => {
    sound.current?.stop();
    sound.current = null;
  }, []);

  const clearAnnounce = useCallback(() => {
    if (announceTimer.current !== null) window.clearTimeout(announceTimer.current);
    announceTimer.current = null;
  }, []);

  /** 「叮咚」＋「下一站，○○站」。音效關著就整段不出聲。 */
  const announceNext = useCallback(
    (state: RunState) => {
      clearAnnounce();
      audio?.voices?.(ANNOUNCE_CHIME);
      const item = nextStationAnnouncement(currentStation(state));
      // 「下一站」永遠先念：叮咚加整句念完之前，前窗提示先等。
      voiceBusyUntil.current = performance.now() + ANNOUNCE_DELAY_MS + speechMs(item.text);
      announceTimer.current = window.setTimeout(() => {
        announceTimer.current = null;
        if (!voiceRef.current) return;
        announce(item, volumeRef.current);
      }, ANNOUNCE_DELAY_MS);
    },
    [audio, clearAnnounce],
  );

  const begin = useCallback(() => {
    const nextLevel = levelRef.current;
    saveOrangeExpressLevel(nextLevel);
    const hook = typeof window === "undefined" ? undefined : window.__orangeExpress;
    frozen.current = hook?.freeze === true;
    const nextDriver = hook?.driver ?? driverRef.current;
    const next = withHook(createRun(nextLevel, nextDriver), hook);
    phaseRef.current = next.phase;
    spoken.current = new Set();
    doorSpeech.current = null;
    setDoorHint(false);
    // 掛鉤在（測試、視覺基準）時不示範，除非掛鉤寫 coach: true。
    const coachAllowed = !hook || hook.coach === true;
    setCoachOn(coachAllowed && coachThisRun(next.course, loadOrangeExpressCoach()));
    coachCounted.current = false;
    coachShownAt.current = null;
    coachSpeech.current = null;
    apply(next);
    announceNext(next);
    setScreen("drive");
    instance.notifyPlaying(nextLevel);
    syncHost();
  }, [announceNext, apply, instance, syncHost]);

  const goTitle = useCallback(() => {
    runRef.current = null;
    phaseRef.current = null;
    doorSpeech.current = null;
    setDoorHint(false);
    setCoachOn(false);
    coachShownAt.current = null;
    coachSpeech.current = null;
    setRun(null);
    setScreen("title");
    stopSound();
    clearAnnounce();
    instance.notifyReady();
    syncHost();
  }, [clearAnnounce, instance, stopSound, syncHost]);

  const tryDoors = useCallback(() => {
    const cur = runRef.current;
    if (!cur) return;
    if (cur.phase === "doors-open") {
      const next = step(cur, { type: "close-doors" });
      if (next === cur) return;
      apply(next);
      if (next.phase === "running") announceNext(next);
      return;
    }
    const next = step(cur, { type: "open-doors" });
    if (next === cur) {
      if (cur.phase === "running" || cur.phase === "in-window" || cur.phase === "reversing") {
        instance.noteEarlyDoor();
        setShake(true);
        setDoorHint(true);
        const key = `${cur.stationIndex}:door`;
        if (!spoken.current.has(key)) {
          doorSpeech.current = { item: { key, text: COPY.earlyDoorHint }, at: performance.now() };
          setVoiceTick((tick) => tick + 1);
        }
      }
      return;
    }
    apply(next);
  }, [announceNext, apply, instance]);

  const setPower = useCallback(
    (notch: number) => {
      const cur = runRef.current;
      if (!cur) return;
      const target = clampPower(notch);
      const next = step(cur, { type: "set-power", notch: target });
      if (next === cur) {
        // 門開著推不走：抖車門，告訴孩子先關門。倒車中推不走就不抖，車門跟這件事無關。
        if (cur.phase === "doors-open" && target > cur.power) setShake(true);
        return;
      }
      audio?.ensureAudio();
      audio?.voices?.(NOTCH_CLICK);
      apply(next);
    },
    [apply, audio],
  );

  const setBrake = useCallback(
    (notch: number) => {
      const cur = runRef.current;
      if (!cur) return;
      // 吸到這一檔有的格子在 step 裡做（慢慢看只有鬆、停、緊急）。
      const next = step(cur, { type: "set-brake", notch });
      if (next === cur) return;
      audio?.ensureAudio();
      audio?.voices?.(next.brake === EMERGENCY ? EMERGENCY_CLICK : NOTCH_CLICK);
      apply(next);
    },
    [apply, audio],
  );

  const pressHorn = useCallback(() => {
    const cur = runRef.current;
    if (cur) {
      const next = step(cur, { type: "honk" });
      if (next !== cur) apply(next);
    }
    audio?.ensureAudio();
    audio?.voices?.(HORN);
    setHonked((count) => count + 1);
  }, [apply, audio]);

  const pointCheck = useCallback(() => {
    const cur = runRef.current;
    if (!cur || instance.isInputPaused()) return;
    const next = step(cur, { type: "point" });
    if (next === cur) return;
    audio?.ensureAudio();
    audio?.voices?.(POINT_OK);
    apply(next);
  }, [apply, audio, instance]);

  const onAction = useCallback(
    (action: GameAction) => {
      const cur = runRef.current;
      if (!cur || instance.isInputPaused()) return;
      if (action === "move-up" || action === "move-down") {
        setPower(stepPower(cur.course, cur.power, action === "move-up" ? 1 : -1));
        return;
      }
      if (action === "move-left" || action === "move-right") {
        setBrake(stepBrake(cur.course, cur.brake, action === "move-left" ? 1 : -1));
        return;
      }
      if (action === "dash") {
        pressHorn();
        return;
      }
      if (action === "action") tryDoors();
    },
    [instance, pressHorn, setBrake, setPower, tryDoors],
  );

  const beginRef = useRef(begin);
  const titleRef = useRef(goTitle);
  const actionRef = useRef(onAction);
  beginRef.current = begin;
  titleRef.current = goTitle;
  actionRef.current = onAction;

  useEffect(() => {
    instance.registerController({
      startSelected: () => beginRef.current(),
      restart: () => beginRef.current(),
      goToTitle: () => titleRef.current(),
      onAction: (action) => actionRef.current(action),
    });
    return () => {
      instance.registerController({
        startSelected: () => {},
        restart: () => {},
        goToTitle: () => {},
        onAction: () => {},
      });
    };
  }, [instance]);

  useEffect(() => {
    if (picked.current) return;
    setLevel(resolveOrangeExpressLevel(loadOrangeExpressLevel(), kidsMode));
  }, [kidsMode]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.__orangeExpress) return;
    window.__orangeExpressJump = (patch) => {
      const cur = runRef.current;
      if (!cur) return;
      if (typeof patch.freeze === "boolean") frozen.current = patch.freeze;
      apply(withHook(cur, patch));
    };
    return () => {
      delete window.__orangeExpressJump;
    };
  }, [apply]);

  useEffect(() => {
    if (screen !== "drive") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const action = keyAction(e.key);
      if (!action || !DRIVE_KEYS.has(action)) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, select, textarea, [role='radio'], [role='dialog']")) return;
      // 空白鍵在按鈕上是按那顆按鈕，不是開門。
      if (action === "action" && target?.closest("button")) return;
      // 空白鍵是開門；門還沒亮時共用輸入層不攔，頁面會被捲走。
      if (action === "action") e.preventDefault();
      instance.pressKey(action);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const action = keyAction(e.key);
      if (action && DRIVE_KEYS.has(action)) instance.releaseKey(action);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [instance, screen]);

  // 前窗提示與指差確認念一次：同一件事一站只念一句，排在車內廣播後面，輪到時已經消失的就不念。
  useEffect(() => {
    if (!run || screen !== "drive" || status !== "playing" || !voiceRef.current) return;
    const recheck = (ms: number) => {
      const timer = window.setTimeout(() => setVoiceTick((tick) => tick + 1), ms + 20);
      return () => window.clearTimeout(timer);
    };
    const wait = voiceBusyUntil.current - performance.now();
    if (wait > 0) return recheck(wait);
    const coach = coachSpeech.current;
    coachSpeech.current = null;
    const freshCoach = coach && beat === "brake" ? coach : null;
    const door = freshCoach ? null : doorSpeech.current;
    if (!freshCoach) doorSpeech.current = null;
    const freshDoor = door && performance.now() - door.at <= DOOR_SPEECH_STALE_MS ? door.item : null;
    const item = freshCoach ?? freshDoor ?? nextSpeech(run, display.gaugeNumbers, spoken.current, { skipPlatform: coachOn });
    if (!item) return;
    spoken.current.add(item.key);
    const ms = speechMs(item.text);
    voiceBusyUntil.current = performance.now() + ms;
    speakText(item.text, { interrupt: false, volume: volumeRef.current });
    // 車停著時 run 不會變；念完再看一次，同一刻還有下一句（例如提示）就接著念。
    return recheck(ms);
  }, [beat, coachOn, display.gaugeNumbers, run, screen, status, voiceTick]);

  // 示範真的出現了才算一趟（開局就離開的不算）；到第二拍排一句「右邊拉，停在綠區」，一站一次。
  useEffect(() => {
    if (!run || beat === "none") return;
    coachShownAt.current = run.stationIndex;
    if (!coachCounted.current) {
      coachCounted.current = true;
      saveOrangeExpressCoach(startCoachRun(run.course, loadOrangeExpressCoach()));
    }
    if (beat !== "brake") return;
    const key = `${run.stationIndex}:coach`;
    if (spoken.current.has(key) || coachSpeech.current?.key === key) return;
    coachSpeech.current = { key, text: COPY.coachBrake };
    setVoiceTick((tick) => tick + 1);
  }, [beat, run]);

  useEffect(() => {
    if (!shake) return;
    const timer = window.setTimeout(() => setShake(false), 280);
    return () => window.clearTimeout(timer);
  }, [shake]);

  // 再按一次會重新顯示：shake 每按一次都會變，計時跟著重來。
  useEffect(() => {
    if (!doorHint) return;
    const timer = window.setTimeout(() => setDoorHint(false), DOOR_HINT_MS);
    return () => window.clearTimeout(timer);
  }, [doorHint, shake]);

  useEffect(() => {
    if (!run || screen !== "drive") return;
    const prev = phaseRef.current;
    if (prev !== "in-window" && prev !== "stopped" && run.phase === "in-window") {
      audio?.voices?.(ARRIVE_CHIME);
    }
    if (prev !== "stopped" && run.phase === "stopped") {
      audio?.voices?.(ARRIVAL_MELODY);
      // 示範中停在綠區或黃區才算學會；停太早、開過頭倒車都不算，下一站或下一趟再示範。
      if (coachOn && coachShownAt.current === run.stationIndex && run.grades[run.stationIndex]) {
        saveOrangeExpressCoach(learnCoach(run.course, loadOrangeExpressCoach()));
        setCoachOn(false);
      }
    }
    if (prev !== "doors-open" && run.phase === "doors-open") audio?.voices?.(DOOR_CHIME);
    phaseRef.current = run.phase;
    if (run.phase === "route-done") {
      stopSound();
      instance.notifyWon(run);
      setScreen("result");
      syncHost();
    }
  }, [audio, coachOn, instance, run, screen, stopSound, syncHost]);

  const driving = status === "playing" && screen === "drive" && run?.phase !== "route-done";

  useEffect(() => {
    if (!driving) stopSound();
  }, [driving, stopSound]);

  // 每位朋友上車：等乘客卡滑完、愛心泡泡冒出來時叮一聲（現有的輕鈴，不念角色台詞）。
  // 上車時每一幀 run 都在變，timer 不能跟著 effect 清掉，不然 0.4 秒上一位、0.64 秒才響的鈴會被下一幀取消；
  // 收進清單，只在離開畫面時一起清。
  const boardedRef = useRef(0);
  const boardChimes = useRef<number[]>([]);
  useEffect(() => {
    if (!run || run.phase !== "doors-open") {
      boardedRef.current = 0;
      return;
    }
    if (run.boarded <= boardedRef.current) return;
    boardedRef.current = run.boarded;
    const timer = window.setTimeout(() => {
      boardChimes.current = boardChimes.current.filter((t) => t !== timer);
      audio?.voices?.(ARRIVE_CHIME);
    }, BOARD_CHIME_DELAY_MS);
    boardChimes.current.push(timer);
  }, [audio, run]);

  useEffect(() => {
    const timers = boardChimes;
    return () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current = [];
    };
  }, []);

  useEffect(() => stopSound, [stopSound]);
  useEffect(() => clearAnnounce, [clearAnnounce]);

  useEffect(() => {
    if (swayOn || !swayRef.current) return;
    swayRef.current.style.transform = "";
  }, [swayOn, screen]);

  useGameLoop({
    enabled: driving,
    onFrame: (dtMs) => {
      const cur = runRef.current;
      if (!cur || instance.isInputPaused() || cur.phase === "route-done") return;
      const dt = dtMs / 1000;
      const next = frozen.current ? cur : step(cur, { type: "tick", dt });
      if (next !== cur) apply(next);

      if (!sound.current) {
        const now = performance.now();
        if (now - soundTriedAt.current > SOUND_RETRY_MS) {
          soundTriedAt.current = now;
          const bed = audio?.bedOutput?.();
          if (bed) {
            sound.current = new DriveSound(bed.ctx, bed.out);
            sound.current.start();
          }
        }
      }
      sound.current?.update(driveMix(next.speed, next.power, next.brake, inTunnel(next)));

      const sameStation = next.stationIndex === cur.stationIndex;
      if (next.autoBrakeCount > cur.autoBrakeCount) audio?.voices?.(AUTO_BRAKE_DING);
      if (
        next.passing !== null &&
        next.passing >= WHOOSH_AT &&
        (cur.passing === null || cur.passing < WHOOSH_AT)
      ) {
        audio?.voices?.(PASS_WHOOSH);
      }
      if (sameStation && jointsCrossed(cur.progress, next.progress) > 0 && next.speed > 0.02) {
        audio?.voices?.(jointClack(next.speed));
        bump.current = 1;
      }

      const el = swayRef.current;
      if (!el || !swayOn) return;
      swayClock.current += dt;
      bump.current = decayBump(bump.current, dt);
      const sway = next.phase === "reversing" ? NO_SWAY : swayAt(swayClock.current, next.speed, bump.current);
      el.style.transform = `translate3d(${sway.x}px, ${sway.y}px, 0) rotate(${sway.rot}deg) scale(1.03)`;
    },
  });

  const choose = (next: LevelId) => {
    picked.current = true;
    setLevel(next);
    saveOrangeExpressLevel(next);
  };

  if (screen === "title" || !run) {
    return (
      <div className={styles.screen} data-screen="title" data-testid="orange-express-title">
        <TitleHero />
        <p className={styles.route}>{COPY.routeName}</p>
        <div className={styles.levels} role="radiogroup" aria-label={COPY.routeName}>
          {LEVELS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={level === id}
              className={level === id ? styles.levelOn : styles.level}
              onClick={() => choose(id)}
            >
              <span className={styles.levelArt} aria-hidden>
                <LevelGlyph level={id} />
                <span className={styles.levelDots}>
                  {[1, 2, 3].map((n) => (
                    <i key={n} data-on={n <= LEVEL_DOTS[id] ? "true" : "false"} />
                  ))}
                </span>
              </span>
              <span className={styles.levelText}>
                <strong>{COPY.levels[id]}</strong>
                <small>{COPY.levelHints[id]}</small>
                {id === "drive" ? (
                  // 司機說明收在「自己開」卡片裡（按鈕裡只能放行內元素），不再另外一個像第四張卡的框。
                  <span className={styles.driverNote} data-testid="orange-express-driver-note">
                    <em className={styles.driverChip} data-driver={driver}>
                      {COPY.driverLabel}：{DRIVER_NAME[driver]}
                    </em>
                    {level === "drive" ? (
                      <>
                        <small>{DRIVER_HINT[driver]}</small>
                        <small>{COPY.driverHow}</small>
                      </>
                    ) : null}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
        <button type="button" className={styles.primary} onClick={onStart}>
          {COPY.start}
        </button>
        <button type="button" className={styles.secondary} onClick={onOpenTutorial}>
          {COPY.howTo}
        </button>
      </div>
    );
  }

  if (screen === "result") {
    const earlyDoors = instance.earlyDoorCount();
    const medals = medalsFor(run, earlyDoors);
    return (
      <div className={styles.screen} data-screen="result">
        <OrangeExpressResult
          stars={medals.stars}
          missReason={starMissReason(run, earlyDoors)}
          reduced={reducedMotion}
          stations={run.stations}
          grades={run.grades}
          pointsDone={run.pointsDone.length}
          bridgeGreets={run.bridgeGreets}
          landmarkGreets={run.landmarkGreets}
          landmarkTask={COURSE_RULES[run.course].landmarkGreet}
          onReplay={begin}
          onTitle={goTitle}
        />
      </div>
    );
  }

  return (
    <div
      className={styles.screen}
      data-screen="drive"
      data-testid="orange-express-drive"
      data-honked={honked}
      data-station-index={run.stationIndex}
      data-phase={run.phase}
      data-reduced={reducedMotion ? "true" : "false"}
      data-sway={swayOn ? "true" : "false"}
      data-course={run.course}
      data-tunnel={inTunnel(run) ? "true" : "false"}
      data-auto-brake={run.autoBrake ? "true" : "false"}
      data-auto-brake-count={run.autoBrakeCount}
      data-points={run.pointsDone.length}
      data-bridge-greets={run.bridgeGreets}
      data-misses={run.misses}
    >
      <OrangeExpressWindshield
        run={run}
        reduced={reducedMotion}
        numbers={display.gaugeNumbers}
        swayRef={swayRef}
        doorHint={doorHint}
        coach={{ beat, on: coachOn }}
        onPoint={pointCheck}
      />
      <p className={styles.live} aria-live="polite">
        {liveText(run, doorHint, beat)}
      </p>
      <OrangeExpressCab
        run={run}
        shake={shake}
        numbers={display.gaugeNumbers}
        onPower={setPower}
        onBrake={setBrake}
        onHorn={pressHorn}
        onDoor={tryDoors}
        coachBrake={beat === "brake"}
      />
      {status === "paused" ? (
        <div className={styles.paused}>
          <p>{COPY.paused}</p>
          <button type="button" className={styles.primary} onClick={onResume}>
            {COPY.resume}
          </button>
        </div>
      ) : null}
    </div>
  );
}
