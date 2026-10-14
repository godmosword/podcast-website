"use client";

import { useLayoutEffect, useRef } from "react";
import { BaseArt, PlateArt, SHOP_SRC, SushiArt, ToppingArt } from "@/lib/games/dino-sushi/art";
import { matchOrder } from "@/lib/games/dino-sushi/orders";
import { currentOrder } from "@/lib/games/dino-sushi/round";
import { MAX_TOPPINGS } from "@/lib/games/dino-sushi/sushi";
import { BASES, baseById, toppingById } from "@/lib/games/dino-sushi/toppings";
import { DinoSushiDuoDuo } from "./DinoSushiDuoDuo";
import { DinoSushiOrderBubble } from "./DinoSushiOrderBubble";
import { TapButton, TapFinger as Finger, type TapPoint } from "./DinoSushiPiece";
import { DinoSushiPlateStack } from "./DinoSushiPlateStack";
import { ShopBelt, ShopWall } from "./DinoSushiShop";
import { DinoSushiTray } from "./DinoSushiTray";
import type { DinoSushiPlay } from "./useDinoSushiPlay";
import styles from "./DinoSushiKitchen.module.css";

type Props = {
  play: DinoSushiPlay;
  reducedMotion: boolean;
  inputPaused: boolean;
};

/**
 * 連點防呆：第三張皿和「給多多吃」位置重疊，連點兩下會送出只有飯的壽司。
 * 只擋「選完飯這段時間內、又點在剛才那張皿上」的那一下；點在別處、用鍵盤、或中間加過料都照常處理。
 */
const PICK_GUARD_MS = 400;

/**
 * 選飯⇄加料切換時，原本有焦點的鈕被拿掉或變成 inert，焦點會掉到 body。
 * 只有焦點原本在廚房裡才接手：選完飯→第一個能加的料；回到選飯→第一張皿。
 */
function useFocusAcrossPhases(choosingBase: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);
  const focusInside = useRef(false);
  const wasChoosing = useRef(choosingBase);

  useLayoutEffect(() => {
    if (wasChoosing.current === choosingBase) return;
    wasChoosing.current = choosingBase;
    const root = rootRef.current;
    if (!root || !focusInside.current) return;
    const active = document.activeElement;
    const lost = !active || active === document.body || active.closest("[inert]") !== null;
    if (!lost) return;
    const target = root.querySelector<HTMLButtonElement>(
      choosingBase ? '[data-role="base-picker"] button:not(:disabled)' : '[data-role="tray"] button:not(:disabled)',
    );
    target?.focus({ preventScroll: true });
  }, [choosingBase]);

  const focusProps = {
    onFocusCapture: () => {
      focusInside.current = true;
    },
    onBlurCapture: (e: React.FocusEvent<HTMLDivElement>) => {
      // 焦點元素被拿掉時不會觸發 blur；只有真的移到廚房外才算離開
      if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) focusInside.current = false;
    },
  };
  return { rootRef, focusProps };
}

/** 廚房：迴轉壽司店（多多＋泡泡＋疊盤）｜砧板（3 料位）＋「給多多吃」｜托盤。 */
export function DinoSushiKitchen({ play, reducedMotion, inputPaused }: Props) {
  const {
    round,
    phase,
    caption,
    choosingBase,
    shake,
    brushing,
    hint,
    teaching,
    locked,
    actions,
  } = play;
  const { rootRef, focusProps } = useFocusAcrossPhases(choosingBase);
  const picked = useRef<{ at: number; rect: DOMRect } | null>(null);
  if (!round) return null;
  const order = currentOrder(round);
  const eating = round.pending?.eats === true;
  const sushi = round.sushi;
  const flash = caption?.mood === "look" ? (caption.match ?? null) : null;
  const disabled = locked || inputPaused;
  /* 選飯時加料層整層隱藏，裡面不出現亮框和手指 */
  const layerHint = choosingBase ? null : hint;
  const serveHint = layerHint?.kind === "serve";
  const afterPick = (fn: () => void) => (point?: TapPoint) => {
    const last = picked.current;
    picked.current = null;
    const doubleTap =
      last !== null &&
      point !== undefined &&
      performance.now() - last.at < PICK_GUARD_MS &&
      point.x >= last.rect.left &&
      point.x <= last.rect.right &&
      point.y >= last.rect.top &&
      point.y <= last.rect.bottom;
    if (doubleTap) return;
    fn();
  };
  const clearPickGuard = () => {
    picked.current = null;
  };
  /* 吃完才出牙刷，不擋嘴；出現時店面道具讓位，牙刷才看得出是下一步 */
  const brushShown =
    ((round.pending?.brush ?? false) || round.brushReady) && !brushing && (phase === "react" || phase === "idle");

  return (
    <div
      ref={rootRef}
      {...focusProps}
      className={styles.kitchen}
      data-reduced={reducedMotion ? "true" : undefined}
      data-paused={inputPaused ? "true" : undefined}
    >
      <section
        className={styles.duoArea}
        aria-label="多多"
        data-mode={round.mode}
        data-brush={brushShown ? "true" : undefined}
      >
        <ShopWall />
        <DinoSushiDuoDuo
          phase={phase}
          caption={caption}
          serving={eating ? sushi : null}
          brushing={brushing}
          brushShown={brushShown}
          disabled={inputPaused}
          onBrush={actions.brush}
        />
        <ShopBelt />
        <DinoSushiPlateStack plates={round.plates} />
        {/* 右上一欄由上往下排：自由做的「多多吃飽了」→ 點餐泡泡 → 多多的字卡，彼此不會疊在一起 */}
        <div className={styles.talk}>
          {round.mode === "free" ? (
            <button
              type="button"
              className={styles.fullButton}
              onClick={actions.finish}
              disabled={disabled}
            >
              多多吃飽了
            </button>
          ) : null}
          {/* 吃的時候收起泡泡，字卡接手；下一單泡泡等反應結束才出現 */}
          {order && !eating ? (
            <DinoSushiOrderBubble
              order={order}
              sushi={sushi}
              flash={flash}
              index={round.index}
              total={round.orders.length}
            />
          ) : null}
          {caption ? (
            <p className={styles.caption} data-mood={caption.mood} aria-hidden>
              {caption.line}
            </p>
          ) : null}
        </div>
      </section>

      <section
        className={styles.board}
        aria-label="砧板"
        data-choosing={choosingBase ? "true" : undefined}
      >
        {/* 加料層一直在：砧板高度兩階段一樣，上方店面不會伸縮跳動。選飯時整層 inert＋aria-hidden */}
        <div className={styles.boardLayer} inert={choosingBase} aria-hidden={choosingBase ? true : undefined}>
          <div
            className={styles.boardMain}
            /* a／b 兩個同樣的晃動動畫輪流換名字才會重播；不用 key 重掛，免得壽司和料位的進場動畫一起重跳 */
            data-shake={shake === 0 ? undefined : shake % 2 === 0 ? "a" : "b"}
          >
            <div className={styles.prep}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 原檔備料盤 */}
              <img className={styles.prepPlate} src={SHOP_SRC.prepplate} alt="" draggable={false} decoding="sync" />
              <TapButton
                className={styles.sushiButton}
                aria-label={
                  sushi.base
                    ? `換飯：現在是${baseById(sushi.base).label}`
                    : "選飯"
                }
                data-hint={layerHint?.kind === "base" ? "true" : undefined}
                disabled={disabled}
                onTap={afterPick(actions.reopenBase)}
              >
                {/* 換一種飯才重掛：落下動畫照舊在選完飯時播一次 */}
                {eating ? null : (
                  <SushiArt
                    key={sushi.base ?? "none"}
                    sushi={sushi}
                    layerClassName={reducedMotion ? undefined : styles.layerPop}
                  />
                )}
                {teaching && layerHint?.kind === "base" ? <Finger /> : null}
              </TapButton>
            </div>
            <div
              className={styles.slots}
              role="group"
              aria-label={`料位，最多 ${MAX_TOPPINGS} 個`}
            >
              {Array.from({ length: MAX_TOPPINGS }, (_, i) => {
                const id = eating ? undefined : sushi.toppings[i];
                const removeHint = layerHint?.kind === "remove" && layerHint.slot === i;
                return id ? (
                  <TapButton
                    key={i}
                    className={styles.slot}
                    aria-label={`拿掉${toppingById(id).label}`}
                    data-hint={removeHint ? "true" : undefined}
                    disabled={disabled}
                    onTap={() => {
                      clearPickGuard();
                      actions.remove(i);
                    }}
                  >
                    <ToppingArt id={id} />
                    {teaching && removeHint ? <Finger /> : null}
                  </TapButton>
                ) : (
                  <span key={i} className={styles.slotEmpty} aria-hidden />
                );
              })}
            </div>
          </div>
          <TapButton
            className={styles.serveButton}
            data-hint={serveHint ? "true" : undefined}
            data-muted={order && !matchOrder(sushi, order).ok ? "true" : undefined}
            disabled={disabled || !sushi.base}
            onTap={afterPick(actions.serve)}
          >
            <span className={styles.serveArt} aria-hidden>
              <PlateArt />
            </span>
            給多多吃
            {teaching && serveHint ? <Finger /> : null}
          </TapButton>
        </div>
        {/* 選飯時只做選飯這一步：三張皿疊在加料層上面 */}
        {choosingBase ? (
          <div className={styles.basePicker} role="group" aria-label="選飯" data-role="base-picker">
            {BASES.map((b) => (
              <TapButton
                key={b.id}
                className={styles.baseButton}
                aria-label={`選${b.label}`}
                aria-pressed={sushi.base === b.id}
                data-hint={
                  hint?.kind === "base" && hint.id === b.id
                    ? "true"
                    : undefined
                }
                disabled={disabled}
                onTap={(point) => {
                  picked.current = point ? { at: performance.now(), rect: point.rect } : null;
                  actions.pickBase(b.id);
                }}
              >
                <span className={styles.baseArt} aria-hidden>
                  <BaseArt id={b.id} />
                </span>
                <span className={styles.baseLabel} aria-hidden>
                  {b.label}
                </span>
                {teaching && hint?.kind === "base" && hint.id === b.id ? (
                  <Finger />
                ) : null}
              </TapButton>
            ))}
          </div>
        ) : null}
      </section>

      <DinoSushiTray
        tray={round.tray}
        disabled={disabled || !sushi.base || choosingBase}
        waitingForBase={!sushi.base || choosingBase}
        hint={hint?.kind === "topping" ? hint.id : null}
        teaching={teaching}
        onAdd={(id) => {
          clearPickGuard();
          actions.add(id);
        }}
      />
    </div>
  );
}
