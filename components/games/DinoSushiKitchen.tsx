"use client";

import { IconTap } from "@/components/games/ClayIcons";
import { BaseArt, PlateArt, SushiArt, ToppingArt } from "@/lib/games/dino-sushi/art";
import { matchOrder } from "@/lib/games/dino-sushi/orders";
import { currentOrder } from "@/lib/games/dino-sushi/round";
import { MAX_TOPPINGS } from "@/lib/games/dino-sushi/sushi";
import { BASES, baseById, toppingById } from "@/lib/games/dino-sushi/toppings";
import { DinoSushiDuoDuo } from "./DinoSushiDuoDuo";
import { DinoSushiOrderBubble } from "./DinoSushiOrderBubble";
import { TapButton } from "./DinoSushiPiece";
import { DinoSushiPlateStack } from "./DinoSushiPlateStack";
import { DinoSushiTray } from "./DinoSushiTray";
import type { DinoSushiPlay } from "./useDinoSushiPlay";
import styles from "./DinoSushiKitchen.module.css";

type Props = {
  play: DinoSushiPlay;
  reducedMotion: boolean;
  inputPaused: boolean;
};

function Finger() {
  return (
    <span className={styles.finger} aria-hidden>
      <IconTap size={30} />
    </span>
  );
}

/** 廚房：多多＋泡泡＋疊盤｜砧板（3 料位）＋「給多多吃」｜托盤。 */
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
  if (!round) return null;
  const order = currentOrder(round);
  const eating = round.pending?.eats === true;
  const sushi = round.sushi;
  const flash = caption?.mood === "look" ? (caption.match ?? null) : null;
  const disabled = locked || inputPaused;
  const serveHint = hint?.kind === "serve";

  return (
    <div
      className={styles.kitchen}
      data-reduced={reducedMotion ? "true" : undefined}
    >
      <section className={styles.duoArea} aria-label="多多">
        <DinoSushiDuoDuo
          phase={phase}
          caption={caption}
          serving={eating ? sushi : null}
          brushing={brushing}
          brushOffer={(round.pending?.brush ?? false) || round.brushReady}
          disabled={inputPaused}
          onBrush={actions.brush}
        />
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
        <DinoSushiPlateStack plates={round.plates} />
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
        <span className={styles.belt} aria-hidden />
      </section>

      <section
        className={styles.board}
        aria-label="砧板"
        data-choosing={choosingBase ? "true" : undefined}
      >
        <div
          className={styles.boardMain}
          data-shake={shake % 2 === 0 ? "a" : "b"}
          data-shaking={shake > 0 ? "true" : undefined}
          key={`shake-${shake}`}
        >
          {choosingBase ? (
            <div className={styles.basePicker} role="group" aria-label="選飯">
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
                  onTap={() => actions.pickBase(b.id)}
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
          ) : (
            <>
              <TapButton
                className={styles.sushiButton}
                aria-label={
                  sushi.base
                    ? `換飯：現在是${baseById(sushi.base).label}`
                    : "選飯"
                }
                data-hint={hint?.kind === "base" ? "true" : undefined}
                disabled={disabled}
                onTap={actions.reopenBase}
              >
                {eating ? null : <SushiArt sushi={sushi} />}
                {teaching && hint?.kind === "base" ? <Finger /> : null}
              </TapButton>
              <div
                className={styles.slots}
                role="group"
                aria-label={`料位，最多 ${MAX_TOPPINGS} 個`}
              >
                {Array.from({ length: MAX_TOPPINGS }, (_, i) => {
                  const id = eating ? undefined : sushi.toppings[i];
                  return id ? (
                    <TapButton
                      key={i}
                      className={styles.slot}
                      aria-label={`拿掉${toppingById(id).label}`}
                      data-hint={hint?.kind === "remove" && hint.slot === i ? "true" : undefined}
                      disabled={disabled}
                      onTap={() => actions.remove(i)}
                    >
                      <ToppingArt id={id} />
                      {teaching && hint?.kind === "remove" && hint.slot === i ? <Finger /> : null}
                    </TapButton>
                  ) : (
                    <span key={i} className={styles.slotEmpty} aria-hidden />
                  );
                })}
              </div>
            </>
          )}
        </div>
        {/* 選飯時只做選飯這一步：先收起「給多多吃」 */}
        {choosingBase ? null : (
          <TapButton
            className={styles.serveButton}
            data-hint={serveHint ? "true" : undefined}
            data-muted={order && !matchOrder(sushi, order).ok ? "true" : undefined}
            disabled={disabled || !sushi.base}
            onTap={actions.serve}
          >
            <span className={styles.serveArt} aria-hidden>
              <PlateArt />
            </span>
            給多多吃
            {teaching && serveHint ? <Finger /> : null}
          </TapButton>
        )}
      </section>

      <DinoSushiTray
        tray={round.tray}
        disabled={disabled || !sushi.base || choosingBase}
        hint={hint?.kind === "topping" ? hint.id : null}
        teaching={teaching}
        onAdd={actions.add}
      />
    </div>
  );
}
