/**
 * 地圖針中心的類型剪影（inline SVG 字串，供 Leaflet divIcon 的 innerHTML 使用）。
 *
 * 母題與卡片的 `components/for-parents/type-scenes/` 七個 scene 對應，
 * 讓同一個地點在卡片與地圖上共用同一組視覺語言。
 *
 * 為什麼要有剪影：地圖針原本只用色相區分七種類型，但實際資料分佈極不均勻
 * （公園 38 筆、博物館 16 筆，兩者合計逾七成），且 `--c-mint`（公園）與
 * `--c-teal`（動物園）色相相鄰，在 30px 的針上分不出來。加上形狀後成為
 * 雙重編碼，色盲與戶外強光下仍可辨識。色相一律保留，不做收斂。
 *
 * 這些字串為靜態常數、不含任何外部輸入，可安全放進 innerHTML。
 */
import {
  PLAYGROUND_TYPE_VISUAL_KEYS,
  type PlaygroundTypeVisualKey,
} from "./playground-type-visual";

/**
 * 24×24 檢視框；填色與描邊一律 `currentColor`，由 CSS 的
 * `.playMapPinGlyph { color }` 決定，不在此寫死顏色。
 */
const GLYPH_BODY: Record<PlaygroundTypeVisualKey, string> = {
  /*
   * 叢生圓樹＋樹幹（ParkScene 的圓樹叢）。
   * 不用「單圓＋幹」：15px 下圓底與幹頂會融成一塊，讀起來像鑰匙孔而非樹。
   * 三圓錯位的樹冠有輪廓起伏，才會被讀成枝葉。公園佔全站 52%，
   * 這個剪影是七個裡最需要一眼可辨的。
   */
  park: '<circle cx="8.4" cy="9.6" r="4.1"/><circle cx="15.6" cy="9.6" r="4.1"/><circle cx="12" cy="6.6" r="4.6"/><rect x="10.4" y="12.4" width="3.2" height="8.2" rx="1.4"/>',
  /*
   * 有門的建築（IndoorParkScene 的白屋頂建築）。
   * 門用 evenodd 挖成負空間，不用實心矩形疊在三角屋頂下——後者在 15px 下
   * 會與屋頂融成一塊，讀起來像向上箭頭。挖空後才有「牆」的輪廓，
   * 也才跟農場那顆實心穀倉五角形區分得開。
   */
  "indoor-park":
    '<path fill-rule="evenodd" d="M12 4.6 L21 12.4 H18.4 V20.4 H5.6 V12.4 H3 Z M10.5 14.4 H13.5 V20.4 H10.5 Z"/>',
  /*
   * 摩天輪＋底座（ThemeParkScene）。
   * 輻條不可省：只留圓環＋軸心會讀成放大鏡或字母 Q。十字輻條是「輪」的
   * 最小充分特徵，配上底座三角才成立為摩天輪。
   */
  "theme-park":
    '<circle cx="12" cy="9.6" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 3.6 V15.6 M6 9.6 H18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M7.6 21 L12 16.4 L16.4 21 Z"/>',
  // 山形屋頂＋列柱（MuseumScene）
  museum:
    '<path d="M3 10 L12 4 L21 10 Z"/><rect x="5" y="12" width="2.6" height="7"/><rect x="10.7" y="12" width="2.6" height="7"/><rect x="16.4" y="12" width="2.6" height="7"/><rect x="4" y="19" width="16" height="1.6" rx="0.3"/>',
  /*
   * 長頸鹿的頸、頭、吻部與兩根角（ZooScene 最具識別度的母題）。
   *
   * 角必須用 stroke 且 ≥2 單位。先前版本用 1.5 單位的實心三角形，換算後只有
   * 0.94px——次像素會被抗鋸齒吃掉，整顆退回「一根曲線＋一顆球」，讀成手杖
   * 或問號（與摩天輪輻條同一個失效模式）。吻部是把「頭」和「球」分開的關鍵。
   * 整組平移後 bbox 中心回到 (12, 12)，與其他六個剪影的視覺重心一致。
   */
  zoo: '<g transform="translate(-1 -0.5)"><path d="M9.5 20 Q9 12 13.5 9.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="15.5" cy="8" r="3.2"/><path d="M18.4 7.4 h2.6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M14 5.2 L12.9 2.4 M17.2 5 L18.6 2.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></g>',
  // 穀倉五角形（FarmScene）
  farm: '<path d="M5 20 V11 L12 5 L19 11 V20 Z"/>',
  /*
   * 水平三點（省略號語意＝「其他」）。
   * 不用 OtherScene 的散置圓簇：那個排列與 park 的叢生樹冠在 15px 下會撞
   * （兩者合計 43 筆、近六成），且散置彩球在卡片語言裡其實是 IndoorParkScene
   * 的球池母題，借來當「其他」有語彙衝突。水平排列不與任何類型相似。
   */
  other:
    '<circle cx="5.6" cy="12" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="18.4" cy="12" r="2.5"/>',
};

/**
 * 取得類型剪影的完整 `<svg>` 字串。
 * `aria-hidden`：語意由外層 button 的 `aria-label` 承擔，剪影純裝飾。
 */
export function playgroundTypeGlyphSvg(key: PlaygroundTypeVisualKey): string {
  return `<svg class="playMapPinGlyphArt" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${GLYPH_BODY[key]}</svg>`;
}

/** 契約測試用：確保七個 key 都有對應母題，不會有類型悄悄少一個。 */
export function listGlyphKeys(): readonly PlaygroundTypeVisualKey[] {
  return PLAYGROUND_TYPE_VISUAL_KEYS;
}
