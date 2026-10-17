"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameAudioBus, OverlayProps } from "@/lib/gamekit/adapter";
import type { DinoSushiInstance } from "@/lib/gamekit/games/dino-sushi/adapter";
import { medalCount, medalFlags } from "@/lib/gamekit/progress/meta";
import { loadPlayerProfile } from "@/lib/gamekit/progress/save";
import { GAMEKIT_PROGRESS_EVENT } from "@/lib/gamekit/progress/session";
import { useDinoSushiClayPreload } from "@/lib/games/dino-sushi/art";
import { useDuoDuoStickerPreload } from "@/lib/games/dino-sushi/duoduo-sticker";
import { nextTier, startTier, type OrderTier } from "@/lib/games/dino-sushi/difficulty";
import { DINO_SUSHI_LEVEL_INDEX, roundMedals, type RoundMedals } from "@/lib/games/dino-sushi/medals";
import { SUSHI_SFX } from "@/lib/games/dino-sushi/sfx";
import type { Mode, RoundState } from "@/lib/games/dino-sushi/round";
import { DinoSushiKitchen } from "./DinoSushiKitchen";
import { DinoSushiResult } from "./DinoSushiResult";
import { DinoSushiStickerBook } from "./DinoSushiStickerBook";
import { DinoSushiTitle } from "./DinoSushiTitle";
import { playVoices, useDinoSushiPlay } from "./useDinoSushiPlay";
import { useDinoSushiStickers } from "./useDinoSushiStickers";
import { DINO_SUSHI_STICKER_TOTAL } from "@/lib/games/dino-sushi/stickers";
import { readRoundSeed, roundVariety } from "@/lib/games/dino-sushi/variety";
import styles from "./DinoSushiView.module.css";

type Screen = "title" | "kitchen" | "result";

export type DinoSushiViewProps = OverlayProps & {
  audio?: GameAudioBus;
  instance: DinoSushiInstance;
};

export type DinoSushiOutcome = {
  mode: Mode;
  plates: RoundState["plates"];
  medals: RoundMedals | null;
  seed: number;
};

/** 直接讀存檔，不等 starsGot state（掛載時 effect 還沒跑完就按開始也對）。 */
function storedStars(): number {
  return medalCount(loadPlayerProfile().medals["dino-sushi"]?.[DINO_SUSHI_LEVEL_INDEX] ?? 0);
}

export function DinoSushiView({
  reducedMotion,
  status,
  syncHost,
  audio,
  instance,
  soundOn,
  gameVolume,
  voiceEnabled,
}: DinoSushiViewProps) {
  useDuoDuoStickerPreload();
  useDinoSushiClayPreload();
  const [screen, setScreen] = useState<Screen>("title");
  const [mode, setMode] = useState<Mode>("order");
  const [starsGot, setStarsGot] = useState(0);
  const [outcome, setOutcome] = useState<DinoSushiOutcome | null>(null);
  const inputPaused = instance.isInputPaused() || status === "paused";

  const refreshStars = useCallback(() => {
    setStarsGot(storedStars());
  }, []);
  /**
   * 點餐難度檔位只放記憶體：第一次開始點餐時看存檔裡的星星定起始檔（3 星＝進階），
   * 之後每輪結束依一次做對幾單升降；重新整理就回起始檔。不加存檔欄位、不動星星。
   */
  const tierRef = useRef<OrderTier | null>(null);
  useEffect(() => {
    refreshStars();
    window.addEventListener(GAMEKIT_PROGRESS_EVENT, refreshStars);
    return () => window.removeEventListener(GAMEKIT_PROGRESS_EVENT, refreshStars);
  }, [refreshStars]);

  const onServed = useCallback(() => {
    instance.notifyServed();
  }, [instance]);

  const onDone = useCallback(
    (round: RoundState) => {
      if (round.mode === "order") {
        const medals = roundMedals(round.firstTries);
        tierRef.current = nextTier(round.tier, medals.firstTryCount);
        instance.notifyWon(medals);
        setOutcome({ mode: "order", plates: round.plates, medals, seed: round.seed });
      } else {
        instance.notifyFinished();
        setOutcome({ mode: "free", plates: round.plates, medals: null, seed: round.seed });
      }
      setScreen("result");
      syncHost();
    },
    [instance, syncHost],
  );

  const play = useDinoSushiPlay({ audio, reducedMotion, inputPaused, onServed, onDone });
  const { actions } = play;
  const voiceOn = soundOn && voiceEnabled && gameVolume > 0;
  const stickers = useDinoSushiStickers(play.round, { on: voiceOn, volume: gameVolume });
  const [book, setBook] = useState(false);
  const [queuedSeed, setQueuedSeed] = useState<number | null>(null);
  useEffect(() => {
    setQueuedSeed((current) => current ?? readRoundSeed());
  }, []);
  const unseen = stickers.state.unlocked.filter((id) => !stickers.state.seen.includes(id));

  const begin = useCallback(
    (next: Mode) => {
      audio?.ensureAudio();
      playVoices(audio, SUSHI_SFX.welcome);
      stickers.beginRound();
      setBook(false);
      setMode(next);
      setOutcome(null);
      const seed = queuedSeed ?? readRoundSeed();
      if (next === "order" && tierRef.current === null) tierRef.current = startTier(storedStars());
      actions.start(next, seed, next === "order" ? (tierRef.current ?? "normal") : "normal");
      setQueuedSeed(readRoundSeed());
      setScreen("kitchen");
      instance.notifyPlaying(next);
      syncHost();
    },
    [actions, audio, instance, queuedSeed, stickers, syncHost],
  );

  const goToTitle = useCallback(() => {
    actions.leave();
    setBook(false);
    setOutcome(null);
    setScreen("title");
    instance.notifyReady();
    syncHost();
  }, [actions, instance, syncHost]);

  const closeBook = useCallback(() => {
    stickers.markSeen();
    setBook(false);
  }, [stickers]);

  /* 標題鈕若在摺線下面，點下去的捲動會留著，雨棚上的排隊就被黏住的抬頭切掉。進廚房回到頂。 */
  useEffect(() => {
    if (screen !== "kitchen") return;
    window.scrollTo(0, 0);
  }, [screen]);

  /* controller 經 ref 轉呼叫、只在 mount 註冊一次（同消消樂 G-C1：避免 paused 連鎖重註冊把狀態打回 ready）。 */
  const controllerRef = useRef({ begin, goToTitle, mode });
  controllerRef.current = { begin, goToTitle, mode };
  const syncHostRef = useRef(syncHost);
  syncHostRef.current = syncHost;

  useEffect(() => {
    instance.registerController({
      startOrder: () => controllerRef.current.begin("order"),
      startFree: () => controllerRef.current.begin("free"),
      restart: () => controllerRef.current.begin(controllerRef.current.mode),
      goToTitle: () => controllerRef.current.goToTitle(),
    });
    instance.notifyReady();
    syncHostRef.current();
  }, [instance]);

  return (
    <div
      className={styles.surface}
      data-screen={screen}
      data-mode={screen === "kitchen" ? mode : undefined}
      data-testid="dino-sushi"
      data-reduced={reducedMotion ? "true" : undefined}
      /* 外框的操作提示只在廚房顯示；標題與結算沒有可操作的砧板 */
      data-play-hints={screen === "kitchen" ? undefined : "off"}
    >
      <div className={styles.stage} inert={book} aria-hidden={book ? true : undefined}>
        {screen === "title" ? (
          <DinoSushiTitle
            starsGot={starsGot}
            stickerCount={stickers.state.unlocked.length}
            stickerTotal={DINO_SUSHI_STICKER_TOTAL}
            stickerNew={unseen.length > 0}
            today={queuedSeed === null ? null : roundVariety(queuedSeed)}
            onStart={() => begin("order")}
            onFree={() => begin("free")}
            onBook={() => setBook(true)}
          />
        ) : null}

        {screen !== "title" && play.round ? (
          <DinoSushiKitchen
            play={play}
            reducedMotion={reducedMotion}
            inputPaused={inputPaused}
            soundOn={soundOn}
            gameVolume={gameVolume}
            voiceEnabled={voiceEnabled}
            ownedStickers={stickers.state.unlocked}
          />
        ) : null}

        {screen === "result" && outcome && !book ? (
          <DinoSushiResult
            outcome={outcome}
            stars={outcome.medals ? medalCount(medalFlags(outcome.medals.cleared, outcome.medals.flawless, outcome.medals.collectedAll)) : null}
            fresh={stickers.state.fresh}
            gift={stickers.state.gift}
            reducedMotion={reducedMotion}
            onReplay={() => begin(outcome.mode)}
            onTitle={goToTitle}
            onBook={() => setBook(true)}
          />
        ) : null}
      </div>

      {book ? (
        <DinoSushiStickerBook
          unlocked={stickers.state.unlocked}
          seen={stickers.state.seen}
          reducedMotion={reducedMotion}
          onClose={closeBook}
          onSpeak={stickers.speak}
        />
      ) : null}

      {/* 單一常駐 live 區：新訂單、多多的字卡 */}
      <p className={styles.visuallyHidden} aria-live="polite">
        {play.message}
      </p>
    </div>
  );
}
