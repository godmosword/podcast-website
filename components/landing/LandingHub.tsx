import { Suspense } from "react";
import JsonLd from "@/components/JsonLd";
import LandingScrollView from "@/components/landing/LandingScrollView";
import LandingSegment from "@/components/landing/LandingSegment";
import DuduCompanion from "@/components/landing/DuduCompanion";
import LandingEntryFocus from "@/components/landing/LandingEntryFocus";
import LandingBedtimeLayer from "@/components/landing/LandingBedtimeLayer";
import { DUDU_EMOTION_BY_SEGMENT } from "@/data/dudu-emotions";
import { homeSiteIntro } from "@/lib/home-geo";
import { resolveLandingSegments } from "@/lib/landing-query";
import { podcastSeriesJsonLd } from "@/lib/json-ld";
import scrollStyles from "./LandingScrollView.module.css";

export default function LandingHub() {
  const siteIntro = homeSiteIntro();
  const segments = resolveLandingSegments();
  const duduItems = segments.map((s) => ({
    anchorId: s.anchorId,
    emotion: DUDU_EMOTION_BY_SEGMENT[s.id],
  }));

  return (
    <>
      <h1 className="sr-only">車車遊樂園：親子故事與手作</h1>
      <JsonLd data={podcastSeriesJsonLd()} />
      <LandingEntryFocus />
      <LandingScrollView className={scrollStyles.root}>
        <LandingBedtimeLayer
          segmentEffects={segments.map((segment) => ({
            anchorId: segment.anchorId,
            hideMoon: Boolean(segment.hideBedtimeMoon),
            veil: segment.bedtimeVeil,
          }))}
        />

        {/* 選擇性 hydration：首段之外的三段與嘟嘟各包一層 Suspense。
            SSR HTML 一字不變（內容已在頁面裡，fallback 永遠不會顯示），差別是
            React 會把每個邊界排成獨立 task 來 hydrate，而不是整棵樹一次做完——
            6× CPU 下那一次做完是 178ms 的單一長任務。 */}
        {segments.map((segment, index) => {
          const node = (
            <LandingSegment
              key={segment.id}
              segment={segment}
              index={index}
              siteIntro={index === 0 ? siteIntro : undefined}
              nextAnchorId={
                segments[index + 1]?.anchorId ?? segments[0]!.anchorId
              }
              loopToFirst={index === segments.length - 1}
            />
          );
          return index === 0 ? (
            node
          ) : (
            <Suspense key={segment.id} fallback={null}>
              {node}
            </Suspense>
          );
        })}

        <Suspense fallback={null}>
          <DuduCompanion items={duduItems} />
        </Suspense>
      </LandingScrollView>
    </>
  );
}
