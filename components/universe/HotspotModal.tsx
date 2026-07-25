"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Hotspot, Zone } from "@/data/universe";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import IconButton from "@/components/ui/IconButton";
import HotspotDetail from "./HotspotDetail";
import styles from "./HotspotModal.module.css";

type HotspotModalProps = {
  zone: Zone;
  hotspot: Hotspot;
  /** modal：攔截路由用 back；page：全頁用 push 回島 */
  mode?: "modal" | "page";
};

/**
 * 熱點詳情 chrome：focus trap + Esc／關閉回島；
 * 開啟時聚焦標題，關閉時 useFocusTrap 還原先前焦點（熱點 pin）。
 */
export default function HotspotModal({
  zone,
  hotspot,
  mode = "modal",
}: HotspotModalProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const close = useCallback(() => {
    if (mode === "modal") {
      router.back();
      return;
    }
    router.push(`/adventures/${zone.id}`);
  }, [mode, router, zone.id]);

  useFocusTrap(true, panelRef, { initialFocus: "container" });

  useEffect(() => {
    const title = document.getElementById(titleId);
    title?.focus();
  }, [titleId, hotspot.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className={styles.overlay} role="presentation" onClick={close}>
      <p className="sr-only" aria-live="polite">
        已打開{hotspot.name}
      </p>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton
          type="button"
          className={styles.close}
          variant="soft"
          icon="close"
          iconSize={20}
          onClick={close}
          aria-label="關閉探索點"
        />
        <HotspotDetail zone={zone} hotspot={hotspot} titleId={titleId} />
        <button
          type="button"
          className={styles.backBtn}
          onClick={close}
          aria-label={`回到${zone.name}`}
        >
          回到{zone.name}
        </button>
      </div>
    </div>
  );
}
