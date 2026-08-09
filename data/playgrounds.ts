/**
 * 真實世界親子遊樂地點（sidecar）。
 * 供 /for-parents/play-map 地圖篩選與標記使用；與虛構宇宙地圖無關。
 * Google Maps 導航／定位連結由 buildGoogleMaps* helper 動態產生，不存於資料列。
 */

export type PlaygroundType =
  | "公園"
  | "室內樂園"
  | "博物館"
  | "農場"
  | "室內放電"
  | "其他";

export type PlaygroundSourceKind = "official" | "gov" | "editorial";

export type PlaygroundSource = {
  kind: PlaygroundSourceKind;
  name: string;
  url: string;
};

export type Playground = {
  id: string;
  name: string;
  city: string;
  district?: string;
  /** 次級行政區或園區分區（選填，供未來跨區覆蓋說明）。 */
  region?: string;
  lat: number;
  lng: number;
  address: string;
  type: PlaygroundType;
  ageRange: [number, number];
  free: boolean;
  indoor: boolean;
  facilities: string[];
  tags: string[];
  tips?: string;
  officialUrl?: string;
  relatedEpisodes?: string[];
  /** 資料來源（至少一筆；商業場館須含 official 或 officialUrl）。 */
  sources: PlaygroundSource[];
  /** 欄位最後人工核對日（ISO YYYY-MM-DD）。 */
  lastVerified: string;
  /** 覆蓋範圍或資料缺口說明（選填）。 */
  coverageNote?: string;
};

/** Google Maps 即時導航（不傳 origin，由 Maps 使用目前位置）。免 API Key。 */
export function buildGoogleMapsNavUrl(lat: number, lng: number): string {
  const destination = `${lat},${lng}`;
  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving",
    dir_action: "navigate",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Google Maps 只顯示位置（search 備案）。免 API Key。 */
export function buildGoogleMapsPlaceUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    api: "1",
    query: `${lat},${lng}`,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

const PLAYGROUNDS: readonly Playground[] = [
  {
    id: "ty-fenghe",
    name: "風禾公園",
    city: "桃園市",
    district: "桃園區",
    lat: 25.0018,
    lng: 121.3056,
    address: "桃園市桃園區正光路與大有路口附近",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["溜滑梯", "鞦韆", "遮蔭區", "洗手間"],
    tags: ["免費", "大型溜滑梯", "野餐友善"],
    tips: "假日人潮多，建議傍晚去；太陽大時優先找遮蔭遊具區。",
    sources: [
      {
        kind: "gov",
        name: "桃園市政府",
        url: "https://www.tycg.gov.tw/News_Content.aspx?n=10&s=639822",
      },
      {
        kind: "gov",
        name: "桃園市政府工務局",
        url: "https://pwb.tycg.gov.tw/News_Content.aspx?n=5035&s=799799",
      },
      {
        kind: "editorial",
        name: "桃園市政府新聞稿",
        url: "https://www.tycg.gov.tw/News_Content.aspx?n=10&s=639822",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "ty-chingtang",
    name: "青塘園",
    city: "桃園市",
    district: "中壢區",
    lat: 25.0054,
    lng: 121.2021,
    address: "桃園市中壢區文德路／高鐵南路二段附近",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["環湖步道", "草地", "兒童遊戲場", "洗手間"],
    tags: ["免費", "散步", "餵鴨注意"],
    tips: "適合慢慢散步放電；餵食水鳥請遵守園區規定，也記得帶防蚊液。",
    sources: [
      {
        kind: "gov",
        name: "桃園市政府",
        url: "https://www.tycg.gov.tw/",
      },
      {
        kind: "editorial",
        name: "桃園市政府觀光導覽",
        url: "https://travel.tycg.gov.tw/zh-tw/event/detail/1015",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "ty-yangming",
    name: "陽明運動公園",
    city: "桃園市",
    district: "桃園區",
    lat: 25.0206,
    lng: 121.3001,
    address: "桃園市桃園區三民路一段",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["兒童遊戲場", "跑道", "籃球場", "停車場"],
    tags: ["免費", "運動", "停車方便"],
    tips: "遊戲場與跑道分開，適合先跑一圈再玩遊具；夏天記得多補水。",
    sources: [
      {
        kind: "gov",
        name: "桃園市政府",
        url: "https://www.tycg.gov.tw/",
      },
      {
        kind: "editorial",
        name: "桃園市政府觀光導覽",
        url: "https://travel.tycg.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "ty-kids-museum",
    name: "桃園市立兒童美術館",
    city: "桃園市",
    district: "中壢區",
    lat: 25.0039,
    lng: 121.2132,
    address: "桃園市中壢區高鐵南路二段90號",
    type: "博物館",
    ageRange: [3, 8],
    free: true,
    indoor: true,
    facilities: ["展覽", "創作體驗", "洗手間", "親子廁所"],
    tags: ["室內", "免費入場", "雨天備案"],
    tips: "部分體驗活動需現場登記或另收費，出發前可查官網當期活動。",
    officialUrl: "https://tmoca.tycg.gov.tw/",
    sources: [
      {
        kind: "official",
        name: "桃園市立兒童美術館",
        url: "https://tmoca.tycg.gov.tw/",
      },
      {
        kind: "gov",
        name: "桃園市政府文化局",
        url: "https://culture.tycg.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "ty-casti",
    name: "卡司蒂樂園",
    city: "桃園市",
    district: "中壢區",
    lat: 24.9658,
    lng: 121.2212,
    address: "桃園市中壢區中園路二段501號",
    type: "室內樂園",
    ageRange: [3, 8],
    free: false,
    indoor: true,
    facilities: ["球池", "溜滑梯", "角色扮演區", "洗手間"],
    tags: ["室內放電", "雨天備案", "需購票"],
    tips: "假日建議先查票價與營業時間；襪子通常要自備或現場購買。票價與營業時間易變動，出發前請以官網為準。",
    officialUrl: "https://castellaland.com/",
    sources: [
      {
        kind: "official",
        name: "卡司．蒂菈樂園",
        url: "https://castellaland.com/",
      },
      {
        kind: "editorial",
        name: "TravelKing 旅遊王",
        url: "https://www.travelking.com.tw/tourguide/scenery105513.html",
      },
    ],
    lastVerified: "2026-08-09",
  },
  // ── Wave 1：桃園市 +3 ──
  {
    id: "ty-puhsin",
    name: "埔心牧場",
    city: "桃園市",
    district: "楊梅區",
    lat: 24.9215,
    lng: 121.1782,
    address: "桃園市楊梅區高獅路569號",
    type: "農場",
    ageRange: [3, 8],
    free: false,
    indoor: false,
    facilities: ["餵牛體驗", "牧場小徑", "DIY 體驗", "洗手間"],
    tags: ["農場", "餵動物", "親子體驗"],
    tips: "戶外活動多，建議防曬防蚊；餵食請依現場指引。票價與營業時間易變動，出發前請以官網為準。",
    officialUrl: "https://www.puhsin.com.tw/",
    sources: [
      {
        kind: "official",
        name: "埔心牧場",
        url: "https://www.puhsin.com.tw/",
      },
      {
        kind: "gov",
        name: "桃園市政府觀光導覽",
        url: "https://travel.tycg.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "ty-xpark",
    name: "Xpark 水族館",
    city: "桃園市",
    district: "觀音區",
    lat: 25.0669,
    lng: 121.0865,
    address: "桃園市觀音區春好路501號",
    type: "博物館",
    ageRange: [3, 8],
    free: false,
    indoor: true,
    facilities: ["水族展示", "互動體驗", "親子廁所", "餐飲"],
    tags: ["室內", "雨天備案", "需購票"],
    tips: "建議平日或開園初入場，動線較順；推車可借但數量有限。票價與營業時間易變動，出發前請以官網為準。",
    officialUrl: "https://www.xpark.com.tw/",
    sources: [
      {
        kind: "official",
        name: "Xpark",
        url: "https://www.xpark.com.tw/",
      },
      {
        kind: "gov",
        name: "桃園市政府觀光導覽",
        url: "https://travel.tycg.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "ty-longtan-pond",
    name: "龍潭大池",
    city: "桃園市",
    district: "龍潭區",
    lat: 24.8634,
    lng: 121.2158,
    address: "桃園市龍潭區中正路／神龍路附近",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["環湖步道", "涼亭", "兒童遊戲場", "停車場"],
    tags: ["免費", "散步", "野餐友善"],
    tips: "環湖平緩好推車；傍晚風大時記得加件外套。",
    sources: [
      {
        kind: "gov",
        name: "桃園市政府",
        url: "https://www.tycg.gov.tw/",
      },
      {
        kind: "editorial",
        name: "桃園市政府觀光導覽",
        url: "https://travel.tycg.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  // ── Wave 1：台北市 ≥8 ──
  {
    id: "tp-children-park",
    name: "台北市立兒童新樂園",
    city: "台北市",
    district: "士林區",
    lat: 25.0972,
    lng: 121.5156,
    address: "台北市士林區承德路五段55號",
    type: "室內樂園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["遊樂設施", "餐飲", "親子廁所", "置物櫃"],
    tags: ["遊樂設施", "需另購遊樂券", "捷運友善"],
    tips: "園區免費入場，遊樂設施需購券；假日人潮多，可早到排熱門設施。",
    officialUrl: "https://www.tcap.taipei/",
    sources: [
      {
        kind: "official",
        name: "台北市立兒童新樂園",
        url: "https://www.tcap.taipei/",
      },
      {
        kind: "gov",
        name: "臺北市政府",
        url: "https://www.gov.taipei/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "tp-zoo",
    name: "臺北市立動物園",
    city: "台北市",
    district: "文山區",
    lat: 24.9983,
    lng: 121.5806,
    address: "台北市文山區新光路二段30號",
    type: "其他",
    ageRange: [3, 8],
    free: false,
    indoor: false,
    facilities: ["動物展示", "遊園車", "親子廁所", "餐飲"],
    tags: ["動物", "爬山", "需購票"],
    tips: "園區坡道多，推車或穿好走的鞋；貓空纜車可搭配規劃半日遊。票價與營業時間易變動，出發前請以官網為準。",
    officialUrl: "https://www.zoo.gov.taipei/",
    sources: [
      {
        kind: "official",
        name: "臺北市立動物園",
        url: "https://www.zoo.gov.taipei/",
      },
      {
        kind: "gov",
        name: "臺北市政府",
        url: "https://www.gov.taipei/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "tp-ntsec",
    name: "國立臺灣科學教育館",
    city: "台北市",
    district: "士林區",
    lat: 25.0967,
    lng: 121.5164,
    address: "台北市士林區士商路189號",
    type: "博物館",
    ageRange: [3, 8],
    free: false,
    indoor: true,
    facilities: ["互動展", "3D 劇院", "親子廁所", "餐飲"],
    tags: ["室內", "雨天備案", "需購票"],
    tips: "展區分樓層，低齡兒童可先從一樓互動區開始。票價與營業時間易變動，出發前請以官網為準。",
    officialUrl: "https://www.ntsec.gov.tw/",
    sources: [
      {
        kind: "official",
        name: "國立臺灣科學教育館",
        url: "https://www.ntsec.gov.tw/",
      },
      {
        kind: "gov",
        name: "教育部",
        url: "https://www.edu.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "tp-water-museum",
    name: "臺北自來水園區",
    city: "台北市",
    district: "中正區",
    lat: 25.0125,
    lng: 121.5356,
    address: "台北市中正區思源街1號",
    type: "博物館",
    ageRange: [3, 8],
    free: false,
    indoor: true,
    facilities: ["水資源展", "親水設施", "親子廁所", "餐飲"],
    tags: ["室內", "玩水", "需購票"],
    tips: "親水區建議多帶一套衣物；博物館與親水區票券分開販售。票價與營業時間易變動，出發前請以官網為準。",
    officialUrl: "https://museum.taipei.gov.tw/",
    sources: [
      {
        kind: "official",
        name: "臺北自來水園區",
        url: "https://museum.taipei.gov.tw/",
      },
      {
        kind: "gov",
        name: "臺北市政府",
        url: "https://www.gov.taipei/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "tp-da-an-park",
    name: "大安森林公園",
    city: "台北市",
    district: "大安區",
    lat: 25.0297,
    lng: 121.5342,
    address: "台北市大安區新生南路二段1號",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["兒童遊戲場", "生態池", "步道", "洗手間"],
    tags: ["免費", "捷運友善", "野餐友善"],
    tips: "遊戲場在公園北側，假日建議上午較不擁擠；生態池旁防蚊。",
    sources: [
      {
        kind: "gov",
        name: "臺北市政府公園路燈工程管理處",
        url: "https://parks.gov.taipei/",
      },
      {
        kind: "editorial",
        name: "臺北旅遊網",
        url: "https://www.travel.taipei/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "tp-shilin-residence",
    name: "士林官邸公園",
    city: "台北市",
    district: "士林區",
    lat: 25.0933,
    lng: 121.5311,
    address: "台北市士林區福林路60號",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["玫瑰園", "大草坪", "步道", "洗手間"],
    tags: ["免費", "散步", "花季"],
    tips: "正館需另購票，戶外公園區免費；玫瑰季人潮多，推車動線以主路為主。",
    sources: [
      {
        kind: "gov",
        name: "臺北市政府",
        url: "https://www.gov.taipei/",
      },
      {
        kind: "editorial",
        name: "臺北旅遊網",
        url: "https://www.travel.taipei/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "tp-astro",
    name: "臺北市立天文科學教育館",
    city: "台北市",
    district: "士林區",
    lat: 25.0964,
    lng: 121.5189,
    address: "台北市士林區基河路363號",
    type: "博物館",
    ageRange: [3, 8],
    free: false,
    indoor: true,
    facilities: ["天文展", "球幕劇場", "親子廁所", "餐飲"],
    tags: ["室內", "雨天備案", "需購票"],
    tips: "球幕場次固定，建議先查放映表再排時間。票價與營業時間易變動，出發前請以官網為準。",
    officialUrl: "https://www.tam.gov.taipei/",
    sources: [
      {
        kind: "official",
        name: "臺北市立天文科學教育館",
        url: "https://www.tam.gov.taipei/",
      },
      {
        kind: "gov",
        name: "臺北市政府",
        url: "https://www.gov.taipei/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "tp-rongxing",
    name: "榮星花園公園",
    city: "台北市",
    district: "中山區",
    lat: 25.0567,
    lng: 121.5367,
    address: "台北市中山區龍江路322號",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["兒童遊戲場", "大草坪", "步道", "洗手間"],
    tags: ["免費", "社區公園", "野餐友善"],
    tips: "遊戲場設備多元但面積不大，適合學齡前後短時間放電。",
    sources: [
      {
        kind: "gov",
        name: "臺北市政府公園路燈工程管理處",
        url: "https://parks.gov.taipei/",
      },
      {
        kind: "editorial",
        name: "臺北旅遊網",
        url: "https://www.travel.taipei/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  // ── Wave 1：新北市 ≥8 ──
  {
    id: "nt-metro-park",
    name: "新北市大都會公園",
    city: "新北市",
    district: "三重區",
    lat: 25.0667,
    lng: 121.4833,
    address: "新北市三重區重新橋附近（跨三重、新莊、五股）",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["河濱步道", "自行車道", "兒童遊戲場", "停車場"],
    tags: ["免費", "騎車", "野餐友善"],
    tips: "園區幅員大，可先鎖定重新橋或熊猴森遊戲場；假日防曬補水。",
    sources: [
      {
        kind: "gov",
        name: "新北市政府",
        url: "https://www.ntpc.gov.tw/",
      },
      {
        kind: "editorial",
        name: "新北市觀光旅遊網",
        url: "https://newtaipei.travel/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "nt-shihsanhang",
    name: "新北市立十三行博物館",
    city: "新北市",
    district: "八里區",
    lat: 25.1478,
    lng: 121.3944,
    address: "新北市八里區博物館路53號",
    type: "博物館",
    ageRange: [3, 8],
    free: true,
    indoor: true,
    facilities: ["常設展", "考古體驗", "親子廁所", "停車場"],
    tags: ["室內", "免費入場", "雨天備案"],
    tips: "常設展免費，特展可能另收費；戶外瞭望台風大記得加外套。",
    officialUrl: "https://www.sshm.ntpc.gov.tw/",
    sources: [
      {
        kind: "official",
        name: "新北市立十三行博物館",
        url: "https://www.sshm.ntpc.gov.tw/",
      },
      {
        kind: "gov",
        name: "新北市政府",
        url: "https://www.ntpc.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "nt-yingge-ceramic",
    name: "新北市立鶯歌陶瓷博物館",
    city: "新北市",
    district: "鶯歌區",
    lat: 24.9533,
    lng: 121.3533,
    address: "新北市鶯歌區文化路200號",
    type: "博物館",
    ageRange: [3, 8],
    free: false,
    indoor: true,
    facilities: ["常設展", "陶藝體驗", "親子廁所", "停車場"],
    tags: ["室內", "雨天備案", "需購票"],
    tips: "體驗課程常需預約；館內禁止奔跑，低齡兒建議先逛一樓。票價與營業時間易變動，出發前請以官網為準。",
    officialUrl: "https://www.ceramics.ntpc.gov.tw/",
    sources: [
      {
        kind: "official",
        name: "新北市立鶯歌陶瓷博物館",
        url: "https://www.ceramics.ntpc.gov.tw/",
      },
      {
        kind: "gov",
        name: "新北市政府",
        url: "https://www.ntpc.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "nt-juming",
    name: "朱銘美術館",
    city: "新北市",
    district: "金山區",
    lat: 25.2500,
    lng: 121.6083,
    address: "新北市金山區西勢湖2號",
    type: "博物館",
    ageRange: [3, 8],
    free: false,
    indoor: false,
    facilities: ["戶外雕塑", "展覽", "親子廁所", "餐飲"],
    tags: ["藝術", "戶外", "需購票"],
    tips: "戶外步道多，推車可行但部分階梯需抱娃；海邊風大防曬。票價與營業時間易變動，出發前請以官網為準。",
    officialUrl: "https://www.juming.org.tw/",
    sources: [
      {
        kind: "official",
        name: "朱銘美術館",
        url: "https://www.juming.org.tw/",
      },
      {
        kind: "gov",
        name: "新北市政府文化局",
        url: "https://www.culture.ntpc.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "nt-sanchong-floodway",
    name: "三重疏洪親水公園",
    city: "新北市",
    district: "三重區",
    lat: 25.0833,
    lng: 121.4833,
    address: "新北市三重區疏洪道右岸（近重新橋）",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["親水設施", "大草坪", "自行車道", "停車場"],
    tags: ["免費", "玩水", "野餐友善"],
    tips: "亲水設施開放時段依公告為準；記得帶替換衣物與毛巾。",
    sources: [
      {
        kind: "gov",
        name: "新北市政府",
        url: "https://www.ntpc.gov.tw/",
      },
      {
        kind: "editorial",
        name: "新北市觀光旅遊網",
        url: "https://newtaipei.travel/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "nt-linkou-sports",
    name: "林口運動公園",
    city: "新北市",
    district: "林口區",
    lat: 25.0667,
    lng: 121.3667,
    address: "新北市林口區文化一路一段及文化二路一段",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["兒童遊戲場", "跑道", "籃球場", "停車場"],
    tags: ["免費", "運動", "停車方便"],
    tips: "遊戲場分區，低齡與較大童可各玩各的；夏天記得多補水。",
    sources: [
      {
        kind: "gov",
        name: "新北市政府",
        url: "https://www.ntpc.gov.tw/",
      },
      {
        kind: "editorial",
        name: "新北市觀光旅遊網",
        url: "https://newtaipei.travel/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "nt-435",
    name: "新北市美術館（435 藝文特區）",
    city: "新北市",
    district: "板橋區",
    lat: 25.0083,
    lng: 121.4583,
    address: "新北市板橋區中正路435號",
    type: "博物館",
    ageRange: [3, 8],
    free: true,
    indoor: true,
    facilities: ["展覽", "戶外雕塑", "親子廁所", "停車場"],
    tags: ["室內", "免費入場", "雨天備案"],
    tips: "常設展多免費，特展與活動依官網公告；戶外廣場可短暫放電。",
    officialUrl: "https://www.ntcart.museum/",
    sources: [
      {
        kind: "official",
        name: "新北市美術館",
        url: "https://www.ntcart.museum/",
      },
      {
        kind: "gov",
        name: "新北市政府",
        url: "https://www.ntpc.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "nt-tamsui-shalun",
    name: "淡水沙崙海灘",
    city: "新北市",
    district: "淡水區",
    lat: 25.1833,
    lng: 121.4333,
    address: "新北市淡水區沙崙路附近",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["沙灘", "步道", "沖洗區", "停車場"],
    tags: ["免費", "海邊", "戲沙"],
    tips: "僅適合戲沙與踏浪，勿單獨讓幼童近水；風大時注意防曬與保暖。",
    sources: [
      {
        kind: "gov",
        name: "新北市政府",
        url: "https://www.ntpc.gov.tw/",
      },
      {
        kind: "editorial",
        name: "新北市觀光旅遊網",
        url: "https://newtaipei.travel/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  // ── Wave 1：基隆市 ≥5（Tier B）──
  {
    id: "kl-nmmst",
    name: "國立海洋科技博物館",
    city: "基隆市",
    district: "中正區",
    lat: 25.1417,
    lng: 121.7983,
    address: "基隆市中正區北寧路367號",
    type: "博物館",
    ageRange: [3, 8],
    free: false,
    indoor: true,
    facilities: ["常設展", "IMAX", "親子廁所", "停車場"],
    tags: ["室內", "雨天備案", "需購票"],
    tips: "主題館分區大，低齡兒可先鎖定兒童館或深海探索；山區溫差大。票價與營業時間易變動，出發前請以官網為準。",
    officialUrl: "https://www.nmmst.gov.tw/",
    sources: [
      {
        kind: "official",
        name: "國立海洋科技博物館",
        url: "https://www.nmmst.gov.tw/",
      },
      {
        kind: "gov",
        name: "基隆市政府",
        url: "https://www.klcg.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "kl-heping-island",
    name: "和平島公園",
    city: "基隆市",
    district: "中正區",
    lat: 25.1583,
    lng: 121.7667,
    address: "基隆市中正區平一路360號",
    type: "公園",
    ageRange: [3, 8],
    free: false,
    indoor: false,
    facilities: ["地質奇岩", "步道", "親水區", "洗手間"],
    tags: ["海邊", "地質", "需購票"],
    tips: "潮間帶活動依現場與潮汐公告；岩石區濕滑，請牽好幼童。票價與營業時間易變動，出發前請以官網為準。",
    officialUrl: "https://www.northguan-nsa.gov.tw/",
    sources: [
      {
        kind: "official",
        name: "東北及宜蘭海岸國家風景區",
        url: "https://www.northguan-nsa.gov.tw/",
      },
      {
        kind: "gov",
        name: "基隆市政府",
        url: "https://www.klcg.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "kl-chaojing",
    name: "潮境公園",
    city: "基隆市",
    district: "中正區",
    lat: 25.1333,
    lng: 121.8000,
    address: "基隆市中正區北寧路369號",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["海景平台", "步道", "停車場", "洗手間"],
    tags: ["免費", "海邊", "看海"],
    tips: "可與海科館串遊；海風大，建議帶外套與防曬。",
    sources: [
      {
        kind: "gov",
        name: "基隆市政府",
        url: "https://www.klcg.gov.tw/",
      },
      {
        kind: "editorial",
        name: "基隆市觀光處",
        url: "https://tour.klcg.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "kl-chungcheng-park",
    name: "基隆中正公園",
    city: "基隆市",
    district: "信義區",
    lat: 25.1283,
    lng: 121.7450,
    address: "基隆市信義區信二路74巷",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["兒童遊戲場", "步道", "觀景", "洗手間"],
    tags: ["免費", "市區公園", "看夜景"],
    tips: "坡道與階梯多，推車建議走主車道；傍晚可看基隆港夜景。",
    sources: [
      {
        kind: "gov",
        name: "基隆市政府",
        url: "https://www.klcg.gov.tw/",
      },
      {
        kind: "editorial",
        name: "基隆市觀光處",
        url: "https://tour.klcg.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
  {
    id: "kl-nuan-nuan-sports",
    name: "暖暖運動公園",
    city: "基隆市",
    district: "暖暖區",
    lat: 25.0917,
    lng: 121.7333,
    address: "基隆市暖暖區源遠路",
    type: "公園",
    ageRange: [3, 8],
    free: true,
    indoor: false,
    facilities: ["兒童遊戲場", "跑道", "籃球場", "停車場"],
    tags: ["免費", "運動", "社區公園"],
    tips: "遊戲場設備較新，平日午後較少人；夏天記得防曬補水。",
    sources: [
      {
        kind: "gov",
        name: "基隆市政府",
        url: "https://www.klcg.gov.tw/",
      },
      {
        kind: "editorial",
        name: "基隆市觀光處",
        url: "https://tour.klcg.gov.tw/",
      },
    ],
    lastVerified: "2026-08-09",
  },
];

export function getPlayground(id: string): Playground | undefined {
  return PLAYGROUNDS.find((item) => item.id === id);
}

export function listPlaygrounds(): readonly Playground[] {
  return PLAYGROUNDS;
}

export function listCities(): string[] {
  return [...new Set(PLAYGROUNDS.map((item) => item.city))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant"),
  );
}
