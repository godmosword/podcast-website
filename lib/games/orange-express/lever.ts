/**
 * 桿子取得焦點時的按鍵：↑ 加一格、↓ 減一格、Home 回 0、End 拉滿。
 * ←／→ 不在這裡處理：整頁的對應是「←→ 動煞車」（底部提示也這樣寫），點過動力桿之後按 ← 仍要能煞車。
 * 不是這些鍵回 null，讓按鍵照常往上傳。
 */
export function sliderKeyTarget(key: string, notch: number, max: number): number | null {
  switch (key) {
    case "ArrowUp":
      return Math.min(max, notch + 1);
    case "ArrowDown":
      return Math.max(0, notch - 1);
    case "Home":
      return 0;
    case "End":
      return max;
    default:
      return null;
  }
}
