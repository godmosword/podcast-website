# Product Surface Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 刪除未啟用功能、佔位 UI、沒有資料來源的內容抽象與 deprecated API，同時保留目前實際上線的故事、主題、收藏、夜間模式、反思提問、Studio 捷徑與四款遊戲。

**Architecture:** 將目前永遠開啟的 night mode／reflection prompt 固化為正式功能，將首頁收斂為三個真實 section，將內容模型收斂為 Story-only API。以 repository architecture test 鎖住已刪 symbols，並以 build、單元測試與 route smoke test 驗證沒有可見功能回歸。

**Tech Stack:** Next.js 15、React 19、TypeScript、Vitest、Playwright

**Commit policy:** 此 repo 預設不 commit。各 task 以 `git diff --check` 和測試作 checkpoint；只有使用者另行要求時才 commit。

---

### Task 1: Add product-surface architecture guard

**Files:**
- Create: `scripts/lib/repository-architecture.test.ts`

- [ ] **Step 1: Write the failing architecture test**

Create:

```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function source(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("repository architecture", () => {
  it("does not keep retired product feature symbols", () => {
    const files = [
      "app/layout.tsx",
      "app/story/[slug]/page.tsx",
      "app/story/[slug]/play/page.tsx",
      "components/StoryPlayer.tsx",
      "components/ThemeProvider.tsx",
      "components/ThemeModeSwitch.tsx",
      "components/story-filtering.ts",
      "components/games/GameResultActions.tsx",
      "components/home/HomeSectionRenderer.tsx",
      "data/content.ts",
      "data/home-sections.ts",
    ];
    const combined = files.filter(existsSync).map(source).join("\n");

    for (const retired of [
      "FEATURES.",
      "goodnightButton",
      "CraftStep",
      "Printable",
      "getAllContent",
      "filterStoriesForVehicle",
      "toggleTheme",
      "subscribeBand",
    ]) {
      expect(combined).not.toContain(retired);
    }
  });

  it("does not keep retired placeholder modules", () => {
    for (const path of [
      "components/ContinueBanner.tsx",
      "components/ContinueBanner.module.css",
      "components/StarterEpisodes.tsx",
      "components/StarterEpisodes.module.css",
      "data/starter-episodes.ts",
      "data/starter-episodes.test.ts",
      "components/studio/MetricsOverview.tsx",
      "components/studio/MetricsOverview.module.css",
      "data/studio-metrics.json",
      "lib/studio/metrics.ts",
      "lib/studio/types.ts",
      "lib/games/catalog.ts",
    ]) {
      expect(existsSync(join(ROOT, path)), path).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run the guard and verify it fails for the intended legacy surface**

Run:

```bash
npx vitest run scripts/lib/repository-architecture.test.ts
```

Expected: FAIL because retired symbols and modules still exist.

### Task 2: Promote enabled features and remove feature flags

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/story/[slug]/page.tsx`
- Modify: `app/story/[slug]/play/page.tsx`
- Modify: `components/StoryPlayer.tsx`
- Modify: `components/ThemeModeSwitch.tsx`
- Modify: `components/ThemeProvider.tsx`
- Modify: `components/games/GameResultActions.tsx`
- Delete: `lib/features.ts`
- Delete: `lib/features.test.ts`

- [ ] **Step 1: Make night mode unconditional**

Apply these behavioral replacements:

```tsx
<head>
  <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
</head>
<body>
  <ThemeProvider>
```

Remove `FEATURES` from `app/layout.tsx`. In `ThemeModeSwitch`, remove the flag import and early return so it always returns:

```tsx
return <ThemeToggle textOnly />;
```

In `ThemeProvider`:

- remove the `FEATURES` import;
- remove the `nightModeEnabled` prop;
- always resolve, persist, subscribe, set, and cycle the selected theme;
- remove deprecated `toggleTheme` from `ThemeContextValue`, `value`, and dependency arrays.

- [ ] **Step 2: Make reflection prompts unconditional**

In story detail:

```tsx
{story.reflectionPrompt && (
  <ReflectionPrompt
    slug={story.slug}
    child={story.reflectionPrompt.child}
    parentFollowUp={story.reflectionPrompt.parentFollowUp}
    accent={story.color}
  />
)}
```

In the play route:

```tsx
reflectionPrompt={story.reflectionPrompt}
```

In `StoryPlayer`, replace both `FEATURES.reflectionPrompt && reflectionPrompt` and `FEATURES.nightMode && ...` conditions with the underlying runtime condition only.

- [ ] **Step 3: Remove the disabled goodnight action**

Replace `GameResultActionsProps` with:

```ts
export type GameResultActionsProps = {
  onReplay: () => void;
  replayLabel: ReactNode;
  replayStyle?: CSSProperties;
  replayClassName?: string;
  extraActions?: ReactNode;
  className?: string;
};
```

Remove the feature import, goodnight destructuring defaults, and conditional goodnight button. Keep replay and `extraActions`.

- [ ] **Step 4: Delete the feature framework**

Delete:

```text
lib/features.ts
lib/features.test.ts
```

- [ ] **Step 5: Verify feature cleanup**

Run:

```bash
rg -n "FEATURES\\.|goodnightButton|toggleTheme|NEXT_PUBLIC_FEATURE_" app components hooks lib data
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
npx vitest run lib/theme.test.ts data/content.test.ts scripts/lib/repository-architecture.test.ts
```

Expected: no retired feature matches; TypeScript passes; architecture test may still fail only on later-task modules.

### Task 3: Collapse the home section registry

**Files:**
- Modify: `data/home-sections.ts`
- Modify: `data/home-sections.test.ts`
- Modify: `components/home/HomeSectionRenderer.tsx`
- Delete: `components/ContinueBanner.tsx`
- Delete: `components/ContinueBanner.module.css`
- Delete: `components/StarterEpisodes.tsx`
- Delete: `components/StarterEpisodes.module.css`
- Delete: `data/starter-episodes.ts`
- Delete: `data/starter-episodes.test.ts`

- [ ] **Step 1: Replace the registry with the actual three sections**

Use:

```ts
export const HOME_SECTION_IDS = [
  "latestHero",
  "favorites",
  "storyFilter",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];
```

Delete `HomeSectionDef`, `enabled`, `isHomeSectionActive()`, and feature coupling.

- [ ] **Step 2: Simplify the renderer**

Remove `ContinueBanner`, `StarterEpisodes`, `FEATURES`, and `isHomeSectionActive` imports. Render:

```tsx
{HOME_SECTION_IDS.map((id) => (
  <Fragment key={id}>{renderSection(id, props)}</Fragment>
))}
```

The switch must have only `latestHero`, `favorites`, and `storyFilter`.

- [ ] **Step 3: Replace registry tests**

Use:

```ts
import { describe, expect, it } from "vitest";
import { HOME_SECTION_IDS } from "./home-sections";

describe("home-sections", () => {
  it("contains only the three rendered homepage sections", () => {
    expect(HOME_SECTION_IDS).toEqual([
      "latestHero",
      "favorites",
      "storyFilter",
    ]);
  });
});
```

- [ ] **Step 4: Delete retired section modules**

Delete the six component/data files listed above.

- [ ] **Step 5: Verify the homepage section surface**

Run:

```bash
rg -n "ContinueBanner|StarterEpisodes|starter-episodes|subscribeBand|\"continue\"|\"starter\"" app components data lib
npx vitest run data/home-sections.test.ts
```

Expected: no retired references; Vitest reports `data/home-sections.test.ts` passing and no starter test file collected.

### Task 4: Collapse the content model to Story

**Files:**
- Modify: `data/content.ts`
- Modify: `data/content.test.ts`
- Modify: `app/story/[slug]/page.tsx`
- Modify: `app/story/[slug]/play/page.tsx`
- Modify: `app/sitemap.ts`
- Modify: `components/FavoritesSection.tsx`

- [ ] **Step 1: Remove unused content union types**

Delete:

```ts
export type CraftStep = { image: string; voiceLine: string };
export type Craft = ContentBase & { kind: "craft"; steps: CraftStep[]; materials?: string[] };
export type Printable = ContentBase & { kind: "printable"; pdfUrl: string; pageCount?: number };
export type Content = Story | Craft | Printable;
```

Delete `getAllContent()`.

- [ ] **Step 2: Remove the deprecated `stories` alias**

Delete:

```ts
export const stories = storyList;
```

Replace consumers:

```ts
const stories = getStories();
```

Use `getStories()` inside `generateStaticParams()`, sitemap story mapping, and favorites count.

- [ ] **Step 3: Rewrite content tests around the public Story API**

Use:

```ts
import { describe, expect, it } from "vitest";
import { getStories, getStory, storiesByNewest } from "./content";

describe("story content", () => {
  it("contains manual and Apple-synced stories", () => {
    const stories = getStories();
    expect(stories.length).toBeGreaterThanOrEqual(11);
    expect(stories.every((story) => story.kind === "story")).toBe(true);
  });

  it("enriches manual stories with reflection prompts", () => {
    expect(getStory("ep-6")?.reflectionPrompt?.child).toContain("幫忙");
  });

  it("resolves canonical and legacy slugs", () => {
    expect(getStory("ep-1")?.title).toContain("電動車");
    expect(getStory("ev")?.slug).toBe("ep-1");
  });

  it("sorts newest first", () => {
    const sorted = storiesByNewest();
    expect(sorted[0].ep).toBeGreaterThanOrEqual(sorted[1]?.ep ?? 0);
  });
});
```

- [ ] **Step 4: Verify Story-only API**

Run:

```bash
rg -n "\\b(CraftStep|Craft|Printable|Content|getAllContent)\\b|import .*\\bstories\\b.*@/data/content" app components data lib
npx vitest run data/content.test.ts data/stories.test.ts
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
```

Expected: no retired content API references; tests and TypeScript pass.

### Task 5: Remove deprecated filtering and game catalog compatibility

**Files:**
- Modify: `components/story-filtering.ts`
- Modify: `components/story-filtering.test.ts`
- Modify: `components/games/GameLoadingGate.tsx`
- Modify: `components/games/GameThumbArt.tsx`
- Modify: `lib/games/catalog.test.ts`
- Delete: `lib/games/catalog.ts`

- [ ] **Step 1: Remove `filterStoriesForVehicle`**

Delete the deprecated function and its dedicated describe block. Keep the four `filterStories` behavior tests.

- [ ] **Step 2: Use canonical game metadata**

In `GameLoadingGate`:

```ts
import { GAMES } from "@/data/games";

const title =
  LABELS[gameId] ?? GAMES.find((game) => game.slug === gameId)?.title ?? "小遊戲";
```

In `GameThumbArt`:

```ts
import type { GameMeta } from "@/data/games";

type Props = {
  gameId: GameMeta["slug"];
  className?: string;
  style?: CSSProperties;
};
```

- [ ] **Step 3: Delete the catalog adapter and rewrite tests**

Delete `lib/games/catalog.ts`. In `lib/games/catalog.test.ts`, import only `GAMES` from `data/games`; use `game.slug` for retired IDs and `game.href` for retired routes.

- [ ] **Step 4: Verify deprecated API removal**

Run:

```bash
rg -n "filterStoriesForVehicle|GameCatalogEntry|@/lib/games/catalog|\\.id === gameId" app components data hooks lib
npx vitest run components/story-filtering.test.ts lib/games/catalog.test.ts
```

Expected: no deprecated API references; tests pass.

### Task 6: Remove placeholder Games and Studio UI

**Files:**
- Modify: `app/games/page.tsx`
- Modify: `app/games/page.module.css`
- Modify: `app/studio/page.tsx`
- Modify: `app/studio/page.module.css`
- Delete: `components/studio/MetricsOverview.tsx`
- Delete: `components/studio/MetricsOverview.module.css`
- Delete: `data/studio-metrics.json`
- Delete: `lib/studio/metrics.ts`
- Delete: `lib/studio/types.ts`

- [ ] **Step 1: Show every real game without a fake explore section**

Remove `gamesByAgeBand` from imports and replace:

```ts
const challengeGames = gamesByAgeBand("challenge");
```

with direct rendering of `GAMES`. Replace the two zone sections with:

```tsx
<section className={styles.zone} aria-labelledby="games-available">
  <h2 id="games-available" className={styles.zoneTitle}>
    現在就能玩
  </h2>
  <ul className={styles.grid}>
    {GAMES.map((game, index) => (
      <GameCard key={game.slug} game={game} index={index} />
    ))}
  </ul>
</section>
```

Delete `.placeholderCard`, `.placeholderEmoji`, `.placeholderTitle`, and `.placeholderCopy` CSS.

- [ ] **Step 2: Remove planned Studio metrics**

Remove `MetricsOverview` import and render call. Change subtitle to:

```tsx
<p className={styles.subtitle}>
  製作團隊專用：集中各平台後台捷徑與此瀏覽器的互動驗收數據。
</p>
```

Delete the `studio-conversion-heading` section and `.future` CSS.

- [ ] **Step 3: Delete empty metric schema files**

Delete the five metrics component/data/lib files listed above.

- [ ] **Step 4: Verify no placeholder copy remains**

Run:

```bash
rg -n "製作中|規劃中|預留|MetricsOverview|studio-metrics|sync-studio-metrics" app components data lib
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
npm run build
```

Expected: source and README have no removed promises; TypeScript and build pass.

### Task 7: Prune unused public exports

**Files:**
- Modify only files reported by Knip whose export has no internal consumer

- [ ] **Step 1: Capture the Knip baseline**

Run:

```bash
npx --yes knip --reporter compact > /tmp/product-cleanup-knip.txt || true
sed -n '1,240p' /tmp/product-cleanup-knip.txt
```

- [ ] **Step 2: Remove product-layer unused exports**

Remove only these already-identified exports while leaving internal declarations when locally used:

```text
components/Chip.tsx: ChipButton
components/TopicSelect.tsx: ALL_TOPICS_VALUE
components/VehicleSelect.tsx: ALL_VEHICLES_VALUE
components/games/CandyMatchPieceArt.tsx: PieceXiaoHong, PieceTaxi, PieceBus, PieceLingLing, PieceDuoDuo
components/games/ClayIcons.tsx: IconTap, IconSwipeLR
components/games/GameChrome.tsx: useOpenGameSettings export (keep as private function)
data/characters.ts: CHARACTERS, getCharacter
data/episode-colors.ts: DEFAULT_EPISODE_COLOR
data/landing-segments.ts: getLandingSegmentById
data/reflection-prompts.ts: REFLECTION_PROMPTS
lib/connect-icons.tsx: LINE_ICON_PATH
lib/feed.ts: SITE_RSS_PATH
lib/games/candy-kart/tracks.ts: CANDY_KART_GRAND_PRIX_POINTS
lib/games/canvas-palette.ts: DEFAULT_CANVAS_PALETTE, readCanvasPalette
lib/games/car-adventure/levels.ts: buildLevel01Json through buildLevel06Json
lib/games/clay-svg.tsx: ClayWheel, ClayStar
lib/progress-store.ts: PROGRESS_SCHEMA_VERSION, setProgress, EngagementStore
lib/theme.ts: NIGHT_THEME_COLOR, LIGHT_THEME_COLOR, prefersDarkColorScheme,
  isThemeMode, isThemePreference, readThemeFromDocument, updateThemeColorMeta
```

Do not touch script-library exports in this task; CLI scripts may intentionally expose test seams.

- [ ] **Step 3: Re-run Knip and TypeScript**

Run:

```bash
npx --yes knip --reporter compact > /tmp/product-cleanup-knip-after.txt || true
for symbol in \
  ChipButton ALL_TOPICS_VALUE ALL_VEHICLES_VALUE PieceXiaoHong PieceTaxi \
  PieceBus PieceLingLing PieceDuoDuo IconTap IconSwipeLR \
  DEFAULT_EPISODE_COLOR getLandingSegmentById REFLECTION_PROMPTS \
  LINE_ICON_PATH SITE_RSS_PATH CANDY_KART_GRAND_PRIX_POINTS \
  DEFAULT_CANVAS_PALETTE readCanvasPalette PROGRESS_SCHEMA_VERSION setProgress
do
  if rg -n "\\b${symbol}\\b" /tmp/product-cleanup-knip-after.txt; then
    echo "Knip still reports ${symbol}" >&2
    exit 1
  fi
done
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
```

Expected: none of the explicitly removed product symbols remains in Knip output; TypeScript passes. Remaining script or Game Kit reports are handled by the next plan.

### Task 8: Update documentation and verify product cleanup

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `TODOS.md`
- Modify: `docs/REPOSITORY-AUDIT.md`

- [ ] **Step 1: Remove stale product promises**

Update:

- README Studio section to describe platform shortcuts and local engagement only.
- CHANGELOG with a new Unreleased bullet covering removed feature flags, placeholders, Story-only content, and deprecated APIs.
- TODOS references to ContinueBanner/starter/API metrics so they no longer describe removed work as current.
- Repository audit product architecture and removal list.

- [ ] **Step 2: Run the complete product-cleanup verification**

Run:

```bash
npx vitest run scripts/lib/repository-architecture.test.ts
npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false
npm test
npm run verify:episodes
npm run build
npm run test:e2e
git diff --check
git diff --name-only | rg '^(public/(stories|characters|landing|candy-kart)/|data/(apple-synced|apple-sync-state|apple-sync\\.defaults|stories)\\.(json|ts)|app/legal/|DISCLAIMER\\.md)$' && exit 1 || true
```

Expected: all tests/build/E2E pass; episode verifier has zero errors; no protected content path changed.
