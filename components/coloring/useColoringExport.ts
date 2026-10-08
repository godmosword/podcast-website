"use client";

import { useCallback } from "react";
import { canvasBlob } from "@/lib/coloring/bitmap";
import { renderFramedArtwork } from "@/lib/coloring/export-frame";
import {
  downloadColoringBlob,
  printColoringImage,
  shareColoringBlob,
} from "@/lib/coloring/export-actions";

type Options = {
  title: string;
  /** 先合成好再回傳畫布；還沒載入回 null。 */
  getComposited: () => HTMLCanvasElement | null;
  onError: (message: string) => void;
};

/** 存圖片／分享／列印：下載與分享加品牌邊框，失敗時給家長看得懂的提示。 */
export function useColoringExport({ title, getComposited, onError }: Options) {
  const exportBlob = useCallback(async () => {
    const display = getComposited();
    if (!display) throw new Error("畫布尚未載入");
    let framed = display;
    try {
      framed = await renderFramedArtwork(display, { mascotSrc: "/mascot.png" });
    } catch {
      /* original is still exportable */
    }
    return canvasBlob(framed);
  }, [getComposited]);

  const download = useCallback(async () => {
    try {
      downloadColoringBlob(await exportBlob(), `${title}-著色`);
    } catch {
      onError("圖片暫時無法存下，請再試一次。");
    }
  }, [exportBlob, title, onError]);

  const share = useCallback(async () => {
    try {
      const result = await shareColoringBlob(await exportBlob(), title);
      if (result === "downloaded") onError("已改用下載保存圖片。");
    } catch {
      onError("分享暫時無法開啟，可以先下載圖片。");
    }
  }, [exportBlob, title, onError]);

  const print = useCallback(
    async (source: Blob | string) => {
      try {
        await printColoringImage(source, title);
      } catch {
        onError("列印暫時無法開啟，可以先下載圖片。");
      }
    },
    [title, onError],
  );

  /** 列印目前畫面（不加邊框）。 */
  const printArtwork = useCallback(async () => {
    const display = getComposited();
    if (display) await print(await canvasBlob(display));
  }, [getComposited, print]);

  return { download, share, print, printArtwork };
}
