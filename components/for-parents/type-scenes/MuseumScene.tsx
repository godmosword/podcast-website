import { SceneFrame } from "./SceneFrame";

export function MuseumScene() {
  return (
    <SceneFrame>
      <path d="M12 40 L48 16 L84 40" fill="var(--c-lilac, #c5b3e6)" />
      <rect x="16" y="40" width="64" height="6" fill="var(--ink)" opacity="0.35" />
      <rect x="20" y="48" width="10" height="28" rx="2" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.8" />
      <rect x="36" y="48" width="10" height="28" rx="2" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.8" />
      <rect x="52" y="48" width="10" height="28" rx="2" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.8" />
      <rect x="68" y="48" width="10" height="28" rx="2" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.8" />
      <rect x="14" y="78" width="68" height="5" rx="2" fill="var(--ink)" opacity="0.28" />
    </SceneFrame>
  );
}
