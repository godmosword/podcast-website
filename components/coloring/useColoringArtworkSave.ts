"use client";

import { useCallback, useRef, useState } from "react";
import type { ColoringPage } from "@/data/coloring-pages";
import { saveColoringArtwork } from "@/lib/coloring/artwork-storage";
import { canvasBlob, thumbnailCanvas } from "@/lib/coloring/bitmap";

/** revision＝擷取當下的版本；之後才落的筆不算在這張裡。 */
export type ArtworkCapture = { snapshot: Blob; thumbnail: Blob; revision: number };

/**
 * 作品收藏與「還沒存」狀態：每次塗色或清空都記一個版本，
 * 收藏成功後記下已存的版本；兩者不同且畫面上有顏色就是還沒存。
 * 「我塗好了」與「離開前收起來」共用同一份。
 */
export function useColoringArtworkSave(page: ColoringPage) {
  const paintRevisionRef = useRef(0);
  const savedRevisionRef = useRef(-1);
  /** 同一版本正在存時，第二次呼叫直接等同一個 promise，不會多寫一筆。 */
  const pendingRef = useRef<{ revision: number; promise: Promise<void> } | null>(null);
  const [unsaved, setUnsaved] = useState(false);

  /** 畫面改變後呼叫；hasPaint＝畫布上還有沒有顏色。 */
  const notePaint = useCallback((hasPaint: boolean) => {
    paintRevisionRef.current += 1;
    setUnsaved(hasPaint);
  }, []);

  const capture = useCallback(
    async (display: HTMLCanvasElement): Promise<ArtworkCapture> => {
      // 先記版本再 await：轉檔中途落的新筆觸不會被當成已存。
      const revision = paintRevisionRef.current;
      return {
        revision,
        snapshot: await canvasBlob(display),
        thumbnail: await canvasBlob(thumbnailCanvas(display)),
      };
    },
    [],
  );

  /** 這個版本沒存過才寫入；寫入失敗會丟錯，由呼叫端決定怎麼提示。 */
  const save = useCallback(
    async ({ snapshot, thumbnail, revision }: ArtworkCapture) => {
      if (savedRevisionRef.current === revision) return;
      const pending = pendingRef.current;
      if (pending?.revision === revision) return pending.promise;
      const promise = (async () => {
        await saveColoringArtwork({
          id: crypto.randomUUID(),
          pageId: page.id,
          title: page.title,
          lineArtRevision: page.lineArtRevision,
          createdAt: Date.now(),
          compositeBlob: snapshot,
          thumbnailBlob: thumbnail,
        });
        savedRevisionRef.current = revision;
        if (paintRevisionRef.current === revision) setUnsaved(false);
      })();
      pendingRef.current = { revision, promise };
      try {
        await promise;
      } finally {
        if (pendingRef.current?.promise === promise) pendingRef.current = null;
      }
    },
    [page.id, page.title, page.lineArtRevision],
  );

  /** 「開新稿」後同一張要能再收藏一次。 */
  const forgetSaved = useCallback(() => {
    savedRevisionRef.current = -1;
  }, []);

  return { unsaved, notePaint, capture, save, forgetSaved };
}
