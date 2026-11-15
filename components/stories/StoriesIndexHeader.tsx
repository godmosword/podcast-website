import { GeoSrOnlyLede } from "@/lib/geo-sr-only-lede";

type StoriesIndexHeaderProps = {
  lede: string;
  titleClassName: string;
  title?: string;
};

/** 故事列表頁可見標題 + 螢幕閱讀器／GEO 用 catalog 導言。 */
export function StoriesIndexHeader({
  lede,
  titleClassName,
  title = "全部故事",
}: StoriesIndexHeaderProps) {
  return (
    <>
      <h1 className={titleClassName}>{title}</h1>
      <GeoSrOnlyLede>{lede}</GeoSrOnlyLede>
    </>
  );
}
