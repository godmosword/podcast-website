import { SceneFrame } from "./SceneFrame";

export function IndoorParkScene() {
  return (
    <SceneFrame>
      <path
        d="M18 82 V48 L48 28 L78 48 V82 Z"
        fill="var(--card)"
        stroke="var(--ink)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <rect x="40" y="56" width="16" height="26" rx="3" fill="var(--c-sky, #8fcde8)" />
      <circle cx="28" cy="70" r="8" fill="var(--c-pink, #f7a8c4)" />
      <circle cx="70" cy="68" r="7" fill="var(--c-yellow, #ffd866)" />
      <circle cx="82" cy="74" r="6" fill="var(--c-mint, #b7df9b)" />
    </SceneFrame>
  );
}
