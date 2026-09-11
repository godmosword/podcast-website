/**
 * 首頁 3D 開場的閘門（ADR-0004）。
 *
 * `/` 一律回傳完整的 Landing HTML；3D 是蓋在它上面的同頁覆蓋層，不是導航。
 * 判斷寫在 `<head>` 的同步 script 裡，在**首次繪製之前**決定覆蓋層存不存在，
 * 所以 ADR-0003 量到的「先看到 Landing 再被抽換」那段時間窗根本不存在。
 *
 * 方向是「預設隱藏、script 決定打開」而不是反過來：無 JS 或 script 丟例外時，
 * 使用者直接看到 Landing。反向設計在那兩種情況下會把 Landing 鎖死，
 * 而 `app/globals.css` 的 `html:has([data-landing-root]){overflow:hidden}`
 * 會讓那變成真正無法捲動的死頁。
 */

export const INTRO_GATE_STORAGE_KEY = "cheche:intro-seen-v1";
export const INTRO_GATE_ATTRIBUTE = "data-intro-gate";
export const INTRO_GATE_ON = "on";

/** 覆蓋層出現的頻率。切成 `always` 就是每次進首頁都播。 */
export const INTRO_GATE_FREQUENCY: "session" | "always" = "session";

export type IntroGateInput = {
  /** `location.pathname`；覆蓋層只屬於首頁。 */
  pathname: string;
  /** `location.search`；`?enter=1` 是已經表達過進站意圖的語意入口。 */
  search: string;
  /** 這個分頁已經看過開場。 */
  seen: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** `navigator.connection.effectiveType`。 */
  effectiveType: string;
  /** 部署層的 3D 總開關（`NEXT_PUBLIC_HERO_3D`）。 */
  heroDisabled: boolean;
};

/**
 * 純函式是唯一真相——它是產品契約，必須能在不啟動瀏覽器的情況下被測試。
 *
 * reduced motion／Save-Data／2G 三個條件放在這裡是刻意的：ADR-0003 最有力的
 * 證據就是舊的自動導向把「明確表示不要動畫、不要花流量」的使用者推去看一張
 * 靜態圖。覆蓋層對這些人也只會是一張 poster 加一顆按鈕，等於多一次點擊。
 * 在同頁覆蓋層下這三個檢查是免費的：同步、繪製前、而且沒有導航要閃。
 */
export function shouldOpenIntroGate({
  pathname, search, seen, reducedMotion, saveData, effectiveType, heroDisabled,
}: IntroGateInput): boolean {
  if (pathname !== "/") return false;
  if (heroDisabled || reducedMotion || saveData) return false;
  if (/^(slow-)?2g$/.test(effectiveType)) return false;
  if (new URLSearchParams(search).get("enter") === "1") return false;
  return !seen;
}

/**
 * `<head>` 裡的同步 script。邏輯與 `shouldOpenIntroGate` 一一對應，並由
 * `lib/intro-gate.test.ts` 交叉驗證兩者行為一致，避免兩份實作漂移。
 *
 * 整段包在 try/catch：storage 被封鎖、`matchMedia` 不存在等任何意外都只會讓
 * 覆蓋層不出現，永遠不會讓首頁壞掉。
 */
export const INTRO_GATE_INIT_SCRIPT = `(function(){try{
if(location.pathname!=="/")return;
if(${process.env.NEXT_PUBLIC_HERO_3D === "0" ? "true" : "false"})return;
if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var c=navigator.connection;
if(c&&c.saveData)return;
if(c&&/^(slow-)?2g$/.test(c.effectiveType||""))return;
if(new URLSearchParams(location.search).get("enter")==="1")return;
${INTRO_GATE_FREQUENCY === "session" ? `if(sessionStorage.getItem("${INTRO_GATE_STORAGE_KEY}")==="1")return;` : ""}
document.documentElement.setAttribute("${INTRO_GATE_ATTRIBUTE}","${INTRO_GATE_ON}");
}catch(e){}})();`;

/**
 * 第二支同步 script，放在 `<main>` **之後**。`<head>` 執行時 `<main>` 還不存在，
 * 而把 `inert` 留給 React effect 會在「首次繪製 → hydration 完成」之間讓鍵盤
 * 使用者 Tab 到覆蓋層背後——那個窗口在慢裝置上就是 ADR-0003 量到的量級。
 *
 * 只設 `inert`，不設 `aria-hidden`：`role="dialog"` 已足以標開場，Landing
 * 用 inert 擋掉。頂欄刻意不封——開場期間訂閱／留言／漢堡仍要能點。
 */
export const INTRO_GATE_INERT_MARK = "data-intro-inert";

export const INTRO_GATE_INERT_SCRIPT = `(function(){try{
// 覆蓋層每一層祖先的兄弟節點都要 inert，不能只蓋 Landing：skip link 是
// layout 的節點，不在 [data-landing-root] 裡面。頂欄（site-nav-bar）留下，
// 開場期間訂閱／留言／漢堡要能用。只清自己標記過的，不動別人設的 inert。
var seal=function(){
  var overlay=document.querySelector("[data-intro-overlay]");
  if(!overlay)return;
  for(var node=overlay;node&&node.parentNode&&node!==document.body;node=node.parentNode){
    var siblings=node.parentNode.children;
    for(var i=0;i<siblings.length;i++){
      var sibling=siblings[i];
      if(sibling===node||sibling.hasAttribute("inert"))continue;
      if(sibling.getAttribute&&sibling.getAttribute("data-testid")==="site-nav-bar")continue;
      sibling.setAttribute("inert","");
      sibling.setAttribute("${INTRO_GATE_INERT_MARK}","");
    }
  }
};
var close=function(){
  document.documentElement.removeAttribute("${INTRO_GATE_ATTRIBUTE}");
  // 在關閉當下重新查詢，不是沿用閉包變數：DOM 可能已經換過。
  var sealed=document.querySelectorAll("[${INTRO_GATE_INERT_MARK}]");
  for(var i=0;i<sealed.length;i++){
    sealed[i].removeAttribute("inert");
    sealed[i].removeAttribute("${INTRO_GATE_INERT_MARK}");
  }
  try{sessionStorage.setItem("${INTRO_GATE_STORAGE_KEY}","1")}catch(e){}
  var target=document.getElementById("main-content");
  if(target&&target.focus)target.focus({preventScroll:true});
};
if(document.documentElement.getAttribute("${INTRO_GATE_ATTRIBUTE}")==="${INTRO_GATE_ON}")seal();
// hydration 之前，覆蓋層的按鈕還沒有 React handler——那段時間如果沒有出口，
// 慢裝置上使用者會被一層按不掉的東西擋住。這個 capture 階段的保底讓 Esc 與
// 出口按鈕從**繪製當下**就能用；React 掛載後讀 <html> 屬性即可同步狀態。
document.addEventListener("keydown",function(event){
  if(event.key==="Escape"&&document.documentElement.getAttribute("${INTRO_GATE_ATTRIBUTE}")==="${INTRO_GATE_ON}")close();
},true);
document.addEventListener("click",function(event){
  var node=event.target;
  while(node&&node!==document){
    if(node.hasAttribute&&node.hasAttribute("data-intro-dismiss")){close();return;}
    node=node.parentNode;
  }
},true);
}catch(e){}})();`;

export function isIntroGateOpen(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute(INTRO_GATE_ATTRIBUTE) === INTRO_GATE_ON;
}

/** 關掉覆蓋層：移屬性、記住這個分頁看過了、把 Landing 交還給鍵盤。 */
export function dismissIntroGate(): void {
  if (typeof document === "undefined") return;
  document.documentElement.removeAttribute(INTRO_GATE_ATTRIBUTE);
  // 只解除自己封起來的節點；別人（例如其他 dialog）設的 inert 不動。
  for (const sealed of document.querySelectorAll(`[${INTRO_GATE_INERT_MARK}]`)) {
    sealed.removeAttribute("inert");
    sealed.removeAttribute(INTRO_GATE_INERT_MARK);
  }
  try {
    sessionStorage.setItem(INTRO_GATE_STORAGE_KEY, "1");
  } catch {
    // 隱私模式寫不進去時，至少這次瀏覽的覆蓋層已經關掉了。
  }
}

/**
 * 把覆蓋層以外的節點封住。邏輯與 `INTRO_GATE_INERT_SCRIPT` 的 seal 對齊：
 * skip-link 與 Landing 都 inert，頂欄留下。覆蓋層還沒掛上時是 no-op。
 */
export function sealIntroBackground(): void {
  if (typeof document === "undefined") return;
  const overlay = document.querySelector("[data-intro-overlay]");
  if (!overlay) return;
  for (
    let node: Element | null = overlay;
    node && node.parentNode && node !== document.body;
    node = node.parentNode instanceof Element ? node.parentNode : null
  ) {
    for (const sibling of Array.from(node.parentNode.children)) {
      if (sibling === node || sibling.hasAttribute("inert")) continue;
      if (sibling.getAttribute("data-testid") === "site-nav-bar") continue;
      sibling.setAttribute("inert", "");
      sibling.setAttribute(INTRO_GATE_INERT_MARK, "");
    }
  }
}

/**
 * 使用者在 Landing 明確要再看開場。不讀 `shouldOpenIntroGate`：reduced motion／
 * Save-Data／這個分頁已經看過，點了就開。不清 `cheche:intro-seen-v1`，重新整理
 * 仍不會自動再播。
 */
export function reopenIntroGate(): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(INTRO_GATE_ATTRIBUTE, INTRO_GATE_ON);
  sealIntroBackground();
}

/** 一般點擊重開同頁覆蓋層；修飾鍵／中鍵／部署關掉 3D 時走原生 `/intro`。 */
export function shouldReplayIntroOverlay({
  heroDisabled,
  button,
  metaKey,
  ctrlKey,
  shiftKey,
  altKey,
}: {
  heroDisabled: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): boolean {
  if (heroDisabled) return false;
  return button === 0 && !metaKey && !ctrlKey && !shiftKey && !altKey;
}
