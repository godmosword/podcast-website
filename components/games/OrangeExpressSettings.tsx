"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_ORANGE_EXPRESS_DISPLAY,
  ORANGE_EXPRESS_DISPLAY_EVENT,
  loadOrangeExpressDisplay,
  saveOrangeExpressDisplay,
  type OrangeExpressDisplay,
} from "@/lib/gamekit/progress/orange-express-prefs";

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

/** 遊戲設定對話框裡的兩個大人開關。樣式沿用對話框傳進來的 class。 */
export function OrangeExpressSettings({
  rowClassName,
  checkboxClassName,
}: {
  rowClassName: string;
  checkboxClassName: string;
}) {
  const [display, update] = useOrangeExpressDisplay();
  return (
    <>
      <label className={rowClassName}>
        <span>
          <strong>速度表數字</strong>
          <small>給大一點的孩子：速度表畫出時速刻度，停車條顯示剩下幾公尺。</small>
        </span>
        <input
          type="checkbox"
          checked={display.gaugeNumbers}
          onChange={(event) => update({ gaugeNumbers: event.target.checked })}
          className={checkboxClassName}
        />
      </label>
      <label className={rowClassName}>
        <span>
          <strong>畫面晃動</strong>
          <small>開得越快，前窗輕輕晃得越明顯。減少動態時一律不晃。</small>
        </span>
        <input
          type="checkbox"
          checked={display.sway}
          onChange={(event) => update({ sway: event.target.checked })}
          className={checkboxClassName}
        />
      </label>
    </>
  );
}
