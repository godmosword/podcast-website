import SegmentNotFound from "@/components/errors/SegmentNotFound";

/*
 * 兩個動態子路由都設了 `dynamicParams = false`，未知參數在進入 segment 之前就被
 * 框架 404 掉，所以這頁只在「generateStaticParams 與查詢結果不一致」的資料漂移
 * 情況下才會出現——那正是最需要講清楚是哪一區出事的時候。
 * `/games` 沒有任何 notFound() 呼叫點，就沒有放對應檔案。
 */

export default function PlayMapNotFound() {
  return (
    <SegmentNotFound
      title="找不到這個景點"
      message="可能是網址打錯了，或這個地點還沒收錄。"
      backHref="/for-parents/play-map"
      backLabel="回親子景點地圖"
    />
  );
}
