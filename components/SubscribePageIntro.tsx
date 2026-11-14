"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  SUBSCRIBE_CLOSED_PAGE_LEDE,
  SUBSCRIBE_CLOSED_PAGE_TITLE,
  SUBSCRIBE_PAGE_LEDE,
  SUBSCRIBE_PAGE_TITLE,
} from "@/lib/subscribe-copy";

type SubscribePageIntroProps = {
  /** build 時的判斷，當第一畫面；瀏覽器再向 API 確認一次，和下方表單用同一個答案。 */
  initialOpen: boolean;
  titleClassName: string;
  ledeClassName: string;
};

/**
 * /subscribe 的標題與導言。登記關閉時不請人留 Email
 *（原本上面寫「先留下家長 Email」、下面的表單卻說登記關閉）。
 * 頁面是靜態產生，build 與部署的設定可能不同，所以掛載後再問一次 GET /api/subscribe。
 */
export default function SubscribePageIntro({
  initialOpen,
  titleClassName,
  ledeClassName,
}: SubscribePageIntroProps) {
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      try {
        const res = await fetch("/api/subscribe", { method: "GET" });
        if (!res.ok) throw new Error("probe failed");
        const data = (await res.json()) as { available?: boolean };
        if (!cancelled) setOpen(data.available === true);
      } catch {
        // 和表單同一個結論：問不到就當關閉，畫面上仍有收聽平台可以按。
        if (!cancelled) setOpen(false);
      }
    }

    void probe();
    return () => {
      cancelled = true;
    };
  }, []);

  if (open) {
    return (
      <>
        <h1 className={titleClassName}>{SUBSCRIBE_PAGE_TITLE}</h1>
        <p className={ledeClassName}>
          {SUBSCRIBE_PAGE_LEDE} 完整收聽請在{" "}
          <Link href="#connect">Spotify 或 Apple Podcasts</Link> 訂閱節目。
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className={titleClassName}>{SUBSCRIBE_CLOSED_PAGE_TITLE}</h1>
      <p className={ledeClassName}>{SUBSCRIBE_CLOSED_PAGE_LEDE}</p>
    </>
  );
}
