"use client";

import { reportClientBoundaryError } from "@/lib/sentry-client";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientBoundaryError(error, "global");
  }, [error]);

  return (
    <html lang="zh-Hant">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
          color: "#233142",
          background: "#fffaf0",
        }}
      >
        <main style={{ maxWidth: 520, textAlign: "center" }}>
          {/* 整站出錯時 CSS 與元件都可能壞掉：用最單純的 img 放站上車車 logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot.png" alt="" width={64} height={64} style={{ display: "block", margin: "0 auto" }} />
          <h1>這一頁暫時休息中</h1>
          <p>剛剛遇到一個小狀況，請再試一次，或先回故事屋。</p>
          <button type="button" onClick={() => reset()}>
            再試一次
          </button>{" "}
          <Link href="/">回故事屋</Link>
        </main>
      </body>
    </html>
  );
}
