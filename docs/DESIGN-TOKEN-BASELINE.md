# 設計 token 採用率基準

> **這是基準，不是待辦清單。** 用來量測採用率；之後每次收斂重跑，四維度裸值必須單調下降。
>
> **spacing 分母在 2026-08-28 改過定義**（見下節）。改定義當日的裸值下降**不是**收斂成果，不可拿來跟歷史列直接相減。

- 產出日期：2026-08-28
- 量測對象：`origin/main` `d162334`
- 指令：`npm run audit:design-tokens`
- **本階段未做任何 CSS 變更。**

## spacing 分母定義變更（2026-08-28）

`DESIGN.md` 規定 `--space-*` 全是 px，rem 間距不得轉換成現有 space token（隨根字級縮放 vs 固定像素，見 `7325770` 還原）。

因此稽核自此次修訂起：

- spacing 採用率**只計 px 單位**的宣告
- rem 單位的間距**另列**為政策豁免，不進分母

在 `7325770`（第四階段 px 等值遷移之後、尚未改分母）用舊尺是 **35%（344 token / 644 裸值）**。改分母後同一份 CSS 是 **42%（342 token / 478 裸值）**，另有 **168 處 rem 間距豁免**。

這**不是進步，是把尺修準。** 168 處裡有 2 處 `calc(…rem… + var())` 舊尺因含 `var()` 被算成 token，現改豁免，所以 token 從 344 降到 342。規格估 165／344／479，差在這 2 處 calc 與 1 處邊界計數。

比對下方 `d162334` 歷史列（spacing 23%）時，須先知道當時分母含 rem。

---

# 設計 token 採用率

CSS modules：114

## 全站摘要

| 維度 | token | 裸值 | 採用率 |
|---|---:|---:|---:|
| font-size | 41 | 451 | 8% |
| border-radius | 108 | 208 | 34% |
| color | 850 | 182 | 82% |
| spacing | 225 | 763 | 23% |

font-size：41 token / 451 裸值 → 8%
border-radius：108 token / 208 裸值 → 34%
color：850 token / 182 裸值 → 82%
spacing：225 token / 763 裸值 → 23%

## 各檔案明細（依裸值總數降序）

| 檔案 | font-size | radius | color | spacing | 裸值合計 |
|---|---:|---:|---:|---:|---:|
| `components/StoryPlayer.module.css` | 19% (4/21) | 33% (8/24) | 17% (10/60) | 13% (6/45) | 122 |
| `components/for-parents/PlayMap.module.css` | 31% (15/48) | 47% (16/34) | 100% (111/111) | 40% (44/109) | 116 |
| `components/universe/ZoneSheet.module.css` | 0% (0/30) | 32% (6/19) | 81% (48/59) | 4% (2/50) | 102 |
| `app/for-parents/play-map/collections/[collectionSlug]/page.module.css` | 0% (0/14) | 33% (2/6) | 100% (19/19) | 5% (2/39) | 55 |
| `app/games/page.module.css` | 0% (0/13) | 38% (3/8) | 96% (25/26) | 16% (4/25) | 40 |
| `app/for-parents/play-map/[placeId]/page.module.css` | 8% (1/12) | 67% (4/6) | 100% (34/34) | 40% (17/42) | 38 |
| `components/for-parents/parent-dashboard.module.css` | 0% (0/11) | 57% (4/7) | 100% (21/21) | 0% (0/23) | 37 |
| `components/landing/LandingSegment.module.css` | 0% (0/11) | 0% (0/4) | 53% (8/15) | 17% (3/18) | 37 |
| `components/universe/ZoneIsland.module.css` | 0% (0/7) | 0% (0/8) | 13% (2/15) | 0% (0/8) | 36 |
| `components/SiteFooter.module.css` | 0% (0/12) | 25% (1/4) | 100% (14/14) | 20% (5/25) | 35 |
| `components/coloring/ColoringCanvas.module.css` | 0% (0/5) | 0% (0/7) | 14% (2/14) | 0% (0/8) | 32 |
| `components/coloring/ColoringPagePicker.module.css` | 0% (0/5) | 0% (0/6) | 29% (2/7) | 0% (0/16) | 32 |
| `components/games/GameChrome.module.css` | 0% (0/9) | 20% (1/5) | 94% (16/17) | 0% (0/18) | 32 |
| `components/landing/SiteNavBar.module.css` | 0% (0/6) | 14% (1/7) | 85% (29/34) | 17% (3/18) | 32 |
| `components/universe/HotspotLayer.module.css` | 0% (0/4) | 0% (0/5) | 0% (0/17) | 0% (0/6) | 32 |
| `app/for-parents/page.module.css` | 6% (1/16) | 75% (6/8) | 100% (28/28) | 57% (17/30) | 30 |
| `app/for-parents/play-map/collections/page.module.css` | 0% (0/10) | 50% (1/2) | 100% (13/13) | 11% (2/18) | 27 |
| `app/story/[slug]/page.module.css` | 10% (1/10) | 80% (4/5) | 100% (21/21) | 52% (16/31) | 25 |
| `components/games/GameIntro.module.css` | 0% (0/6) | 50% (2/4) | 83% (10/12) | 0% (0/15) | 25 |
| `components/universe/UniverseMap.module.css` | 0% (0/3) | 0% (0/3) | 0% (0/12) | 0% (0/6) | 24 |
| `components/games/CandyMatchView.module.css` | 0% (0/5) | 0% (0/3) | 69% (11/16) | 0% (0/8) | 21 |
| `components/universe/ZoneWishForm.module.css` | 0% (0/10) | 100% (6/6) | 100% (22/22) | 0% (0/11) | 21 |
| `components/coloring/ColoringToolbar.module.css` | 0% (0/2) | 0% (0/1) | 0% (0/9) | 0% (0/7) | 19 |
| `components/ThemeToggle.module.css` | 0% (0/5) | 0% (0/3) | 100% (17/17) | 0% (0/11) | 19 |
| `components/characters/CharacterCard.module.css` | 0% (0/7) | 75% (3/4) | 100% (16/16) | 0% (0/10) | 18 |
| `components/games/GameEndStation.module.css` | 0% (0/8) | 0% (0/1) | 100% (11/11) | 0% (0/9) | 18 |
| `components/studio/EngagementMetricsPanel.module.css` | 0% (0/6) | 0% (0/1) | 75% (3/4) | 0% (0/10) | 18 |
| `components/landing/SegmentNav.module.css` | 0% (0/1) | 0% (0/4) | 36% (4/11) | 17% (1/6) | 17 |
| `app/legal/page.module.css` | 0% (0/6) | 33% (1/3) | 100% (11/11) | 43% (6/14) | 16 |
| `components/ConnectHub.module.css` | 50% (2/4) | 33% (1/3) | 100% (8/8) | 0% (0/12) | 16 |
| `components/StoryCard.module.css` | 57% (4/7) | 50% (2/4) | 100% (4/4) | 21% (3/14) | 16 |
| `components/studio/PlatformStudioCard.module.css` | 0% (0/6) | 50% (2/4) | 100% (9/9) | 0% (0/8) | 16 |
| `components/FilterSelect.module.css` | 0% (0/5) | 0% (0/4) | 100% (11/11) | 0% (0/6) | 15 |
| `components/games/GameLoadOverlay.module.css` | 0% (0/4) | 33% (2/6) | 90% (9/10) | 0% (0/6) | 15 |
| `components/studio/IllustrationQueuePanel.module.css` | 0% (0/6) | 0% (0/1) | 80% (4/5) | 0% (0/7) | 15 |
| `components/universe/HotspotDetail.module.css` | 0% (0/6) | 0% (0/3) | 100% (6/6) | 0% (0/6) | 15 |
| `app/about/page.module.css` | 0% (0/5) | 0% (0/2) | 100% (9/9) | 46% (6/13) | 14 |
| `app/studio/page.module.css` | 0% (0/6) | — | 100% (4/4) | 11% (1/9) | 14 |
| `components/for-parents/ParentCoListenSection.module.css` | 0% (0/5) | 100% (2/2) | 100% (10/10) | 20% (2/10) | 13 |
| `components/for-parents/ParentGate.module.css` | 0% (0/6) | 75% (3/4) | 100% (10/10) | 0% (0/6) | 13 |
| `components/for-parents/PlayMapCollectionCard.module.css` | 0% (0/5) | 50% (1/2) | 100% (9/9) | 0% (0/7) | 13 |
| `components/landing/SubscribeMenu.module.css` | 0% (0/4) | 25% (1/4) | 100% (7/7) | 0% (0/6) | 13 |
| `components/SiteHeader.module.css` | 0% (0/4) | 50% (1/2) | 100% (5/5) | 0% (0/8) | 13 |
| `components/coloring/ColoringCover.module.css` | 0% (0/4) | 0% (0/1) | 71% (5/7) | 0% (0/5) | 12 |
| `components/games/GamePageShell.module.css` | 0% (0/4) | 50% (2/4) | 100% (10/10) | 67% (12/18) | 12 |
| `components/story/ShowNotes.module.css` | 0% (0/4) | 0% (0/1) | 100% (5/5) | 0% (0/7) | 12 |
| `components/SubscribeForm.module.css` | 0% (0/6) | 100% (3/3) | 100% (14/14) | 0% (0/6) | 12 |
| `components/universe/MapControls.module.css` | 0% (0/4) | 0% (0/3) | 100% (2/2) | 0% (0/5) | 12 |
| `app/characters/page.module.css` | 14% (1/7) | 100% (1/1) | 100% (10/10) | 50% (5/10) | 11 |
| `components/ParentTrustStrip.module.css` | 0% (0/2) | 0% (0/1) | 67% (6/9) | 0% (0/5) | 11 |
| `components/story/ReflectionPrompt.module.css` | 0% (0/4) | 0% (0/1) | 50% (1/2) | 0% (0/5) | 11 |
| `components/games/GamesHubProgress.module.css` | 0% (0/3) | 0% (0/2) | 100% (4/4) | 0% (0/5) | 10 |
| `components/PlatformLinks.module.css` | 0% (0/2) | 33% (1/3) | 100% (5/5) | 0% (0/6) | 10 |
| `app/topic/page.module.css` | 0% (0/5) | 50% (1/2) | 100% (11/11) | 67% (6/9) | 9 |
| `components/Chip.module.css` | 0% (0/3) | 0% (0/3) | 100% (9/9) | 0% (0/3) | 9 |
| `components/story/FamilyActivityCard.module.css` | 0% (0/3) | 0% (0/1) | 50% (1/2) | 0% (0/4) | 9 |
| `components/universe/IslandPickerStrip.module.css` | 0% (0/1) | 0% (0/2) | 60% (3/5) | 20% (1/5) | 9 |
| `app/topic/[tag]/page.module.css` | 0% (0/3) | 0% (0/1) | 100% (8/8) | 50% (4/8) | 8 |
| `app/vehicles/[vehicle]/page.module.css` | 0% (0/3) | 0% (0/1) | 100% (7/7) | 50% (4/8) | 8 |
| `components/coloring/ColoringPageShell.module.css` | 0% (0/2) | 0% (0/1) | 83% (5/6) | 0% (0/4) | 8 |
| `components/RelatedStories.module.css` | 0% (0/2) | 50% (1/2) | 100% (5/5) | 17% (1/6) | 8 |
| `components/StoryFilter.module.css` | 80% (4/5) | 67% (2/3) | 100% (9/9) | 57% (8/14) | 8 |
| `app/for-parents/dashboard/page.module.css` | 0% (0/3) | — | 100% (6/6) | 20% (1/5) | 7 |
| `app/not-found.module.css` | 0% (0/3) | 100% (1/1) | 100% (4/4) | 33% (2/6) | 7 |
| `components/for-parents/PlayMapCityWall.module.css` | 60% (3/5) | 50% (1/2) | 95% (18/19) | 63% (5/8) | 7 |
| `components/characters/CharacterCastBar.module.css` | 0% (0/1) | 0% (0/2) | 100% (4/4) | 0% (0/3) | 6 |
| `components/ShareButton.module.css` | 0% (0/1) | 0% (0/1) | 100% (6/6) | 0% (0/4) | 6 |
| `components/universe/HotspotModal.module.css` | 0% (0/1) | 100% (2/2) | 75% (3/4) | 20% (1/5) | 6 |
| `components/for-parents/PlayMapResults.module.css` | 33% (2/6) | 100% (1/1) | 100% (9/9) | 88% (7/8) | 5 |
| `components/games/GameJuiceToast.module.css` | 0% (0/2) | 0% (0/1) | 67% (2/3) | 0% (0/1) | 5 |
| `components/games/GameLoadingGate.module.css` | 0% (0/2) | 0% (0/1) | 100% (2/2) | 0% (0/2) | 5 |
| `components/PlayButton.module.css` | 0% (0/2) | 100% (2/2) | 100% (2/2) | 0% (0/3) | 5 |
| `components/StoryMeta.module.css` | 0% (0/1) | 0% (0/1) | 100% (4/4) | 0% (0/3) | 5 |
| `app/for-parents/play-map/page.module.css` | — | 0% (0/1) | 100% (4/4) | 40% (2/5) | 4 |
| `components/coloring/ColoringPalette.module.css` | — | 0% (0/1) | 0% (0/1) | 0% (0/2) | 4 |
| `components/decor/decor.module.css` | 0% (0/1) | 0% (0/1) | 100% (2/2) | 0% (0/2) | 4 |
| `components/dudu/DuduMoment.module.css` | 0% (0/1) | 0% (0/1) | 100% (1/1) | 0% (0/2) | 4 |
| `components/FavoritesSection.module.css` | 0% (0/2) | — | 100% (2/2) | 60% (3/5) | 4 |
| `components/games/GamePlayedMark.module.css` | 0% (0/1) | 0% (0/1) | 100% (2/2) | 0% (0/2) | 4 |
| `components/LatestHero.module.css` | 25% (1/4) | 67% (2/3) | 100% (3/3) | 100% (9/9) | 4 |
| `components/story/ZoneBadge.module.css` | 0% (0/1) | 0% (0/1) | 100% (7/7) | 0% (0/2) | 4 |
| `components/universe/IslandRoamerLayer.module.css` | — | 0% (0/2) | 33% (1/3) | — | 4 |
| `components/universe/RoamerGreeting.module.css` | 0% (0/1) | 0% (0/1) | 50% (1/2) | 0% (0/1) | 4 |
| `components/universe/RoamerVehicle.module.css` | — | 0% (0/2) | 0% (0/2) | — | 4 |
| `app/subscribe/page.module.css` | 33% (1/3) | 100% (1/1) | 100% (5/5) | 80% (4/5) | 3 |
| `components/StoryAge.module.css` | 0% (0/1) | 0% (0/1) | 100% (2/2) | 0% (0/1) | 3 |
| `components/SubscriptionCTA.module.css` | 0% (0/1) | 100% (1/1) | 100% (2/2) | 0% (0/2) | 3 |
| `components/universe/ZoneMotionPart.module.css` | — | 0% (0/3) | 100% (3/3) | — | 3 |
| `app/games/block-drop/page.module.css` | 0% (0/1) | — | 100% (1/1) | 50% (1/2) | 2 |
| `components/story/StoryDetailReflection.module.css` | 0% (0/1) | 100% (1/1) | 100% (3/3) | 50% (1/2) | 2 |
| `components/universe/NightFireworks.module.css` | — | 0% (0/1) | 100% (1/1) | 0% (0/1) | 2 |
| `app/stories/page.module.css` | 50% (1/2) | — | 100% (4/4) | 100% (5/5) | 1 |
| `components/characters/CharacterCatalogGrid.module.css` | — | — | — | 50% (1/2) | 1 |
| `components/FavoriteButton.module.css` | — | 0% (0/1) | 100% (5/5) | — | 1 |
| `components/games/CandyMatchBoard.module.css` | 0% (0/1) | — | — | — | 1 |
| `components/landing/LandingBedtimeLayer.module.css` | — | — | 50% (1/2) | — | 1 |
| `components/not-found/NotFoundHero.module.css` | — | — | — | 0% (0/1) | 1 |
| `components/story/StoryProgressBadge.module.css` | 0% (0/1) | — | — | — | 1 |
| `components/TopicIcon.module.css` | — | 0% (0/1) | — | — | 1 |
| `components/universe/MapRoamerLayer.module.css` | — | — | 0% (0/1) | — | 1 |
| `components/universe/StatusOverlay.module.css` | — | — | 0% (0/1) | — | 1 |
| `components/universe/ZoneNightLights.module.css` | — | 0% (0/1) | 100% (1/1) | — | 1 |
| `components/VehicleClayIcon.module.css` | — | 0% (0/1) | — | — | 1 |
| `app/page.module.css` | — | — | — | 100% (1/1) | 0 |
| `components/dudu/DuduSprite.module.css` | — | — | — | — | 0 |
| `components/landing/DuduCompanion.module.css` | — | — | — | — | 0 |
| `components/landing/LandingHub.module.css` | — | — | 100% (2/2) | 100% (1/1) | 0 |
| `components/landing/LandingScrollView.module.css` | — | — | — | — | 0 |
| `components/story/StoryCoverMorph.module.css` | — | — | — | — | 0 |
| `components/ui/IconButton.module.css` | — | 100% (1/1) | 100% (3/3) | — | 0 |
| `components/universe/MapDecorLayer.module.css` | — | — | — | — | 0 |
| `components/universe/SkyBodies.module.css` | — | — | 100% (1/1) | — | 0 |
| `components/universe/UniverseMapParallax.module.css` | — | — | — | — | 0 |
| `components/universe/ZoneMotionLayer.module.css` | — | — | — | — | 0 |

## 裸字級專表

共 82 種。rem 裸值出現 410 次；落在現有 5 token ±0.06rem 內 131 次（32%）。

| 次數 | 值 | 最近 token |
|---:|---|---|
| 52 | `0.95rem` | --fs-meta (0.78) +0.17 |
| 43 | `1rem` | --fs-h3-compact (1.15) -0.15 |
| 34 | `0.88rem` | --fs-meta (0.78) +0.1 |
| 33 | `0.9rem` | --fs-meta (0.78) +0.12 |
| 25 | `1.05rem` | --fs-h3-compact (1.15) -0.1 |
| 24 | `0.8rem` | --fs-meta (0.78) +0.02 |
| 21 | `0.92rem` | --fs-meta (0.78) +0.14 |
| 20 | `0.82rem` | --fs-meta (0.78) +0.04 |
| 17 | `0.85rem` | --fs-meta (0.78) +0.07 |
| 16 | `0.78rem` | --fs-meta (0.78) +0 |
| 11 | `0.86rem` | --fs-meta (0.78) +0.08 |
| 10 | `0.75rem` | --fs-meta (0.78) -0.03 |
| 8 | `0.72rem` | --fs-meta (0.78) -0.06 |
| 8 | `1.15rem` | --fs-h3-compact (1.15) +0 |
| 7 | `0.84rem` | --fs-meta (0.78) +0.06 |
| 7 | `1.2rem` | --fs-h3-compact (1.15) +0.05 |
| 6 | `0.98rem` | --fs-h3-compact (1.15) -0.17 |
| 5 | `1.25rem` | --fs-h3 (1.25) +0 |
| 5 | `1.85rem` | --fs-h1 (1.85) +0 |
| 4 | `1.1rem` | --fs-h3-compact (1.15) -0.05 |
| 4 | `12px` | --fs-meta (0.78) -0.03 |
| 3 | `1.02rem` | --fs-h3-compact (1.15) -0.13 |
| 3 | `1.35rem` | --fs-h2 (1.35) +0 |
| 3 | `1.3rem` | --fs-h3 (1.25) +0.05 |
| 3 | `1.45rem` | --fs-h2 (1.35) +0.1 |
| 3 | `1.4rem` | --fs-h2 (1.35) +0.05 |
| 3 | `1.55rem` | --fs-h2 (1.35) +0.2 |
| 3 | `11px` | --fs-meta (0.78) -0.09 |
| 3 | `13px` | --fs-meta (0.78) +0.03 |
| 2 | `0.68rem` | --fs-meta (0.78) -0.1 |
| 2 | `0.94rem` | --fs-meta (0.78) +0.16 |
| 2 | `0.96rem` | --fs-meta (0.78) +0.18 |
| 2 | `1.06rem` | --fs-h3-compact (1.15) -0.09 |
| 2 | `1.18rem` | --fs-h3-compact (1.15) +0.03 |
| 2 | `1.42rem` | --fs-h2 (1.35) +0.07 |
| 2 | `1.5rem` | --fs-h2 (1.35) +0.15 |
| 2 | `1.6rem` | --fs-h2 (1.35) +0.25 |
| 2 | `1.7rem` | --fs-h1 (1.85) -0.15 |
| 2 | `14px` | --fs-meta (0.78) +0.1 |
| 2 | `15px` | --fs-meta (0.78) +0.16 |
| 2 | `2.1rem` | --fs-h1 (1.85) +0.25 |
| 2 | `2.4rem` | --fs-h1 (1.85) +0.55 |
| 2 | `clamp(2rem, 4vw, 3rem)` | — |
| 1 | `0.72em` | — |
| 1 | `0.74rem` | --fs-meta (0.78) -0.04 |
| 1 | `0.76rem` | --fs-meta (0.78) -0.02 |
| 1 | `0.7rem` | --fs-meta (0.78) -0.08 |
| 1 | `0.87rem` | --fs-meta (0.78) +0.09 |
| 1 | `0.9375rem` | --fs-meta (0.78) +0.16 |
| 1 | `1.04rem` | --fs-h3-compact (1.15) -0.11 |
| 1 | `1.08rem` | --fs-h3-compact (1.15) -0.07 |
| 1 | `1.12rem` | --fs-h3-compact (1.15) -0.03 |
| 1 | `1.28rem` | --fs-h3 (1.25) +0.03 |
| 1 | `1.65rem` | --fs-h1 (1.85) -0.2 |
| 1 | `1.8rem` | --fs-h1 (1.85) -0.05 |
| 1 | `1.9rem` | --fs-h1 (1.85) +0.05 |
| 1 | `10px` | --fs-meta (0.78) -0.15 |
| 1 | `17px` | --fs-h3-compact (1.15) -0.09 |
| 1 | `18px` | --fs-h3-compact (1.15) -0.03 |
| 1 | `2.3rem` | --fs-h1 (1.85) +0.45 |
| 1 | `2.7rem` | --fs-h1 (1.85) +0.85 |
| 1 | `20px` | --fs-h3 (1.25) +0 |
| 1 | `24px` | --fs-h2 (1.35) +0.15 |
| 1 | `9px` | --fs-meta (0.78) -0.22 |
| 1 | `clamp(0.88rem, 2.4vw, 1.05rem)` | — |
| 1 | `clamp(0.92rem, 2.6vw, 1.05rem)` | — |
| 1 | `clamp(0.95rem, 1.8vw, 1.05rem)` | — |
| 1 | `clamp(0.98rem, 0.9rem + 0.6vw, 1.12rem)` | — |
| 1 | `clamp(0.98rem, 2vw, 1.12rem)` | — |
| 1 | `clamp(1.05rem, 2vw, 1.25rem)` | — |
| 1 | `clamp(1.12rem, 5.2vw, 1.45rem)` | — |
| 1 | `clamp(1.22rem, 4.8vw, 1.65rem)` | — |
| 1 | `clamp(1.2rem, 3.5vw, 1.45rem)` | — |
| 1 | `clamp(1.35rem, 3vw, 1.65rem)` | — |
| 1 | `clamp(1.35rem, 4.4vw, 2.35rem)` | — |
| 1 | `clamp(1.35rem, 4vw, 1.75rem)` | — |
| 1 | `clamp(1.3rem, 2.4vw, 1.6rem)` | — |
| 1 | `clamp(1.45rem, 4vw, 1.85rem)` | — |
| 1 | `clamp(1.6rem, 6vw, 2.1rem)` | — |
| 1 | `clamp(1.85rem, 6vw, 2.45rem)` | — |
| 1 | `clamp(2.1rem, 5.5vw, 3.4rem)` | — |
| 1 | `clamp(2rem, 6vw, 2.75rem)` | — |
