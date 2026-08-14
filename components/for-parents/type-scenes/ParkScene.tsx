import { SceneFrame } from "./SceneFrame";

export function ParkScene() {
  return (
    <SceneFrame>
      <ellipse cx="28" cy="58" rx="18" ry="16" fill="var(--c-mint, #b7df9b)" />
      <rect x="24" y="68" width="8" height="16" rx="2" fill="var(--ink)" opacity="0.45" />
      <ellipse cx="52" cy="62" rx="14" ry="12" fill="var(--c-teal, #79c8c1)" />
      <rect x="49" y="70" width="6" height="14" rx="2" fill="var(--ink)" opacity="0.4" />
      <path
        d="M68 82 V52 L90 82 Z"
        fill="var(--c-sky, #8fcde8)"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="78" cy="22" r="8" fill="var(--c-yellow, #ffd866)" />
    </SceneFrame>
  );
}
