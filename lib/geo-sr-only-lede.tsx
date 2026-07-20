/** 聚合頁 GEO answer-first 導言：視覺隱藏，仍留在 SSR HTML。 */
export function GeoSrOnlyLede({ children }: { children: string }) {
  return <p className="sr-only">{children}</p>;
}
