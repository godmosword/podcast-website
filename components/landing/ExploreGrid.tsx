import Image from "next/image";
import Link from "next/link";
import {
  EXPLORE_HEADING,
  EXPLORE_MAP_CARD,
  EXPLORE_TILES,
} from "@/data/explore-tiles";
import styles from "./ExploreGrid.module.css";

/**
 * 首頁探索區：地圖大卡 ＋ 磁貼牆。
 *
 * 放在 footer pane 之上、**不新增 scroll-snap 段**——第五段會同時打破
 * `SegmentNav`／`DuduCompanion`／`LandingBedtimeLayer` 三份以四段為唯一來源的映射。
 *
 * 磁貼一律 `<Link>`（非 `div` + onClick），標籤為可見 HTML 文字（爬蟲與螢幕閱讀器都讀得到）。
 * 圖徽 emoji 為裝飾，`aria-hidden`；可及名稱由文字標籤承擔。
 */
export default function ExploreGrid() {
  const childTiles = EXPLORE_TILES.filter((t) => t.audience === "child");
  const parentTiles = EXPLORE_TILES.filter((t) => t.audience === "parent");

  return (
    <section className={styles.root} aria-labelledby="explore-heading">
      <h2 id="explore-heading" className={styles.heading}>
        {EXPLORE_HEADING}
      </h2>

      <div className={styles.layout}>
        <Link href={EXPLORE_MAP_CARD.href} className={styles.mapCard}>
          <span className={styles.mapArt}>
            <Image
              src={EXPLORE_MAP_CARD.image}
              alt=""
              width={EXPLORE_MAP_CARD.imageWidth}
              height={EXPLORE_MAP_CARD.imageHeight}
              sizes="280px"
              loading="lazy"
              className={styles.mapImage}
            />
          </span>
          <span className={styles.mapLabel}>{EXPLORE_MAP_CARD.label}</span>
        </Link>

        <div className={styles.tiles}>
          {/* 兒童入口在前、視覺權重較大；家長入口在後、較小（不用等權網格） */}
          {/* `list-style: none` 在 Safari/VoiceOver 會移除清單語意，故顯式補 role="list"。
              兩組在畫面上靠位置與尺寸區分，AT 需要可及名稱才對等。 */}
          <ul
            className={styles.tileRow}
            data-audience="child"
            role="list"
            aria-label="小朋友的入口"
          >
            {childTiles.map((tile) => (
              <li key={tile.id}>
                <Link href={tile.href} className={styles.tile}>
                  <span className={styles.tileEmoji} aria-hidden>
                    {tile.emoji}
                  </span>
                  <span className={styles.tileLabel}>{tile.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <ul
            className={styles.tileRow}
            data-audience="parent"
            role="list"
            aria-label="給家長"
          >
            {parentTiles.map((tile) => (
              <li key={tile.id}>
                <Link href={tile.href} className={styles.tile}>
                  <span className={styles.tileEmoji} aria-hidden>
                    {tile.emoji}
                  </span>
                  <span className={styles.tileLabel}>{tile.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
