import Link from "next/link";
import Doodle from "@/components/decor/Doodle";
import decor from "@/components/decor/decor.module.css";
import styles from "./SiteHeader.module.css";

/** 首頁 Hero 主視覺（車車遊樂園黏土風格場景圖） */
const HERO_IMAGE = "/hero-home.jpg";

/**
 * 首頁次級連結：合作聯繫 / 許願投稿 / 留言給我。
 * 連結待補——把每一筆的 href 換成實際網址即可（mailto:、表單、IG/Threads 等）。
 * 以 https:// 開頭者會自動在新分頁開啟。
 * 低調柔色膠囊（各帶一個粉嫩 accent），不搶首頁主視覺。
 */
const ACTIONS: { label: string; href: string; bg: string }[] = [
  { label: "合作聯繫", href: "#", bg: "var(--c-sky)" },
  { label: "許願投稿", href: "#", bg: "var(--c-yellow)" },
  { label: "留言給我", href: "#", bg: "var(--c-mint)" },
];

type SiteHeaderProps = {
  variant?: "full" | "compact";
};

export default function SiteHeader({ variant = "full" }: SiteHeaderProps) {
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
          🎮 遊樂園
        </Link>
      </p>

      <nav className={styles.actions} aria-label="聯絡與互動">
        {ACTIONS.map((a) => {
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
    </header>
  );
}
