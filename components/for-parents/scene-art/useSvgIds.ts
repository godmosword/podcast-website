import { useId } from "react";

/**
 * 同一頁會同時出現四張情境插畫，漸層與濾鏡 id 必須唯一。
 * React 的 useId 帶「:」或「«»」，放進 url(#…) 不保險，只留英數字。
 */
export function useSvgIds<const K extends string>(keys: readonly K[]): Record<K, string> {
  const base = `sc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return Object.fromEntries(keys.map((key) => [key, `${base}-${key}`])) as Record<K, string>;
}
