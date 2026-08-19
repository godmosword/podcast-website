"use client";

import { useMemo, useState } from "react";
import { LOGO_FAMILIES, type CharacterLogo } from "@/data/character-logos";
import {
  LOGO_AUDIT_VIEWS,
  LOGO_PREVIEW_SIZES,
  familyOnDark,
  logoAssetPath,
  logosByFamily,
  resolveCollisionSets,
  type LogoAuditView,
  type LogoPreviewSize,
} from "@/lib/studio/logo-audit";
import styles from "./LogoAuditBoard.module.css";

type LogoAuditBoardProps = {
  logos: CharacterLogo[];
};

export default function LogoAuditBoard({ logos }: LogoAuditBoardProps) {
  const [view, setView] = useState<LogoAuditView>("grid");
  const [size, setSize] = useState<LogoPreviewSize>(32);
  const [silhouette, setSilhouette] = useState(false);
  const [missing, setMissing] = useState<ReadonlySet<string>>(() => new Set());

  const displaySize: LogoPreviewSize = view === "collisions" ? 32 : size;
  const collisions = useMemo(() => resolveCollisionSets(logos), [logos]);
  const families = useMemo(() => logosByFamily(logos), [logos]);

  function markMissing(slug: string, preview: LogoPreviewSize) {
    const key = `${slug}:${preview}`;
    setMissing((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }

  return (
    <div className={styles.board}>
      <div className={styles.toolbar} role="toolbar" aria-label="驗收檢視">
        <div className={styles.group} role="group" aria-label="檢視模式">
          {LOGO_AUDIT_VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.toggle}
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.group} role="group" aria-label="縮圖尺寸">
          {LOGO_PREVIEW_SIZES.map((value) => (
            <button
              key={value}
              type="button"
              className={styles.toggle}
              aria-pressed={displaySize === value}
              disabled={view === "collisions" && value !== 32}
              onClick={() => setSize(value)}
            >
              {value}px
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.toggle}
          aria-pressed={silhouette}
          aria-label="黑白剪影模式"
          onClick={() => setSilhouette((value) => !value)}
        >
          剪影
        </button>
      </div>

      {view === "collisions" && (
        <p className={styles.hint}>撞型面板固定 32px，驗證五組能否靠形分開。</p>
      )}
      {silhouette && (
        <p className={styles.hint}>
          剪影是去色加高對比，只留明度形。家族底烘在圖裡，無法變成透明黑剪影。
        </p>
      )}

      {view === "grid" && (
        <ul
          className={styles.grid}
          style={{ ["--tile" as string]: `${displaySize}px` }}
        >
          {logos.map((logo) => (
            <li key={logo.slug}>
              <LogoAuditTile
                logo={logo}
                size={displaySize}
                silhouette={silhouette}
                missing={missing.has(`${logo.slug}:${displaySize}`)}
                onMissing={() => markMissing(logo.slug, displaySize)}
              />
            </li>
          ))}
        </ul>
      )}

      {view === "collisions" && (
        <div className={styles.collisionList}>
          {collisions.map((set) => (
            <section
              key={set.id}
              className={styles.collisionCard}
              aria-labelledby={`collision-${set.id}`}
            >
              <h3 id={`collision-${set.id}`} className={styles.groupTitle}>
                {set.label}
                <span className={styles.groupMeta}>32px</span>
              </h3>
              <ul
                className={styles.row}
                style={{ ["--tile" as string]: "32px" }}
              >
                {set.logos.map((logo) => (
                  <li key={logo.slug}>
                    <LogoAuditTile
                      logo={logo}
                      size={32}
                      silhouette={silhouette}
                      missing={missing.has(`${logo.slug}:32`)}
                      onMissing={() => markMissing(logo.slug, 32)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {view === "families" && (
        <div className={styles.familyList}>
          {families.map((group) => (
            <section
              key={group.family}
              className={styles.familyCard}
              aria-labelledby={`family-${group.family}`}
              style={{
                ["--family-bg" as string]: LOGO_FAMILIES[group.family].hex,
              }}
            >
              <h3 id={`family-${group.family}`} className={styles.groupTitle}>
                <span
                  className={styles.swatch}
                  style={{ background: LOGO_FAMILIES[group.family].hex }}
                  aria-hidden
                />
                {group.label}
                <span className={styles.groupMeta}>
                  {group.family} · {group.logos.length}
                </span>
              </h3>
              <ul
                className={styles.grid}
                style={{ ["--tile" as string]: `${displaySize}px` }}
              >
                {group.logos.map((logo) => (
                  <li key={logo.slug}>
                    <LogoAuditTile
                      logo={logo}
                      size={displaySize}
                      silhouette={silhouette}
                      missing={missing.has(`${logo.slug}:${displaySize}`)}
                      onMissing={() => markMissing(logo.slug, displaySize)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

type LogoAuditTileProps = {
  logo: CharacterLogo;
  size: LogoPreviewSize;
  silhouette: boolean;
  missing: boolean;
  onMissing: () => void;
};

function LogoAuditTile({
  logo,
  size,
  silhouette,
  missing,
  onMissing,
}: LogoAuditTileProps) {
  const family = LOGO_FAMILIES[logo.family];
  const src = logoAssetPath(logo.slug, size);
  const onDark = familyOnDark(logo.family);
  const pending = logo.status === "pending" || missing;
  const caption = `${logo.name} · ${logo.feature}`;

  return (
    <figure
      className={`${styles.tile} ${onDark ? styles.tileOnDark : styles.tileOnLight}`}
      style={{
        ["--family-bg" as string]: family.hex,
        width: size,
      }}
    >
      <div
        className={`${styles.frame} ${silhouette ? styles.silhouette : ""}`}
        style={{ width: size, height: size }}
      >
        {missing ? (
          <div
            className={styles.placeholder}
            role="img"
            aria-label={`${logo.name} 缺件`}
          >
            <span className={styles.placeholderMark}>缺</span>
          </div>
        ) : (
          // 缺檔時 next/image 會在建置失敗；驗收頁用 img + onError 顯示佔位。
          <img
            src={src}
            alt={`${logo.name} logo ${size}px`}
            width={size}
            height={size}
            className={styles.image}
            onError={onMissing}
          />
        )}
        {pending && (
          <span className={styles.badge} aria-hidden>
            pending
          </span>
        )}
      </div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}
