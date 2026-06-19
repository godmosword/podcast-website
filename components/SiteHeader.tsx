import Link from "next/link";
import styles from "./SiteHeader.module.css";

/** 首頁 Hero 主視覺（車車遊樂園黏土風格場景圖） */
const HERO_IMAGE = "/hero-home.jpg";

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

type SiteHeaderProps = {
  variant?: "full" | "compact";
};

export default function SiteHeader({ variant = "full" }: SiteHeaderProps) {
  const actions = visibleActions();

  if (variant === "compact") {
    return (
      <header className={`${styles.header} ${styles.compact}`}>
        <Link href="/" className={`${styles.compactRow} ${styles.link}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascot.png"
            alt=""
            className={`${styles.mascot} ${styles.mascotCompact}`}
            width={48}
            height={36}
            aria-hidden
          />
          <span className={`${styles.title} ${styles.titleCompact}`}>
            車車遊樂園
          </span>
        </Link>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.scene}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt="陪孩子，成長的路上：卡通車車在遊樂園裡開心玩耍的黏土風格插畫"
          className={styles.heroImage}
          width={1135}
          height={1386}
          fetchPriority="high"
          decoding="async"
        />
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
