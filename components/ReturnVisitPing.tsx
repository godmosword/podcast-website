"use client";

import { useEffect } from "react";
import { pingReturnVisit } from "@/lib/return-visit";

/** 回訪訊號：mount 時 ping 一次（口徑見 lib/return-visit.ts），不渲染任何內容。 */
export default function ReturnVisitPing() {
  useEffect(() => {
    pingReturnVisit();
  }, []);
  return null;
}
