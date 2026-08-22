"use client";

import { useState } from "react";
import { isPublishedCharacterLogo } from "@/data/character-logos";
import { characterLogoAssetPath } from "@/lib/character-logo-query";
import styles from "./CharacterLogoMark.module.css";

type CharacterLogoMarkProps = {
  slug: string;
  name: string;
  size: 24 | 32;
  /** overlay：疊在既有縮圖角上；inline：文件流，載入前不佔位 */
  variant?: "inline" | "overlay";
};

export default function CharacterLogoMark(props: CharacterLogoMarkProps) {
  return <LogoMarkInner key={props.slug} {...props} />;
}

function LogoMarkInner({
  slug,
  name,
  size,
  variant = "inline",
}: CharacterLogoMarkProps) {
  const [status, setStatus] = useState<"pending" | "ready" | "missing">(
    "pending",
  );
  if (!isPublishedCharacterLogo(slug)) return null;
  if (status === "missing") return null;

  return (
    // 缺檔時 next/image 會讓建置／執行期失敗；小標用 img + onError 直接卸下。
    // eslint-disable-next-line @next/next/no-img-element -- 缺件不進 next/image
    <img
      src={characterLogoAssetPath(slug, 32)}
      alt=""
      width={size}
      height={size}
      decoding="async"
      title={name}
      data-character={slug}
      className={`${styles.mark} ${variant === "overlay" ? styles.overlay : ""} ${status === "ready" ? styles.ready : ""}`}
      style={{ ["--logo-size" as string]: `${size}px` }}
      onLoad={() => setStatus("ready")}
      onError={() => setStatus("missing")}
    />
  );
}

type StripCharacter = {
  id: string;
  name: string;
};

type CharacterLogoStripProps = {
  characters: readonly StripCharacter[];
  size: 24 | 32;
};

/**
 * 故事列表 24px 出場列。缺檔時不佔 StoryCard flex gap：
 * 先在 display:none 容器預載，至少一張成功才插入可見列。
 */
export function CharacterLogoStrip({
  characters,
  size,
}: CharacterLogoStripProps) {
  const publishedCharacters = characters.filter((character) =>
    isPublishedCharacterLogo(character.id),
  );
  const [readyIds, setReadyIds] = useState<ReadonlySet<string>>(() => new Set());
  if (publishedCharacters.length === 0) return null;

  const ready = publishedCharacters.filter((character) =>
    readyIds.has(character.id),
  );

  function markReady(id: string) {
    setReadyIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }

  return (
    <>
      <span className={styles.preload} aria-hidden>
        {publishedCharacters.map((character) => (
          // eslint-disable-next-line @next/next/no-img-element -- 預載缺件不進 next/image
          <img
            key={character.id}
            src={characterLogoAssetPath(character.id, 32)}
            alt=""
            onLoad={() => markReady(character.id)}
          />
        ))}
      </span>
      {ready.length > 0 ? (
        <span
          className={styles.strip}
          aria-label={`出場角色：${ready.map((character) => character.name).join("、")}`}
        >
          {ready.map((character) => (
            // eslint-disable-next-line @next/next/no-img-element -- 列表小標不進 next/image
            <img
              key={character.id}
              src={characterLogoAssetPath(character.id, 32)}
              alt=""
              width={size}
              height={size}
              decoding="async"
              className={`${styles.mark} ${styles.ready}`}
              style={{ ["--logo-size" as string]: `${size}px` }}
            />
          ))}
        </span>
      ) : null}
    </>
  );
}
