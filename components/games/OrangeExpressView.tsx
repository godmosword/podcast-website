"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameAudioBus, OverlayProps } from "@/lib/gamekit/adapter";
import type { GameAction } from "@/lib/gamekit/types";
import { useGameLoop } from "@/lib/gamekit/react/useGameLoop";
import { keyAction } from "@/lib/gamekit/runtime/input";
import {
  loadOrangeExpressCoach,
  loadOrangeExpressJournal,
  loadOrangeExpressLevel,
  resolveOrangeExpressDriver,
  resolveOrangeExpressLevel,
  saveOrangeExpressCoach,
  saveOrangeExpressJournal,
  saveOrangeExpressLevel,
} from "@/lib/gamekit/progress/orange-express-prefs";
import { OrangeExpressJournalRow } from "@/components/games/OrangeExpressJournalRow";
import { OrangeExpressCab } from "@/components/games/OrangeExpressCab";
import Image from "next/image";
import { LevelGlyph, XiaojuFace } from "@/components/games/OrangeExpressGlyphs";
import { OrangeExpressResult } from "@/components/games/OrangeExpressResult";
import { useOrangeExpressDisplay } from "@/components/games/OrangeExpressSettings";
import { OrangeExpressWindshield } from "@/components/games/OrangeExpressWindshield";
import { missionNames } from "@/components/games/OrangeExpressMissionCard";
import { MISSION_SILENT_MS, useOrangeExpressMission } from "@/components/games/useOrangeExpressMission";
import type { OrangeExpressInstance } from "@/lib/gamekit/games/orange-express/adapter";
import { announce, nextStationAnnouncement, speechMs } from "@/lib/games/orange-express/announce";
import {
  ANNOUNCE_CHIME,
  ARRIVAL_MELODY,
  ARRIVE_CHIME,
  AUTO_BRAKE_DING,
  BRAKE_LEVER_SOUND,
  BUMP_STOP_SOUND,
  CROSSING_BELL,
  DOOR_CHIME,
  EARLY_SLOW_BELL,
  EMERGENCY_CLICK,
  HORN,
  PASS_WHOOSH,
  POINT_OK,
  POWER_LEVER_SOUND,
  SIGNAL_GREEN_CHIME,
  SMOOTH_STOP_SOUND,
  jointClack,
} from "@/lib/games/orange-express/chime";
import { coachBeat, type CoachBeat } from "@/lib/games/orange-express/coach";
import { nextAction, type NextAction } from "@/lib/games/orange-express/next-action";
import { coachThisRun, learnCoach, startCoachRun } from "@/lib/games/orange-express/coach-record";
import {
  COPY,
  DRIVER_HINT,
  DRIVER_NAME,
  GRADE_TEXT,
  LEVEL_DOTS,
  GOAL_NEXT,
  GOAL_NOW,
  GOAL_TEXT,
  missionLine,
  resultLineFor,
} from "@/lib/games/orange-express/copy";
import {
  EMPTY_JOURNAL,
  freshStamps,
  nextGoal,
  progressOf,
  recordRun,
  type JournalStamps,
  type OrangeExpressJournal,
  type RunGoal,
  type RunProgress,
} from "@/lib/games/orange-express/journal";
import { activeEvent, cheerFor, doneCount, eventPending } from "@/lib/games/orange-express/events";
import { isSmoothStop, medalsFor, starMissReason } from "@/lib/games/orange-express/medals";
import { COURSE_RULES } from "@/lib/games/orange-express/routes";
import { eventSpeech, nextSpeech, type SpeechItem } from "@/lib/games/orange-express/notice";
import {
  clampPower,
  createRun,
  currentStation,
  inTunnel,
  onBridge,
  signalRed,
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

/**
 * 封面也是開始的入口（小孩會直接點圖）：跟「開始開車」同一個 onStart、同一個難度。
 * 它是重複的入口，所以 aria-hidden＋tabIndex -1，讀屏與鍵盤只走難度 radio 和主鈕。
 */
function TitleHero({ onStart }: { onStart: () => void }) {
  return (
    <button
      type="button"
      className={styles.titleHero}
      data-testid="orange-express-title-hero"
      aria-hidden
      tabIndex={-1}
      onClick={onStart}
    >
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
    </button>
  );
}

type Screen = "title" | "drive" | "result";

const LEVELS: readonly LevelId[] = ["look", "drive", "captain"];
const SOUND_RETRY_MS = 1000;
/** 「叮咚」之後再念站名。 */
const ANNOUNCE_DELAY_MS = 650;
/** 乘客卡滑完（600ms）、愛心泡泡冒出來的時候。 */
const BOARD_CHIME_DELAY_MS = 640;
/** 推了動力、煞車沒放、車不走這麼久才提示「先把煞車放開」：先推動力再鬆煞車是真車的做法，不打斷。 */
const RELEASE_HINT_DELAY_MS = 900;
/** 門還沒亮就按：前窗提示留這麼久。 */
const DOOR_HINT_MS = 2400;
/** 「門亮了再按」排在廣播後面；等太久才輪到就不念了，孩子早就不記得剛剛按過。 */
const DOOR_SPEECH_STALE_MS = 4000;
/** 降速牌前提前慢下來：小橘開心這麼久。 */
const CHEER_MS = 1000;
/** 沿途事件做到了：小橘開心久一點（比提前慢下來更大的事，孩子要看得到）。 */
const EVENT_CHEER_MS = 1600;
/** 任務卡收起前，前窗提示最多先等這麼久（收起時會改成真正的時間）。 */
const MISSION_HOLD_MS = 60_000;
/** 車停著（狀態沒變）時前窗多久重畫一次：雲、樹、月台朋友照樣在動，30fps 就夠，省電（PR-J3）。 */
const IDLE_PAINT_MS = 33;
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

/** 駕駛台亮了、本來沒人說的三步要念的那句（同一站各一次；其他下一步本來就有語音）。 */
function actionSpeech(run: RunState, next: NextAction | null): SpeechItem | null {
  if (!next) return null;
  const text =
    next.reason === "start" ? COPY.actGo : next.reason === "open" ? COPY.actOpen : next.reason === "close" ? COPY.actClose : null;
  return text ? { key: `${run.stationIndex}:act-${next.reason}`, text } : null;
}

function liveText(run: RunState, doorHint: boolean, next: NextAction | null): string {
  if (run.phase === "reversing") return COPY.reversing;
  if (signalRed(run)) return COPY.redWait;
  if (doorHint) return COPY.earlyDoorHint;
  if (next?.reason === "release") return COPY.releaseBrake;
  if (next?.reason === "brake") return COPY.coachBrake;
  if (next?.reason === "brake-ready") return COPY.coachReady;
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
  if (onBridge(run) && COURSE_RULES[run.course].bridgeGreet) return run.bridgeGreeted ? COPY.bridgeGreeted : COPY.bridge;
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
  /** 這一趟跟上一趟比的進步、下趟小目標（開完那一刻算好，存檔前先比）。 */
  const [outcome, setOutcome] = useState<{ progress: RunProgress | null; goal: RunGoal | null }>({
    progress: null,
    goal: null,
  });
  /** 這一趟任務卡帶的小目標（上一趟留下的）。 */
  const [missionGoal, setMissionGoal] = useState<RunGoal | null>(null);
  /** 標題的沿途見聞：存檔只在瀏覽器讀得到，掛載後才讀（伺服器先畫空的，避免水合不一致）。 */
  const [journal, setJournal] = useState<OrangeExpressJournal>(EMPTY_JOURNAL);
  /** 剛開完的那一趟新拿到的章：回標題時彈一下；開下一趟就清掉。 */
  const [fresh, setFresh] = useState<JournalStamps | null>(null);
  /** 按「再存一次」後重畫：存檔狀態放在 instance 裡，React 看不到它變。 */
  const [, setSaveTick] = useState(0);
  const retrySave = useCallback(() => {
    instance.flushSessions();
    setSaveTick((tick) => tick + 1);
  }, [instance]);
  const [level, setLevel] = useState<LevelId>("look");
  const [run, setRun] = useState<RunState | null>(null);
  const [shake, setShake] = useState(false);
  const [arrivalNod, setArrivalNod] = useState(false);
  /** 門還沒亮就按了：前窗（或停車目標條）當下說「門亮了再按」，不等到結算。 */
  const [doorHint, setDoorHint] = useState(false);
  /** 「先把煞車放開」等夠久了沒（看桿位）；真的顯示還要條件仍成立。 */
  const [releaseReady, setReleaseReady] = useState(false);
  /** 這一趟要不要做第一次進站的停車示範；停好學會了就關掉。 */
  const [coachOn, setCoachOn] = useState(false);
  const [honked, setHonked] = useState(0);
  /** 提前慢下來的次數變多時加一：小橘開心一秒，連續兩次時計時重來。 */
  const [cheerTick, setCheerTick] = useState(0);
  /** 這一次開心要多久（事件做到比提前慢下來久）。 */
  const cheerMs = useRef(CHEER_MS);
  const [cheer, setCheer] = useState(false);
  /** 車停著時 run 不會變；廣播念完後用它叫朗讀再看一次前窗。 */
  const [voiceTick, setVoiceTick] = useState(0);
  const [display] = useOrangeExpressDisplay();
  const { mission, start: startMission, dismiss: dismissMission, clear: clearMission } = useOrangeExpressMission();
  const runRef = useRef<RunState | null>(null);
  const levelRef = useRef(level);
  const screenRef = useRef(screen);
  const phaseRef = useRef<RunState["phase"] | null>(null);
  const picked = useRef(false);
  const frozen = useRef(false);
  /** 前窗的重畫函式（前窗自己掛上來）；車停著時迴圈用它補畫。 */
  const windshieldPaint = useRef<(() => void) | null>(null);
  const idlePaintMs = useRef(0);
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
  /** 開局任務卡那句大約念到這個時間；孩子在這之前就碰桿子開車的話，沿途事件提示可以打斷它。 */
  const missionSpeechUntil = useRef(0);
  /** 孩子在任務卡那句還沒念完就碰了桿子。 */
  const missionCut = useRef(false);
  /** 任務卡收起後等著念的「下一站」：排在沿途事件提示後面（提示有時效、廣播沒有）。 */
  const pendingAnnounce = useRef<RunState | null>(null);
  /** 等著念的「門亮了再按」：一站只念一次，排在廣播後面。 */
  const doorSpeech = useRef<{ item: SpeechItem; at: number } | null>(null);
  /**
   * 等著念的示範句：第一拍「快到了，準備拉右邊」、第二拍「現在拉，停在綠區」，每拍一站一次，還在那一拍才念。
   * 第二拍有時效，插隊念（打斷前一句）；第一拍排在最前面但等前一句念完。
   */
  const coachSpeech = useRef<(SpeechItem & { beat: CoachBeat }) | null>(null);
  /** 等著念的「先把煞車放開」：一趟只念一次。 */
  const releaseSpeech = useRef<SpeechItem | null>(null);
  /** 這一趟示範過了沒（小小司機的趟數只加一次）。 */
  const coachCounted = useRef(false);
  const resultSpoken = useRef(false);
  /** 這一趟記進進步紀錄了沒（每趟只記一次；begin() 重設）。 */
  const journalRecorded = useRef(false);
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
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  /** 掛鉤釘住的前窗時鐘（視覺基準）；沒釘是 null。 */
  const pinnedClock = useRef<number | null>(null);
  /**
   * 前窗時鐘（PR-J3）：定格（測試、基準）與減少動態時是 0，前窗跟以前一樣定住；掛鉤釘了就用釘的那一秒。
   * 每次畫時才讀，中途解除定格也跟得上。
   */
  const windshieldClock = useCallback(() => {
    if (frozen.current || reducedRef.current) return 0;
    return pinnedClock.current ?? performance.now() / 1000;
  }, []);
  const driveOn = run !== null && status === "playing" && screen === "drive";
  /** 進站的拍子：駕駛台「停」格什麼時候亮（低齡與大司機每一趟都看它）；暫停、離開駕駛畫面時是 none。 */
  const stopBeat: CoachBeat = driveOn ? coachBeat(run) : "none";
  /** 第一次進站示範的這一拍（念「快到了」「現在拉」、停車目標條外圈與淡小橘）；這一趟不示範時是 none。 */
  const beat: CoachBeat = coachOn ? stopBeat : "none";
  /**
   * 「先把煞車放開」看桿位，不看車實際的反應：動力推了、煞車沒放、車停著，在開車中（不是停好、
   * 門開著、倒車）才算。停好門亮著時孩子推動力是想走，但該做的是開門，那時不提示。
   */
  const releaseWanted =
    run !== null &&
    status === "playing" &&
    screen === "drive" &&
    (run.phase === "running" || run.phase === "in-window") &&
    // 紅燈時推動力不走是在等車，不是煞車沒放。
    !signalRed(run) &&
    run.power > 0 &&
    run.brake > 0 &&
    run.speed <= 0.001;
  const releaseHint = releaseWanted && releaseReady;
  /**
   * 現在只該亮的那一個控制（PR-J1）：只在這裡算一次，給駕駛台、前窗指差鈕、讀屏與朗讀。
   * memo 住：朗讀 effect 依賴它，輸入沒變時同一個物件，不多跑一次、不重排計時器。
   */
  const missionShown = mission === "shown";
  const next: NextAction | null = useMemo(
    () => (driveOn && run ? nextAction(run, { mission: missionShown, releaseHint, coachOn, beat: stopBeat }) : null),
    [coachOn, driveOn, missionShown, releaseHint, run, stopBeat],
  );

  /**
   * 換成新的狀態。做到沿途事件或提前慢下來的回饋在這裡判斷（不只每幀的 tick）：
   * 喇叭做到的平交道、揮手是在按下去那一刻寫入的，下一幀再比就看不到變化了。
   */
  const apply = useCallback(
    (next: RunState) => {
      const prev = runRef.current;
      runRef.current = next;
      setRun(next);
      const cheer = prev ? cheerFor(prev, next) : null;
      if (!cheer) return;
      audio?.voices?.(EARLY_SLOW_BELL);
      cheerMs.current = cheer === "event" ? EVENT_CHEER_MS : CHEER_MS;
      setCheerTick((tick) => tick + 1);
    },
    [audio],
  );

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
    pinnedClock.current = typeof hook?.clock === "number" && Number.isFinite(hook.clock) ? hook.clock : null;
    const nextDriver = hook?.driver ?? driverRef.current;
    // 沿途事件每趟換排法；掛鉤在時固定（測試與基準要穩定），可用 eventSeed 指定。
    const seed = hook ? (hook.eventSeed ?? 0) : Math.floor(Math.random() * 1_000_000);
    const next = withHook(createRun(nextLevel, nextDriver, seed), hook);
    phaseRef.current = next.phase;
    spoken.current = new Set();
    pendingAnnounce.current = null;
    missionCut.current = false;
    missionSpeechUntil.current = 0;
    resultSpoken.current = false;
    journalRecorded.current = false;
    setOutcome({ progress: null, goal: null });
    setFresh(null);
    doorSpeech.current = null;
    setDoorHint(false);
    // 掛鉤在（測試、視覺基準）時不示範，除非掛鉤寫 coach: true。
    const coachAllowed = !hook || hook.coach === true;
    setCoachOn(coachAllowed && coachThisRun(next.course, loadOrangeExpressCoach()));
    coachCounted.current = false;
    coachShownAt.current = null;
    coachSpeech.current = null;
    releaseSpeech.current = null;
    apply(next);
    // 大司機開局先出任務卡、念「今天要去接…回家」。掛鉤在時不出，除非寫 mission: true。
    // 朗讀順序：任務卡 → 沿途事件提示（有時效，孩子一開始就開快時會先到）→ 下一站。
    const missionOn = COURSE_RULES[next.course].journey && (!hook || hook.mission === true);
    const goal = missionOn ? (loadOrangeExpressJournal().goals[next.course] ?? null) : null;
    setMissionGoal(goal);
    if (missionOn) {
      const names = missionLine(missionNames(next.stations));
      const line = goal ? `${names}。${GOAL_NOW}${GOAL_TEXT[goal]}` : names;
      const voice = voiceRef.current;
      const speechEnd = performance.now() + (voice ? speechMs(line) : 0);
      if (voice) speakText(line, { interrupt: true, volume: volumeRef.current });
      missionSpeechUntil.current = speechEnd;
      clearAnnounce();
      // 收起前不念前窗提示（有限的數：setTimeout 收到 Infinity 會當成 0、變成一直重排）。
      voiceBusyUntil.current = performance.now() + MISSION_HOLD_MS;
      startMission(voice ? speechEnd - performance.now() + 300 : MISSION_SILENT_MS, () => {
        // 音效關著（不念）：照舊直接響叮咚。念得出聲時交給念提示的 effect 排順序。
        if (!voiceRef.current) {
          announceNext(next);
          return;
        }
        pendingAnnounce.current = next;
        voiceBusyUntil.current = Math.max(performance.now(), speechEnd);
        setVoiceTick((tick) => tick + 1);
      });
    } else {
      clearMission();
      announceNext(next);
    }
    setScreen("drive");
    instance.notifyPlaying(nextLevel);
    syncHost();
  }, [announceNext, apply, clearAnnounce, clearMission, instance, startMission, syncHost]);

  const goTitle = useCallback(() => {
    runRef.current = null;
    resultSpoken.current = false;
    phaseRef.current = null;
    doorSpeech.current = null;
    pendingAnnounce.current = null;
    missionCut.current = false;
    setDoorHint(false);
    setCoachOn(false);
    coachShownAt.current = null;
    coachSpeech.current = null;
    releaseSpeech.current = null;
    setRun(null);
    setScreen("title");
    stopSound();
    clearAnnounce();
    clearMission();
    instance.notifyReady();
    syncHost();
  }, [clearAnnounce, clearMission, instance, stopSound, syncHost]);

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
      // 孩子第一次碰桿子就收任務卡；那句還在念的話，之後的沿途事件提示可以打斷它。
      if (performance.now() < missionSpeechUntil.current) missionCut.current = true;
      dismissMission();
      const target = clampPower(notch);
      const next = step(cur, { type: "set-power", notch: target });
      if (next === cur) {
        // 門開著推不走：抖車門，告訴孩子先關門。倒車中推不走就不抖，車門跟這件事無關。
        if (cur.phase === "doors-open" && target > cur.power) setShake(true);
        return;
      }
      audio?.ensureAudio();
      audio?.voices?.(POWER_LEVER_SOUND);
      apply(next);
    },
    [apply, audio, dismissMission],
  );

  const setBrake = useCallback(
    (notch: number) => {
      const cur = runRef.current;
      if (!cur) return;
      if (performance.now() < missionSpeechUntil.current) missionCut.current = true;
      dismissMission();
      // 吸到這一檔有的格子在 step 裡做（慢慢看只有鬆、停、緊急）。
      const next = step(cur, { type: "set-brake", notch });
      if (next === cur) return;
      audio?.ensureAudio();
      audio?.voices?.(next.brake === EMERGENCY ? EMERGENCY_CLICK : BRAKE_LEVER_SOUND);
      apply(next);
    },
    [apply, audio, dismissMission],
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

  /** 跟揮手的朋友揮手（PR-K1）：點前窗的朋友卡，或揮手提示掛著時按空白鍵。鈴聲與小橘開心在 apply 比前後時給。 */
  const waveBack = useCallback(() => {
    const cur = runRef.current;
    if (!cur || instance.isInputPaused()) return;
    const next = step(cur, { type: "wave" });
    if (next === cur) return;
    audio?.ensureAudio();
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
      if (action === "action") {
        // 風景段沒有門可開：揮手提示掛著時，空白鍵是跟朋友揮手（鍵盤的路）。
        if (eventPending(cur)?.kind === "wave") waveBack();
        else tryDoors();
      }
    },
    [instance, pressHorn, setBrake, setPower, tryDoors, waveBack],
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
    const now = performance.now();
    const hint = eventSpeech(run, display.gaugeNumbers, spoken.current);
    // 開局就開快：任務卡那句還在念，沿途事件提示等不到它念完（會過期），直接插隊。
    if (hint && missionCut.current && now < missionSpeechUntil.current) {
      missionCut.current = false;
      missionSpeechUntil.current = 0;
      spoken.current.add(hint.key);
      const ms = speechMs(hint.text);
      voiceBusyUntil.current = now + ms;
      speakText(hint.text, { interrupt: true, volume: volumeRef.current });
      return recheck(ms);
    }
    // 「現在拉」有時效：照做才停得進綠區，不等前一句念完。
    const urgent = coachSpeech.current;
    if (urgent?.beat === "brake" && beat === "brake") {
      coachSpeech.current = null;
      spoken.current.add(urgent.key);
      const ms = speechMs(urgent.text);
      voiceBusyUntil.current = now + ms;
      speakText(urgent.text, { interrupt: true, volume: volumeRef.current });
      return recheck(ms);
    }
    const wait = voiceBusyUntil.current - now;
    if (wait > 0) return recheck(wait);
    const coach = coachSpeech.current;
    coachSpeech.current = null;
    const freshCoach = coach && beat === coach.beat ? coach : null;
    const release = freshCoach ? null : releaseSpeech.current;
    if (!freshCoach) releaseSpeech.current = null;
    const freshRelease = release && releaseHint ? release : null;
    const door = freshCoach || freshRelease ? null : doorSpeech.current;
    if (!freshCoach && !freshRelease) doorSpeech.current = null;
    const freshDoor = door && performance.now() - door.at <= DOOR_SPEECH_STALE_MS ? door.item : null;
    // 待念的「下一站」排在沿途事件提示後面、其他提示前面。
    const announceState = freshCoach || freshRelease || hint ? null : pendingAnnounce.current;
    if (announceState) {
      pendingAnnounce.current = null;
      announceNext(announceState);
      return recheck(Math.max(0, voiceBusyUntil.current - performance.now()));
    }
    const item =
      freshCoach ??
      freshRelease ??
      hint ??
      freshDoor ??
      nextSpeech(run, display.gaugeNumbers, spoken.current, { skipPlatform: coachOn }) ??
      actionSpeech(run, next);
    if (!item || spoken.current.has(item.key)) return;
    spoken.current.add(item.key);
    const ms = speechMs(item.text);
    voiceBusyUntil.current = performance.now() + ms;
    speakText(item.text, { interrupt: false, volume: volumeRef.current });
    // 車停著時 run 不會變；念完再看一次，同一刻還有下一句（例如提示）就接著念。
    return recheck(ms);
  }, [announceNext, beat, coachOn, display.gaugeNumbers, next, releaseHint, run, screen, status, voiceTick]);

  // 條件成立超過一小段才亮；條件一不成立（例如煞車一回 0）就收。
  useEffect(() => {
    if (!releaseWanted) return;
    const timer = window.setTimeout(() => setReleaseReady(true), RELEASE_HINT_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      setReleaseReady(false);
    };
  }, [releaseWanted]);

  // 一趟只念一次「先把煞車放開」。
  useEffect(() => {
    if (!releaseHint) return;
    const key = "run:release";
    if (spoken.current.has(key) || releaseSpeech.current) return;
    releaseSpeech.current = { key, text: COPY.releaseBrake };
    setVoiceTick((tick) => tick + 1);
  }, [releaseHint]);

  // 示範真的出現了才算一趟（開局就離開的不算）。每一拍排一句、一站一次：
  // 第一拍「快到了，準備拉右邊」（車停在區間前就不說），第二拍「現在拉，停在綠區」。
  useEffect(() => {
    if (!run || beat === "none") return;
    coachShownAt.current = run.stationIndex;
    if (!coachCounted.current) {
      coachCounted.current = true;
      saveOrangeExpressCoach(startCoachRun(run.course, loadOrangeExpressCoach()));
    }
    const text = beat === "brake" ? COPY.coachBrake : run.speed > 0 ? COPY.coachReady : null;
    if (!text) return;
    const key = `${run.stationIndex}:coach-${beat}`;
    if (spoken.current.has(key) || coachSpeech.current?.key === key) return;
    coachSpeech.current = { key, text, beat };
    setVoiceTick((tick) => tick + 1);
  }, [beat, run]);

  useEffect(() => {
    if (!shake) return;
    const timer = window.setTimeout(() => setShake(false), 280);
    return () => window.clearTimeout(timer);
  }, [shake]);

  useEffect(() => {
    if (cheerTick === 0) return;
    setCheer(true);
    const timer = window.setTimeout(() => setCheer(false), cheerMs.current);
    return () => window.clearTimeout(timer);
  }, [cheerTick]);

  useEffect(() => {
    if (!arrivalNod) return;
    const timer = window.setTimeout(() => setArrivalNod(false), 200);
    return () => window.clearTimeout(timer);
  }, [arrivalNod]);

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
      if (run.course === "big" || run.course === "captain") {
        const smooth = isSmoothStop(run);
        audio?.voices?.(smooth ? SMOOTH_STOP_SOUND : BUMP_STOP_SOUND);
        if (!smooth && swayOn) {
          setArrivalNod(false);
          window.requestAnimationFrame(() => setArrivalNod(true));
        }
      } else {
        audio?.voices?.(ARRIVAL_MELODY);
      }
      // 示範中停在綠區才算學會；黃區、停太早、開過頭倒車都不算，下一站或下一趟再示範（每組最多 3 趟）。
      if (coachOn && coachShownAt.current === run.stationIndex && run.grades[run.stationIndex] === "green") {
        saveOrangeExpressCoach(learnCoach(run.course, loadOrangeExpressCoach()));
        setCoachOn(false);
      }
    }
    if (prev !== "doors-open" && run.phase === "doors-open") audio?.voices?.(DOOR_CHIME);
    phaseRef.current = run.phase;
    if (run.phase === "route-done") {
      stopSound();
      instance.notifyWon(run);
      // 進步要跟「這一趟之前」比：先讀、比完、再把這一趟記進去。一趟只記一次。
      if (!journalRecorded.current) {
        journalRecorded.current = true;
        const before = loadOrangeExpressJournal();
        const earlyDoors = instance.earlyDoorCount();
        const goal = nextGoal(run, starMissReason(run, earlyDoors));
        setOutcome({ progress: progressOf(before, run, earlyDoors), goal });
        const after = recordRun(before, run, goal);
        setFresh(freshStamps(before, after));
        saveOrangeExpressJournal(after);
      }
      setScreen("result");
      syncHost();
    }
  }, [audio, coachOn, instance, run, screen, stopSound, swayOn, syncHost]);

  const driving = status === "playing" && screen === "drive" && run?.phase !== "route-done";

  useEffect(() => {
    if (!driving) stopSound();
  }, [driving, stopSound]);

  useEffect(() => {
    if (!run || screen !== "result" || !voiceRef.current || resultSpoken.current) return;
    resultSpoken.current = true;
    const line = resultLineFor(run, outcome.progress);
    speakText(outcome.goal ? `${line}。${GOAL_NEXT}${GOAL_TEXT[outcome.goal]}` : line, {
      interrupt: false,
      volume: volumeRef.current,
    });
  }, [gameVolume, outcome, run, screen, soundOn, voiceEnabled]);

  // 回到標題時重讀沿途見聞（剛開完一趟會多幾枚章）。
  useEffect(() => {
    if (screen === "title") setJournal(loadOrangeExpressJournal());
  }, [screen]);

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
      if (next !== cur) {
        apply(next);
        idlePaintMs.current = 0;
      } else if (!frozen.current && !reducedRef.current && pinnedClock.current === null) {
        // 狀態沒變（停好、開門、紅燈前停著）：前窗不會跟著 render 重畫，這裡補畫，風景才不會停住。
        idlePaintMs.current += dtMs;
        if (idlePaintMs.current >= IDLE_PAINT_MS) {
          idlePaintMs.current = 0;
          windshieldPaint.current?.();
        }
      }

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
      sound.current?.update(driveMix(next.speed, next.tractive, next.braking, inTunnel(next)));

      const sameStation = next.stationIndex === cur.stationIndex;
      if (next.autoBrakeCount > cur.autoBrakeCount) audio?.voices?.(AUTO_BRAKE_DING);
      const crossing = activeEvent(next);
      if (crossing?.kind === "crossing" && activeEvent(cur)?.key !== crossing.key) audio?.voices?.(CROSSING_BELL);
      if (signalRed(cur) && !signalRed(next)) audio?.voices?.(SIGNAL_GREEN_CHIME);
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
      <div
        className={styles.screen}
        data-screen="title"
        data-testid="orange-express-title"
        /* 標題面不出底部操作提示（跟壽司屋、消消樂一樣），開車時也收起讓給前窗 */
        data-play-hints="off"
      >
        <TitleHero onStart={onStart} />
        <div className={styles.routeRow}>
          <p className={styles.route}>{COPY.routeName}</p>
          <OrangeExpressJournalRow
            journal={journal}
            fresh={fresh}
            reduced={reducedMotion}
            onSpeak={(text) => {
              if (voiceRef.current) speakText(text, { interrupt: true, volume: volumeRef.current });
            }}
          />
        </div>
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
          resultLine={resultLineFor(run, outcome.progress)}
          goal={outcome.goal}
          smoothStops={medals.smoothStops}
          missReason={starMissReason(run, earlyDoors)}
          reduced={reducedMotion}
          stations={run.stations}
          grades={run.grades}
          pointsDone={run.pointsDone.length}
          bridgeGreets={run.bridgeGreets}
          landmarkGreets={run.landmarkGreets}
          landmarkTask={COURSE_RULES[run.course].landmarkGreet}
          events={run.events}
          onReplay={begin}
          onTitle={goTitle}
          saveFailed={instance.hasUnsavedSessions()}
          onRetrySave={retrySave}
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
      data-smooth-stops={run.smoothStops}
      data-signal={run.signal}
      data-early-slows={run.earlySlows}
      data-events-done={doneCount(run.events)}
      data-events-met={Object.keys(run.events).length}
    >
      <OrangeExpressWindshield
        run={run}
        reduced={reducedMotion}
        numbers={display.gaugeNumbers}
        swayRef={swayRef}
        doorHint={doorHint}
        coach={{ beat, on: coachOn }}
        nod={arrivalNod && swayOn}
        nodBeforeHappy={
          swayOn &&
          run.phase === "stopped" &&
          (run.course === "big" || run.course === "captain") &&
          !isSmoothStop(run)
        }
        cheer={cheer}
        mission={mission}
        missionGoal={missionGoal}
        next={next}
        clock={windshieldClock}
        paintRef={windshieldPaint}
        onPoint={pointCheck}
        onWave={waveBack}
      />
      <p className={styles.live} aria-live="polite">
        {liveText(run, doorHint, next)}
      </p>
      <OrangeExpressCab
        run={run}
        shake={shake}
        numbers={display.gaugeNumbers}
        onPower={setPower}
        onBrake={setBrake}
        onHorn={pressHorn}
        onDoor={tryDoors}
        next={next}
        cheer={cheer}
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
