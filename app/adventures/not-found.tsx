import SegmentNotFound from "@/components/errors/SegmentNotFound";

export default function UniverseMapNotFound() {
  return (
    <SegmentNotFound
      title="找不到這座島"
      message="可能是網址打錯了，或這座島還在建造中。"
      backHref="/adventures"
      backLabel="回樂園地圖"
    />
  );
}
