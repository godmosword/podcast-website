import type { ReactNode } from "react";

type SceneFrameProps = {
  children: ReactNode;
};

/** 1:1 類型 plate 共用畫布。 */
export function SceneFrame({ children }: SceneFrameProps) {
  return (
    <svg viewBox="0 0 96 96" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {children}
    </svg>
  );
}
