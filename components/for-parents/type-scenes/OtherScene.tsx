import { SceneFrame } from "./SceneFrame";

export function OtherScene() {
  return (
    <SceneFrame>
      <circle cx="30" cy="52" r="16" fill="var(--c-sky, #8fcde8)" />
      <circle cx="56" cy="40" r="12" fill="var(--c-pink, #f7a8c4)" />
      <circle cx="72" cy="62" r="14" fill="var(--c-mint, #b7df9b)" />
      <circle cx="78" cy="24" r="7" fill="var(--c-yellow, #ffd866)" />
    </SceneFrame>
  );
}
