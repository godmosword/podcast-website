import { SceneFrame } from "./SceneFrame";

export function ZooScene() {
  return (
    <SceneFrame>
      <ellipse cx="28" cy="58" rx="16" ry="14" fill="var(--c-mint, #b7df9b)" />
      <rect x="24" y="66" width="8" height="14" rx="2" fill="var(--ink)" opacity="0.4" />
      <ellipse cx="62" cy="60" rx="22" ry="14" fill="var(--c-yellow, #ffd866)" />
      <circle cx="80" cy="50" r="10" fill="var(--c-yellow, #ffd866)" />
      <circle cx="84" cy="47" r="2.2" fill="var(--ink)" />
      <path
        d="M80 50 Q92 36 90 58"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect x="50" y="70" width="7" height="10" rx="2" fill="var(--ink)" opacity="0.35" />
      <rect x="68" y="70" width="7" height="10" rx="2" fill="var(--ink)" opacity="0.35" />
      <circle cx="22" cy="22" r="8" fill="var(--c-yellow, #ffd866)" />
    </SceneFrame>
  );
}
