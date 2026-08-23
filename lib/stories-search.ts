export type StoriesSearchState = {
  vehicle: string | null;
  tag: string | null;
  query: string;
};

/** 從 URL search params 讀出合法篩選；非法值忽略，避免污染狀態。 */
export function parseStoriesSearchParams(
  params: Pick<URLSearchParams, "get">,
  vehicles: readonly string[],
  tags: readonly string[],
): StoriesSearchState {
  const vehicleRaw = params.get("vehicle");
  const tagRaw = params.get("tag");
  const queryRaw = params.get("q") ?? "";
  return {
    vehicle: vehicleRaw && vehicles.includes(vehicleRaw) ? vehicleRaw : null,
    tag: tagRaw && tags.includes(tagRaw) ? tagRaw : null,
    query: queryRaw.trim(),
  };
}

/** 組出可分享的 `/stories` query（空則回空字串）。 */
export function storiesSearchQuery(
  vehicle: string | null,
  tag: string | null,
  query: string,
): string {
  const params = new URLSearchParams();
  if (vehicle) params.set("vehicle", vehicle);
  if (tag) params.set("tag", tag);
  const trimmed = query.trim();
  if (trimmed) params.set("q", trimmed);
  return params.toString();
}
