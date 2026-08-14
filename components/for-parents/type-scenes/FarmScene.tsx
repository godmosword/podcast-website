import { SceneFrame } from "./SceneFrame";

export function FarmScene() {
  return (
    <SceneFrame>
      <circle cx="22" cy="22" r="10" fill="var(--c-yellow, #ffd866)" />
      <path
        d="M28 82 V50 L48 28 L68 50 V82 Z"
        fill="var(--c-pink, #f7a8c4)"
        stroke="var(--ink)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <rect x="42" y="58" width="12" height="16" rx="2" fill="var(--card)" />
      <ellipse cx="78" cy="74" rx="14" ry="8" fill="var(--c-mint, #b7df9b)" />
    </SceneFrame>
  );
}
