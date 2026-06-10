import Link from "next/link";
import Doodle from "@/components/decor/Doodle";
import PlaygroundHubBadge from "@/components/games/PlaygroundHubBadge";
import decor from "@/components/decor/decor.module.css";
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
          alt="車車遊樂園：卡通車車在遊樂園裡開心玩耍的黏土風格插畫"
          className={styles.heroImage}
          width={1024}
          height={1024}
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className={styles.titleWrap}>
        <span className={styles.sun} aria-hidden />
        <Doodle
          kind="squiggle"
          size={44}
          color="var(--c-pink)"
          className={`${decor.doodle} ${decor.doodleTL} ${decor.tiltA}`}
          style={{ left: "-42px", top: "2px" }}
        />
        <Doodle
          kind="burst"
          size={32}
          color="var(--c-sky)"
          className={`${decor.doodle} ${decor.doodleTR} ${decor.tiltB}`}
          style={{ right: "-40px", top: "-6px" }}
        />
        <h1 className={styles.title}>車車遊樂園</h1>
        <Doodle
          kind="dots"
          size={30}
          color="var(--c-mint)"
          className={`${decor.doodle} ${decor.doodleBR}`}
          style={{ right: "-34px", bottom: "-6px" }}
        />
        <Doodle
          kind="loop"
          size={30}
          color="var(--c-yellow)"
          className={`${decor.doodle} ${decor.doodleBL} ${decor.tiltC}`}
          style={{ left: "-38px", bottom: "-8px" }}
        />
        <Doodle
          kind="zigzag"
          size={34}
          color="var(--c-lilac)"
          className={`${decor.doodle} ${decor.tiltB}`}
          style={{ left: "50%", top: "-22px", transform: "translateX(-50%)" }}
        />
      </div>
      <div className={styles.lede}>
        <p className={styles.tagline}>
          <span className="marker marker-mint">用車車故事陪伴孩子成長</span>
        </p>
        <p className={styles.taglineSub}>融合生活中事件及發揮想像出發</p>
        <p className={styles.taglineSub}>一起探險、學習、勇敢闖關！</p>
      </div>

      <p className={styles.hubNav}>
        <Link href="/games" className={styles.hubLink}>
          <span className={styles.hubIconWrap} aria-hidden>
            <PlaygroundHubBadge size={36} className={styles.hubBadge} />
          </span>
          <span className={styles.hubCopy}>
            <span className={styles.hubTitle}>去遊樂園玩！</span>
            <span className={styles.hubSub}>小遊戲 · 免下載</span>
          </span>
        </Link>
      </p>

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
