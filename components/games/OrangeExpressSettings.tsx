"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_ORANGE_EXPRESS_DISPLAY,
  ORANGE_EXPRESS_DISPLAY_EVENT,
  loadOrangeExpressDisplay,
  resolveOrangeExpressDriver,
  saveOrangeExpressDisplay,
  type OrangeExpressDisplay,
} from "@/lib/gamekit/progress/orange-express-prefs";
import { DRIVER_HINT, DRIVER_NAME } from "@/lib/games/orange-express/copy";
import type { DriverId } from "@/lib/games/orange-express/types";

export function useOrangeExpressDisplay(): [
  OrangeExpressDisplay,
  (patch: Partial<OrangeExpressDisplay>) => void,
] {
  const [display, setDisplay] = useState<OrangeExpressDisplay>(DEFAULT_ORANGE_EXPRESS_DISPLAY);

  useEffect(() => {
    const refresh = () => setDisplay(loadOrangeExpressDisplay());
    refresh();
    window.addEventListener(ORANGE_EXPRESS_DISPLAY_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ORANGE_EXPRESS_DISPLAY_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const update = useCallback((patch: Partial<OrangeExpressDisplay>) => {
    setDisplay(saveOrangeExpressDisplay(patch));
  }, []);

  return [display, update];
}

const DRIVERS: readonly DriverId[] = ["little", "big"];

export type OrangeExpressSettingsClasses = {
  row: string;
  checkbox: string;
  block: string;
  heading: string;
  segmented: string;
  segment: string;
};

/** 遊戲設定對話框裡的大人開關：司機、速度表數字、畫面晃動。樣式沿用對話框傳進來的 class。 */
export function OrangeExpressSettings({
  kidsMode,
  classes,
}: {
  kidsMode: boolean;
  classes: OrangeExpressSettingsClasses;
}) {
  const [display, update] = useOrangeExpressDisplay();
  const driver = resolveOrangeExpressDriver(display.driver, kidsMode);
  return (
    <>
      <div className={classes.block}>
        <div className={classes.heading}>
          <strong>「自己開」的司機</strong>
          <small>{DRIVER_HINT[driver]}</small>
        </div>
        <div className={classes.segmented} role="radiogroup" aria-label="自己開的司機">
          {DRIVERS.map((id) => (
            <button
              key={id}
              type="button"
              className={classes.segment}
              role="radio"
              aria-checked={driver === id}
              data-active={driver === id}
              onClick={() => update({ driver: id })}
            >
              {DRIVER_NAME[id]}
            </button>
          ))}
        </div>
      </div>
      <label className={classes.row}>
        <span>
          <strong>速度表數字</strong>
          <small>給大一點的孩子：速度表畫出時速刻度，停車條顯示剩下幾公尺。</small>
        </span>
        <input
          type="checkbox"
          checked={display.gaugeNumbers}
          onChange={(event) => update({ gaugeNumbers: event.target.checked })}
          className={classes.checkbox}
        />
      </label>
      <label className={classes.row}>
        <span>
          <strong>畫面晃動</strong>
          <small>開得越快，前窗輕輕晃得越明顯。減少動態時一律不晃。</small>
        </span>
        <input
          type="checkbox"
          checked={display.sway}
          onChange={(event) => update({ sway: event.target.checked })}
          className={classes.checkbox}
        />
      </label>
    </>
  );
}
