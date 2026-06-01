"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // 離線快取為漸進增強，註冊失敗不影響主流程。
    });
  }, []);

  return null;
}
