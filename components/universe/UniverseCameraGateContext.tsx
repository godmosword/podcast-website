"use client";

import { createContext, useContext, type ReactNode } from "react";

export type UniverseCameraGateValue = {
  /** 鏡頭飛抵後才揭示 sheet（動畫／焦點／互動）。Provider 外預設 true 以免非地圖頁誤藏。 */
  sheetReady: boolean;
};

const DEFAULT_VALUE: UniverseCameraGateValue = {
  sheetReady: true,
};

const UniverseCameraGateContext =
  createContext<UniverseCameraGateValue>(DEFAULT_VALUE);

export function UniverseCameraGateProvider({
  value,
  children,
}: {
  value: UniverseCameraGateValue;
  children: ReactNode;
}) {
  return (
    <UniverseCameraGateContext.Provider value={value}>
      {children}
    </UniverseCameraGateContext.Provider>
  );
}

export function useUniverseCameraGate(): UniverseCameraGateValue {
  return useContext(UniverseCameraGateContext);
}
