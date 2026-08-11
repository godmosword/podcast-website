import { modernRasterPaths } from "@/lib/modern-image-src";
import styles from "./SiteHeader.module.css";

/** 內頁 header LCP（非首頁 segment-stories*） */
const HERO_PATHS = modernRasterPaths("/hero-home.jpg");

/** 首頁次級連結：以環境變數設定，未設定則不渲染。 */
const ACTION_DEFS = [
  {
    label: "合作聯繫",
    envKey: "NEXT_PUBLIC_CONTACT_FORM_URL",
    bg: "var(--c-sky)",
  },
  {
    label: "許願投稿",
    envKey: "NEXT_PUBLIC_WISH_FORM_URL",
    bg: "var(--c-yellow)",
  },
  {
    label: "留言給我",
    envKey: "NEXT_PUBLIC_FEEDBACK_FORM_URL",
    bg: "var(--c-mint)",
  },
] as const;

function visibleActions() {
  return ACTION_DEFS.flatMap((def) => {
    const href = process.env[def.envKey]?.trim();
    if (!href) return [];
    return [{ label: def.label, href, bg: def.bg }];
  });
}

export default function SiteHeader() {
  const actions = visibleActions();

  return (
    <header className={styles.header}>
      <div className={styles.scene}>
        <picture>
          <source type="image/avif" srcSet={HERO_PATHS.avif} />
          <source type="image/webp" srcSet={HERO_PATHS.webp} />
          <img
            src={HERO_PATHS.jpg}
            alt="陪孩子，成長的路上：卡通車車在遊樂園裡開心玩耍的黏土風格插畫"
            className={styles.heroImage}
            width={1135}
            height={1386}
            fetchPriority="high"
            decoding="async"
            sizes="(max-width: 640px) 100vw, 640px"
          />
        </picture>
      </div>

      <h1 className="sr-only">車車遊樂園</h1>

      {actions.length > 0 && (
        <nav className={styles.actions} aria-label="聯絡與互動">
          {actions.map((a) => {
            const external = /^https?:/i.test(a.href);
            return (
              <a
                key={a.label}
                href={a.href}
                className={styles.actionBtn}
                style={{ "--btn": a.bg } as React.CSSProperties}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {a.label}
              </a>
            );
          })}
        </nav>
      )}
    </header>
  );
}
