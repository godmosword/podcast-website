import { GeoSrOnlyLede } from "@/lib/geo-sr-only-lede";

type StoriesIndexHeaderProps = {
  lede: string;
  titleClassName: string;
};

/** `/stories` 可見標題 + 螢幕閱讀器／GEO 用 catalog 導言。 */
export function StoriesIndexHeader({
  lede,
  titleClassName,
}: StoriesIndexHeaderProps) {
  return (
    <>
      <h1 className={titleClassName}>全部故事</h1>
      <GeoSrOnlyLede>{lede}</GeoSrOnlyLede>
    </>
  );
}
