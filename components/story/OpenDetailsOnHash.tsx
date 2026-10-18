"use client";

import { useEffect } from "react";

/**
 * 網址錨點指到某個 `<details id>` 時把它展開。
 * 用在故事頁：頂部「給爸媽：一起聊聊」跳到 `#co-listen`，跳過去就直接看到內容，
 * 不用再點一次。不渲染任何東西。
 *
 * - 點頁內連結時另外聽 click：網址已經是 `#co-listen` 時再點，hash 不變、不會有 hashchange。
 * - 使用者主動點的才把焦點移到摘要列（鍵盤與讀屏接得上）；進頁就帶 hash 時只展開、不搶焦點。
 */
export default function OpenDetailsOnHash({ id }: { id: string }) {
  useEffect(() => {
    const hash = `#${id}`;
    const open = (moveFocus: boolean) => {
      const target = document.getElementById(id);
      if (!(target instanceof HTMLDetailsElement)) return;
      target.open = true;
      if (moveFocus) {
        target.querySelector("summary")?.focus({ preventScroll: true });
      }
    };
    const onHashChange = () => {
      if (window.location.hash === hash) open(true);
    };
    const onClick = (event: MouseEvent) => {
      const origin = event.target instanceof Element ? event.target : null;
      if (origin?.closest(`a[href="${hash}"]`)) open(true);
    };

    if (window.location.hash === hash) open(false);
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick);
    };
  }, [id]);

  return null;
}
