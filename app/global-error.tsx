"use client";

import * as Sentry from "@sentry/nextjs";
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
    Sentry.captureException(error, {
      tags: {
        boundary: "global",
        error_digest: error.digest ?? "unknown",
      },
    });
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
          <p aria-hidden="true" style={{ fontSize: 48, margin: 0 }}>
            🚗
          </p>
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
