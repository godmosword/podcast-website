"use client";

import { useMemo, useState } from "react";
import { LOGO_FAMILIES, type CharacterLogo } from "@/data/character-logos";
import {
  BLOODLINE_COLLISION_HINT,
  LOGO_AUDIT_VIEWS,
  LOGO_PREVIEW_SIZES,
  familyOnDark,
  logoAuditTiles,
  resolveCollisionSets,
  logosByFamily,
  auditLogoContrast,
  type LogoAuditView,
  type LogoPreviewSize,
} from "@/lib/studio/logo-audit";
import styles from "./LogoAuditBoard.module.css";

export type LogoAuditPreferred = {
  src: string;
  kind: "approved" | "staging";
} | null;

export type LogoAuditStagingFile = {
  src: string;
  file: string;
};

export type LogoAuditSampleRow = {
  slug: string;
  name: string;
  source: "approved" | "staging";
  file: string;
  intended: string;
  sampled: string | null;
  hueDist: number | null;
  silhouette: number | null;
  gate: number | null;
};

type LogoAuditBoardProps = {
  logos: CharacterLogo[];
  preferred?: Record<string, LogoAuditPreferred>;
  staging?: Record<string, LogoAuditStagingFile[]>;
  samples?: LogoAuditSampleRow[];
};

export default function LogoAuditBoard({
  logos,
  preferred = {},
  staging = {},
  samples = [],
}: LogoAuditBoardProps) {
  const [view, setView] = useState<LogoAuditView>("grid");
  const [size, setSize] = useState<LogoPreviewSize>(32);
  const [silhouette, setSilhouette] = useState(false);
  const [missing, setMissing] = useState<ReadonlySet<string>>(() => new Set());

  const displaySize: LogoPreviewSize = view === "collisions" ? 32 : size;
  const collisions = useMemo(() => resolveCollisionSets(logos), [logos]);
  const families = useMemo(() => logosByFamily(logos), [logos]);
  const contrastRows = useMemo(() => auditLogoContrast(logos), [logos]);

  function markMissing(key: string) {
    setMissing((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }

  function tilesFor(logo: CharacterLogo) {
    return logoAuditTiles(
      logo,
      displaySize,
      preferred[logo.slug] ?? null,
      staging[logo.slug] ?? [],
    );
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
              disabled={
                (view === "collisions" && value !== 32) || view === "contrast"
              }
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
          {logos.flatMap((logo) =>
            tilesFor(logo).map((tile) => (
              <li key={tile.key}>
                <LogoAuditTile
                  logo={logo}
                  size={displaySize}
                  src={tile.src}
                  caption={tile.caption}
                  kind={tile.kind}
                  silhouette={silhouette}
                  missing={missing.has(tile.key)}
                  onMissing={() => markMissing(tile.key)}
                />
              </li>
            )),
          )}
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
              {set.id === "speed-bloodline" && (
                <p className={styles.hint}>{BLOODLINE_COLLISION_HINT}</p>
              )}
              <ul
                className={styles.row}
                style={{ ["--tile" as string]: "32px" }}
              >
                {set.logos.map((logo) => {
                  const tile = tilesFor(logo)[0];
                  if (!tile) return null;
                  return (
                    <li key={logo.slug}>
                      <LogoAuditTile
                        logo={logo}
                        size={32}
                        src={tile.src}
                        caption={`${logo.name} · ${logo.feature}`}
                        kind={tile.kind}
                        silhouette={silhouette}
                        missing={missing.has(tile.key)}
                        onMissing={() => markMissing(tile.key)}
                      />
                    </li>
                  );
                })}
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
                {group.logos.flatMap((logo) =>
                  tilesFor(logo).map((tile) => (
                    <li key={tile.key}>
                      <LogoAuditTile
                        logo={logo}
                        size={displaySize}
                        src={tile.src}
                        caption={tile.caption}
                        kind={tile.kind}
                        silhouette={silhouette}
                        missing={missing.has(tile.key)}
                        onMissing={() => markMissing(tile.key)}
                      />
                    </li>
                  )),
                )}
              </ul>
            </section>
          ))}
        </div>
      )}

      {view === "sample" && (
        <div className={styles.sampleWrap}>
          <p className={styles.hint}>
            從產出圖取樣非背景主色，對資料 `ipColorPrimary` 算漂色 hueDist，對家族底算實際
            silhouette。沒有正式檔或 staging 的角色不列。
          </p>
          {samples.length === 0 ? (
            <p className={styles.hint}>目前沒有可取樣的產出圖。</p>
          ) : (
            <table className={styles.sampleTable}>
              <caption className="sr-only">取色比對</caption>
              <thead>
                <tr>
                  <th scope="col">角色</th>
                  <th scope="col">來源</th>
                  <th scope="col">資料主色</th>
                  <th scope="col">取樣主色</th>
                  <th scope="col">hueDist</th>
                  <th scope="col">silhouette</th>
                  <th scope="col">門檻</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((row) => (
                  <tr key={`${row.slug}-${row.file}`}>
                    <th scope="row">{row.name}</th>
                    <td>
                      {row.source === "approved" ? "正式" : "staging"} {row.file}
                    </td>
                    <td>
                      <Swatch hex={row.intended} />
                    </td>
                    <td>
                      {row.sampled ? <Swatch hex={row.sampled} /> : "取樣失敗"}
                    </td>
                    <td>
                      {row.hueDist === null ? "—" : row.hueDist.toFixed(1)}
                    </td>
                    <td>
                      {row.silhouette === null
                        ? "—"
                        : row.silhouette.toFixed(2)}
                    </td>
                    <td>{row.gate === null ? "—" : row.gate.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {view === "contrast" && (
        <div className={styles.sampleWrap}>
          <p className={styles.hint}>
            主色剪影門檻隨色相距離（2.8／3.6／4.5）；次色對背景 ≥ 3:1；臉部對較亮
            IP ≥ 5.0 且餘裕 ≥ 0.2。未達標列紅底。
          </p>
          <table className={styles.sampleTable}>
            <caption className="sr-only">角色 Logo 對比檢查</caption>
            <thead>
              <tr>
                <th scope="col">角色</th>
                <th scope="col">家族</th>
                <th scope="col">主色</th>
                <th scope="col">次色</th>
                <th scope="col">主色剪影</th>
                <th scope="col">次色對比</th>
                <th scope="col">臉部</th>
                <th scope="col">結果</th>
              </tr>
            </thead>
            <tbody>
              {contrastRows.map((row) => (
                <tr
                  key={row.slug}
                  className={row.passes ? undefined : styles.failRow}
                >
                  <th scope="row">{row.name}</th>
                  <td>{row.familyLabel}</td>
                  <td>
                    <Swatch hex={row.primary} />
                  </td>
                  <td>
                    <Swatch hex={row.secondary} />
                  </td>
                  <td>
                    {row.silhouette.toFixed(2)}
                    <span className={styles.gateHint}> / {row.gate.toFixed(1)}</span>
                  </td>
                  <td>{row.secondaryContrast.toFixed(2)}</td>
                  <td>{row.face.toFixed(2)}</td>
                  <td>{row.passes ? "通過" : "未達標"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type LogoAuditTileProps = {
  logo: CharacterLogo;
  size: LogoPreviewSize;
  src: string;
  caption: string;
  kind: "approved" | "staging" | "missing";
  silhouette: boolean;
  missing: boolean;
  onMissing: () => void;
};

function LogoAuditTile({
  logo,
  size,
  src,
  caption,
  kind,
  silhouette,
  missing,
  onMissing,
}: LogoAuditTileProps) {
  const family = LOGO_FAMILIES[logo.family];
  const onDark = familyOnDark(logo.family);
  const pending = logo.status === "pending" || missing || kind === "staging";

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
            {kind === "staging" ? "staging" : "pending"}
          </span>
        )}
      </div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}

function Swatch({ hex }: { hex: string }) {
  return (
    <span className={styles.hexPair}>
      <span
        className={styles.swatch}
        style={{ background: hex }}
        aria-hidden
      />
      {hex}
    </span>
  );
}
