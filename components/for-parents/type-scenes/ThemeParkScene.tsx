import { SceneFrame } from "./SceneFrame";

export function ThemeParkScene() {
  return (
    <SceneFrame>
      <circle cx="48" cy="44" r="22" fill="none" stroke="var(--ink)" strokeWidth="2.4" />
      <circle cx="48" cy="44" r="5" fill="var(--c-yellow, #ffd866)" />
      <g stroke="var(--ink)" strokeWidth="2" strokeLinecap="round">
        <line x1="48" y1="22" x2="48" y2="66" />
        <line x1="26" y1="44" x2="70" y2="44" />
        <line x1="32" y1="28" x2="64" y2="60" />
        <line x1="64" y1="28" x2="32" y2="60" />
      </g>
      <circle cx="48" cy="22" r="4" fill="var(--c-pink, #f7a8c4)" />
      <circle cx="70" cy="44" r="4" fill="var(--c-sky, #8fcde8)" />
      <rect x="28" y="70" width="40" height="14" rx="4" fill="var(--c-yellow, #ffd866)" />
      <path d="M28 70 L48 56 L68 70 Z" fill="var(--c-pink, #f7a8c4)" />
    </SceneFrame>
  );
}
