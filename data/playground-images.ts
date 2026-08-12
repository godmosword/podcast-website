/**
 * 親子遊樂地圖景點圖片 sidecar（由 scripts/fetch-playground-images.ts 產生／維護）。
 * 合併進 listPlaygrounds()／getPlayground()；勿手改 webp 檔名與 id 脫鉤。
 */
export type PlaygroundImageMeta = {
  src: string;
  alt: string;
  credit: string;
};

/** id → 圖片 meta；缺席＝該景點無圖。 */
export const PLAYGROUND_IMAGES: Readonly<
  Record<string, PlaygroundImageMeta>
> = {
  "ch-baguashan": {
    src: "/play-map/ch-baguashan.webp",
    alt: "八卦山風景區實景",
    credit: "觀光局資訊室／CC BY 4.0／https://commons.wikimedia.org/wiki/File:%E5%85%AB%E5%8D%A6%E5%B1%B1%E5%A4%A7%E4%BD%9B%E9%A2%A8%E6%99%AF%E5%8D%80.jpg",
  },
  "ch-baiguoshan": {
    src: "/play-map/ch-baiguoshan.webp",
    alt: "百果山風景區實景",
    credit: "Alice／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:%E5%93%A1%E6%9E%97%E7%A5%9E%E7%A4%BE%E9%81%BA%E8%B7%A1.JPG",
  },
  "ch-fan-garage": {
    src: "/play-map/ch-fan-garage.webp",
    alt: "彰化扇形車庫實景",
    credit: "Lilychen1388／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Foundation_of_TRA_Changhua_Roundhouse_plaque_20141011.jpg",
  },
  "ch-xizhou": {
    src: "/play-map/ch-xizhou.webp",
    alt: "溪州公園實景",
    credit: "Mk2010／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Changhua_Fitzroy_Gardens_(Taiwan).jpg",
  },
  "hc-18peak": {
    src: "/play-map/hc-18peak.webp",
    alt: "十八尖山森林步道實景",
    credit: "T Gordon Cheng／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:Eighteen_Peaks_Mountain_Ghie_Show_Pavilion.jpg",
  },
  "hc-glass-museum": {
    src: "/play-map/hc-glass-museum.webp",
    alt: "新竹市玻璃工藝博物館實景",
    credit: "寺人孟子／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E6%96%B0%E7%AB%B9%E5%B8%82%E7%AB%8B%E7%8E%BB%E7%92%83%E5%B7%A5%E8%97%9D%E5%8D%9A%E7%89%A9%E9%A4%A8.jpg",
  },
  "hc-hsinchu-park": {
    src: "/play-map/hc-hsinchu-park.webp",
    alt: "新竹公園實景",
    credit: "曾傳富／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E6%96%B0%E7%AB%B9%E5%85%AC%E5%9C%92%E6%B9%96%E7%95%94%E6%96%99%E4%BA%AD.jpg",
  },
  "hc-nanliao": {
    src: "/play-map/hc-nanliao.webp",
    alt: "南寮漁港親子公園實景",
    credit: "lienyuan lee／CC BY 3.0／https://commons.wikimedia.org/wiki/File:Nanliao_Fishing_Harbor_%E5%8D%97%E5%AF%AE%E6%BC%81%E6%B8%AF_-_panoramio.jpg",
  },
  "hc-qingqing": {
    src: "/play-map/hc-qingqing.webp",
    alt: "青青草原實景",
    credit: "lienyuan lee／CC BY 3.0／https://commons.wikimedia.org/wiki/File:Qingjing_Qing_Qing_Grassland_%E6%B8%85%E5%A2%83%E9%9D%92%E9%9D%92%E8%8D%89%E5%8E%9F_-_panoramio.jpg",
  },
  "hc-xiangshan-wetland": {
    src: "/play-map/hc-xiangshan-wetland.webp",
    alt: "香山濕地實景",
    credit: "寺人孟子／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E9%80%80%E6%BD%AE%E6%99%82%E7%9A%84%E9%A6%99%E5%B1%B1%E6%BF%95%E5%9C%B0.jpg",
  },
  "hc-zhongxiao-park": {
    src: "/play-map/hc-zhongxiao-park.webp",
    alt: "忠孝公園實景",
    credit: "T Gordon Cheng／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E5%A4%A7%E6%BD%A4%E7%99%BC%E6%96%B0%E7%AB%B9%E5%BF%A0%E5%AD%9D%E5%BA%97%E5%85%AC%E5%9C%92%E8%B7%AF%E5%87%BA%E5%8F%A3_2021-01-15.jpg",
  },
  "hc-zoo": {
    src: "/play-map/hc-zoo.webp",
    alt: "新竹市立動物園實景",
    credit: "Taiwania Justo／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:New_gate_1_of_Hsinchu_Zoo_2020.jpg",
  },
  "hcx-dingdong": {
    src: "/play-map/hcx-dingdong.webp",
    alt: "小叮噹科學主題樂園實景",
    credit: "Yuriy kosygin／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Little_Ding-Dong_Science_Theme_Park_entrance_sign_20140816.jpg",
  },
  "hcx-emei-lake": {
    src: "/play-map/hcx-emei-lake.webp",
    alt: "峨眉湖環湖步道實景",
    credit: "Taiwankengo／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:2023_Dapu_Reservoir_s3.jpg",
  },
  "hcx-greenworld": {
    src: "/play-map/hcx-greenworld.webp",
    alt: "綠世界生態農場實景",
    credit: "lienyuan lee／CC BY 3.0／https://commons.wikimedia.org/wiki/File:Green_World_Economical_Farm_%E7%B6%A0%E4%B8%96%E7%95%8C%E7%94%9F%E6%85%8B%E8%BE%B2%E5%A0%B4_-_panoramio.jpg",
  },
  "hcx-hukou-sports": {
    src: "/play-map/hcx-hukou-sports.webp",
    alt: "湖口運動公園實景",
    credit: "Yuriy kosygin／CC BY 4.0／https://commons.wikimedia.org/wiki/File:YouBike_%E5%8B%9D%E5%88%A9%E9%81%8B%E5%8B%95%E5%85%AC%E5%9C%92.jpg",
  },
  "hcx-leofoo": {
    src: "/play-map/hcx-leofoo.webp",
    alt: "六福村主題遊樂園實景",
    credit: "Rico Shen／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:LeofooVillage_MainEntrance_Back.jpg",
  },
  "hcx-neiwan": {
    src: "/play-map/hcx-neiwan.webp",
    alt: "內灣親水公園實景",
    credit: "lienyuan lee／CC BY 3.0／https://commons.wikimedia.org/wiki/File:%E5%85%A7%E7%81%A3%E6%88%B2%E9%99%A2_Neiwan_Theater_-_panoramio.jpg",
  },
  "hcx-xinwaya": {
    src: "/play-map/hcx-xinwaya.webp",
    alt: "新瓦屋客家文化保存區實景",
    credit: "Cookai1205／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Youbike_2.0_%E6%96%B0%E7%93%A6%E5%B1%8B%E5%AE%A2%E5%AE%B6%E6%96%87%E5%8C%96%E4%BF%9D%E5%AD%98%E5%8D%80%E7%AB%99%E9%BB%9E.jpg",
  },
  "hcx-zhudong-forestry": {
    src: "/play-map/hcx-zhudong-forestry.webp",
    alt: "竹東林業展示館實景",
    credit: "Yuriy kosygin／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:%E7%AB%B9%E6%9D%B1%E6%9E%97%E6%A5%AD%E5%B1%95%E7%A4%BA%E9%A4%A8%E5%BB%BA%E7%AF%89.jpg",
  },
  "kl-chaojing": {
    src: "/play-map/kl-chaojing.webp",
    alt: "潮境公園實景",
    credit: "丘崈／CC0／https://commons.wikimedia.org/wiki/File:%E5%85%AB%E6%96%97%E5%AD%90%E6%BD%AE%E5%A2%83%E5%85%AC%E5%9C%92.jpg",
  },
  "kl-chungcheng-park": {
    src: "/play-map/kl-chungcheng-park.webp",
    alt: "基隆中正公園實景",
    credit: "阿道／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E5%9F%BA%E9%9A%86%E4%B8%AD%E6%AD%A3%E5%85%AC%E5%9C%92%E5%A4%A7%E4%BD%9B%E7%A6%AA%E9%99%A2.jpg",
  },
  "kl-heping-island": {
    src: "/play-map/kl-heping-island.webp",
    alt: "和平島公園實景",
    credit: "lienyuan lee／CC BY 3.0／https://commons.wikimedia.org/wiki/File:Peace_Island_Coast_Park_%E5%92%8C%E5%B9%B3%E5%B3%B6%E5%85%AC%E5%9C%92_-_panoramio.jpg",
  },
  "kl-nmmst": {
    src: "/play-map/kl-nmmst.webp",
    alt: "國立海洋科技博物館實景",
    credit: "Taiwankengo／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:2021_IMAX_Theater,_National_Museum_of_Marine_Science_%26_Technology_in_Taiwan.jpg",
  },
  "kl-nuan-nuan-sports": {
    src: "/play-map/kl-nuan-nuan-sports.webp",
    alt: "暖暖運動公園實景",
    credit: "lienyuan lee／CC BY 3.0／https://commons.wikimedia.org/wiki/File:%E6%9A%96%E6%9A%96%E9%81%8B%E5%8B%95%E5%85%AC%E5%9C%92_Nuan_Nuan_Sports_Park_-_panoramio.jpg",
  },
  "ml-flyingcow": {
    src: "/play-map/ml-flyingcow.webp",
    alt: "飛牛牧場實景",
    credit: "lienyuan lee／CC BY 3.0／https://commons.wikimedia.org/wiki/File:Flying_Cow_Ranch_%E9%A3%9B%E7%89%9B%E7%89%A7%E5%A0%B4_-_panoramio.jpg",
  },
  "ml-hutoushan": {
    src: "/play-map/ml-hutoushan.webp",
    alt: "通霄虎頭山公園實景",
    credit: "Taiwankengo／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:2022_Hutou_Mountain_Park_(Tongxiao)_N1.jpg",
  },
  "ml-westlake": {
    src: "/play-map/ml-westlake.webp",
    alt: "西湖渡假村實景",
    credit: "龍本／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:West_Lake_Resortopia_and_West_Lake_Resort_Hotel_entrance_sign_20100102.jpg",
  },
  "ml-zhunan-sports": {
    src: "/play-map/ml-zhunan-sports.webp",
    alt: "竹南運動公園實景",
    credit: "小蒯 精悅科技／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E7%AB%B9%E5%8D%97%E9%81%8B%E5%8B%95%E5%85%AC%E5%9C%92%E4%B8%80%E6%99%AF.jpg",
  },
  "nt-435": {
    src: "/play-map/nt-435.webp",
    alt: "新北市美術館（435 藝文特區）實景",
    credit: "阿道／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Playground_of_Banqiao_435_Art_Zone_20250902.jpg",
  },
  "nt-juming": {
    src: "/play-map/nt-juming.webp",
    alt: "朱銘美術館實景",
    credit: "Irvin@Mapillary／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Ju_Ming_Museum_Visitor_Center.jpg",
  },
  "nt-metro-park": {
    src: "/play-map/nt-metro-park.webp",
    alt: "新北市大都會公園實景",
    credit: "Taiwankengo／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:2020_New_Taipei_Metropolitan_Park_ao%C3%BBt_i.jpg",
  },
  "nt-sanchong-floodway": {
    src: "/play-map/nt-sanchong-floodway.webp",
    alt: "三重疏洪親水公園實景",
    credit: "Winertai／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:Freeway_1_over_Erchong_Floodway_20070428.jpg",
  },
  "nt-shihsanhang": {
    src: "/play-map/nt-shihsanhang.webp",
    alt: "新北市立十三行博物館實景",
    credit: "Taiwankengo／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E6%96%B0%E5%8C%97%E5%B8%82%E7%AB%8B%E5%8D%81%E4%B8%89%E8%A1%8C%E5%8D%9A%E7%89%A9%E9%A4%A8FUJI7904.JPG",
  },
  "nt-tamsui-shalun": {
    src: "/play-map/nt-tamsui-shalun.webp",
    alt: "淡水沙崙海灘實景",
    credit: "O.haaaan／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E6%B7%A1%E6%B0%B4%E6%B2%99%E5%B4%99%E6%B5%B7%E7%81%98-%E6%B5%B7%E9%82%8A.jpg",
  },
  "nt-yingge-ceramic": {
    src: "/play-map/nt-yingge-ceramic.webp",
    alt: "新北市立鶯歌陶瓷博物館實景",
    credit: "氏子／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E6%96%B0%E5%8C%97%E5%B8%82%E7%AB%8B%E9%B6%AF%E6%AD%8C%E9%99%B6%E7%93%B7%E5%8D%9A%E7%89%A9%E9%A4%A8%E6%A8%A1%E5%9E%8B.jpg",
  },
  "nto-checheng": {
    src: "/play-map/nto-checheng.webp",
    alt: "車埕木業展示館實景",
    credit: "Pbdragonwang／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E8%BB%8A%E5%9F%95%E6%9C%A8%E6%A5%AD%E5%B1%95%E7%A4%BA%E9%A4%A8%E5%A4%A7%E9%96%80.jpg",
  },
  "nto-cingjing": {
    src: "/play-map/nto-cingjing.webp",
    alt: "清境農場實景",
    credit: "Extremes Tim from Taiwan／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:Evergreen_grassland.jpg",
  },
  "nto-nine": {
    src: "/play-map/nto-nine.webp",
    alt: "九族文化村實景",
    credit: "sfmine79／CC BY 2.0／https://commons.wikimedia.org/wiki/File:Turnstile_entrance_to_the_Formosan_Aboriginal_Culture_Village.jpg",
  },
  "nto-paper-dome": {
    src: "/play-map/nto-paper-dome.webp",
    alt: "紙教堂新桃花源農莊實景",
    credit: "lienyuan lee／CC BY 3.0／https://commons.wikimedia.org/wiki/File:%E7%B4%99%E6%95%99%E5%A0%82_Paper_Dome_-_panoramio.jpg",
  },
  "nto-xiangshan": {
    src: "/play-map/nto-xiangshan.webp",
    alt: "日月潭向山遊客中心實景",
    credit: "舟集 Boattoad／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E6%97%A5%E6%9C%88%E6%BD%AD%E5%90%91%E5%B1%B1%E9%81%8A%E5%AE%A2%E4%B8%AD%E5%BF%83_05.jpg",
  },
  "tc-fengle": {
    src: "/play-map/tc-fengle.webp",
    alt: "豐樂雕塑公園實景",
    credit: "Kai3952／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:West_entrance_sign_at_Fengle_Sculpture_Park,_as_taken_on_3_March_2021.jpg",
  },
  "tc-gaomei": {
    src: "/play-map/tc-gaomei.webp",
    alt: "高美濕地實景",
    credit: "Axjun／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E9%AB%98%E7%BE%8E%E6%BF%95%E5%9C%B0%E6%BF%B1%E6%B5%B7%E5%8D%80%E5%9F%9F.jpg",
  },
  "tc-lihpao": {
    src: "/play-map/tc-lihpao.webp",
    alt: "麗寶樂園實景",
    credit: "Yuriy kosygin／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:View_of_Lihpao_Land.jpg",
  },
  "tc-metro-park": {
    src: "/play-map/tc-metro-park.webp",
    alt: "台中都會公園實景",
    credit: "Fcuk1203／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:Taichung_Metropolitan_Park_main_entrance_2010-08-12.jpg",
  },
  "tc-nmns": {
    src: "/play-map/tc-nmns.webp",
    alt: "國立自然科學博物館實景",
    credit: "Tiouraren (Y.-C. Tsai)／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Entrance_of_Botanical_Garden_of_NMNS,_Taichung.jpg",
  },
  "tc-qiuhonggu": {
    src: "/play-map/tc-qiuhonggu.webp",
    alt: "秋紅谷景觀生態公園實景",
    credit: "Ralff Nestor Nacor／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Copperleaf_plant_in_Maple_Garden,_Taichung.jpg",
  },
  "tc-taichung-park": {
    src: "/play-map/tc-taichung-park.webp",
    alt: "台中公園實景",
    credit: "Jidanni／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Taichung_Park_5.jpg",
  },
  "tp-astro": {
    src: "/play-map/tp-astro.webp",
    alt: "臺北市立天文科學教育館實景",
    credit: "Latinboy／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:Meilun_Park_and_Taipei_Astronomical_Museum_20040714.jpg",
  },
  "tp-children-park": {
    src: "/play-map/tp-children-park.webp",
    alt: "台北市立兒童新樂園實景",
    credit: "Winertai／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:Taipei_Children%27s_Amusement_Park_20141224.jpg",
  },
  "tp-da-an-park": {
    src: "/play-map/tp-da-an-park.webp",
    alt: "大安森林公園實景",
    credit: "玄史生／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:Daan_Park_Ecological_Pool_West_Zone.jpg",
  },
  "tp-ntsec": {
    src: "/play-map/tp-ntsec.webp",
    alt: "國立臺灣科學教育館實景",
    credit: "zh:國立臺灣科學教育館／Attribution／https://commons.wikimedia.org/wiki/File:National_Taiwan_Science_Education_Center_front.jpg",
  },
  "tp-rongxing": {
    src: "/play-map/tp-rongxing.webp",
    alt: "榮星花園公園實景",
    credit: "nicemanpower／CC0／https://commons.wikimedia.org/wiki/File:%E6%A6%AE%E6%98%9F%E5%85%AC%E5%9C%92%E5%85%A7%E7%B2%BE%E7%B7%BB%E8%8A%B1%E5%9C%92%E5%BB%A3%E5%A0%B4%E6%97%81%E7%9A%84%E6%B0%B4%E6%B1%A0%E8%88%87%E6%A2%85%E8%8A%B120110113.JPG",
  },
  "tp-shilin-residence": {
    src: "/play-map/tp-shilin-residence.webp",
    alt: "士林官邸公園實景",
    credit: "lienyuan lee／CC BY 3.0／https://commons.wikimedia.org/wiki/File:Shilin_Residence_Park_%E5%A3%AB%E6%9E%97%E5%AE%98%E9%82%B8%E5%85%AC%E5%9C%92_-_panoramio.jpg",
  },
  "tp-water-museum": {
    src: "/play-map/tp-water-museum.webp",
    alt: "臺北自來水園區實景",
    credit: "Chi-Hung Lin／CC BY-SA 2.0／https://commons.wikimedia.org/wiki/File:Taipei_Water_Park_entrance_20160101.jpg",
  },
  "tp-zoo": {
    src: "/play-map/tp-zoo.webp",
    alt: "臺北市立動物園實景",
    credit: "Yu tptw／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Taipei_Zoo_Entrance.jpg",
  },
  "ty-chingtang": {
    src: "/play-map/ty-chingtang.webp",
    alt: "青塘園實景",
    credit: "Foxy1219／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E9%9D%92%E5%A1%98%E5%9C%92_%E9%80%81%E5%AD%90%E9%B3%A5.jpg",
  },
  "ty-fenghe": {
    src: "/play-map/ty-fenghe.webp",
    alt: "風禾公園實景",
    credit: "Foxy1219／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Feng_He_Park_2020-07-10.jpg",
  },
  "ty-kids-museum": {
    src: "/play-map/ty-kids-museum.webp",
    alt: "桃園市立兒童美術館實景",
    credit: "Foxy1219／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E6%A1%83%E5%9C%92%E5%B8%82%E5%85%92%E7%AB%A5%E7%BE%8E%E8%A1%93%E9%A4%A8_01.jpg",
  },
  "ty-longtan-pond": {
    src: "/play-map/ty-longtan-pond.webp",
    alt: "龍潭大池實景",
    credit: "寺人孟子／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:%E8%87%AA%E9%BE%8D%E6%BD%AD%E5%A4%A7%E6%B1%A0%E5%8D%97%E7%AB%AF%E7%9C%8B%E9%BE%8D%E6%BD%AD%E5%8D%97%E5%A4%A9%E5%AE%AE.jpg",
  },
  "ty-puhsin": {
    src: "/play-map/ty-puhsin.webp",
    alt: "埔心牧場實景",
    credit: "Solomon203／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Wei_Chuan_Pushin_Ranch_admission_ticket_20190217.jpg",
  },
  "ty-xpark": {
    src: "/play-map/ty-xpark.webp",
    alt: "Xpark 水族館實景",
    credit: "阿道／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Interior_of_Xpark-_05.2024-06-11.jpg",
  },
  "ty-yangming": {
    src: "/play-map/ty-yangming.webp",
    alt: "陽明運動公園實景",
    credit: "Foxy Who \\(^∀^)/／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:%E9%99%BD%E6%98%8E%E9%81%8B%E5%8B%95%E5%85%AC%E5%9C%92_Yangming_Park_-_panoramio.jpg",
  },
  "yl-beigang-park": {
    src: "/play-map/yl-beigang-park.webp",
    alt: "北港親子公園實景",
    credit: "阿道／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Beigang_Matsu_Landscape_Park-04.2024-09-18.jpg",
  },
  "yl-gukeng-tunnel": {
    src: "/play-map/yl-gukeng-tunnel.webp",
    alt: "古坑綠色隧道實景",
    credit: "Chi-Hung Lin／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:%E9%9B%B2%E6%9E%97%E7%B8%A3%E5%8F%A4%E5%9D%91%E9%84%89_%E7%B6%A0%E8%89%B2%E9%9A%A7%E9%81%93(%E7%B8%A3%E9%81%93158%E4%B9%99)_-_panoramio.jpg",
  },
  "yl-janfusun": {
    src: "/play-map/yl-janfusun.webp",
    alt: "劍湖山世界實景",
    credit: "Solomon203／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Janfusun_Fancyworld_fast_food_coupon_NTD20_20161206.jpg",
  },
  "yl-puppet": {
    src: "/play-map/yl-puppet.webp",
    alt: "雲林布袋戲館實景",
    credit: "Dquai／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:In_front_of_the_Yunlin_Hand_Puppet_Museum.jpg",
  }
};
