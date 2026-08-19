/**
 * Playground／合輯 census。只讀 `data/playgrounds.ts` 與 production registry，
 * 不發明場地、不新增 route。數字以這個模組為準，不要抄舊 audit。
 */
import { getStory } from "@/data/content";
import {
  listCities,
  listPlaygrounds,
  PLAYGROUND_TYPES,
  type Playground,
  type PlaygroundType,
} from "@/data/playgrounds";
import {
  COLLECTION_DEFINITIONS,
  MIN_INDEXABLE_COLLECTION_SIZE,
  type CollectionDefinition,
  type CollectionFamily,
} from "@/lib/playground-collections";
import {
  isHighEnergy,
  isOutdoorPlace,
  isRainyDayFriendly,
} from "@/lib/playground-context";
import { filterPlaygrounds } from "@/lib/playgrounds-query";

/** 與 `data/playgrounds.test.ts` 同一條設施列舉尾句。 */
export const FACILITY_LIST_TAIL_PATTERN = /\s*(?:場|園|館)內有[^。]*。\s*$/;

export const CANDIDATE_FAMILIES = [
  "city",
  "free",
  "indoor",
  "rainy-day",
] as const;
export type CandidateFamily = (typeof CANDIDATE_FAMILIES)[number];

export const HIGH_INTENT_CANDIDATE_SLUGS = [
  "taoyuan-indoor",
  "kaohsiung-free",
  "chiayi-city",
  "taipei-free",
  "taipei-indoor",
  "new-taipei-indoor",
  "tainan-indoor",
  "kaohsiung-indoor",
] as const;

/**
 * 縣市 → 合輯 slug。嘉義市沒有 production city collection，
 * `chiayi-city` 只是對帳用 candidate id，不是新 route。
 */
export const PLAYGROUND_CITY_SLUGS: Readonly<Record<string, string>> = {
  基隆市: "keelung",
  台北市: "taipei",
  新北市: "new-taipei",
  桃園市: "taoyuan",
  新竹市: "hsinchu-city",
  新竹縣: "hsinchu-county",
  苗栗縣: "miaoli",
  台中市: "taichung",
  彰化縣: "changhua",
  南投縣: "nantou",
  雲林縣: "yunlin",
  嘉義市: "chiayi-city",
  嘉義縣: "chiayi-county",
  台南市: "tainan",
  高雄市: "kaohsiung",
  屏東縣: "pingtung",
  宜蘭縣: "yilan",
  花蓮縣: "hualien",
  台東縣: "taitung",
  澎湖縣: "penghu",
  金門縣: "kinmen",
  連江縣: "lienchiang",
};

export const PLAYGROUND_STATUS_SEMANTICS = {
  operatingMeans: "status field omitted",
  closedValue: "temporarily-closed",
  hasOpenClosedEnum: false,
} as const;

export type TypeDistribution = Record<PlaygroundType, number>;

export type GlobalBaseline = {
  total: number;
  operating: number;
  temporarilyClosed: number;
  cities: number;
  districts: number;
  typeDistribution: TypeDistribution;
  free: number;
  paid: number;
  indoor: number;
  outdoor: number;
};

export type CityBaseline = {
  city: string;
  slug: string;
  total: number;
  operating: number;
  temporarilyClosed: number;
  freeActive: number;
  paidActive: number;
  indoorActive: number;
  outdoorActive: number;
  rainyActive: number;
  highEnergyActive: number;
  districtCount: number;
  typeCount: number;
  hasLaunchedCityCollection: boolean;
};

export type LaunchRegistry = {
  total: number;
  cityCount: number;
  freeCount: number;
  indoorCount: number;
  otherFamilyCount: number;
  slugs: string[];
  citySlugs: string[];
  freeSlugs: string[];
  indoorSlugs: string[];
  unlaunchedCitySlugs: string[];
};

export type ThresholdContract = {
  minimumActiveCount: number;
  usesActiveCount: boolean;
  excludesTemporarilyClosed: boolean;
  matchingCountIncludesTemporarilyClosed: boolean;
  appliesTo: readonly string[];
};

export type CollectionCandidate = {
  slug: string;
  city: string;
  family: CandidateFamily;
  matchingTotal: number;
  activeCount: number;
  activePlaceIds: string[];
  thresholdReached: boolean;
  currentlyLaunched: boolean;
  exactDuplicateOfParent: boolean;
  overlapWithParentCity: {
    parentSlug: string;
    parentActiveCount: number;
    overlapCount: number;
    identical: boolean;
  };
};

export type DuplicatePair = {
  slugA: string;
  slugB: string;
  activePlaceIds: string[];
};

export type NearThresholdRow = {
  slug: string;
  city: string;
  family: CandidateFamily;
  currentActive: number;
  shortOf5: number;
  parentActive: number;
  overlap: number;
  exactDuplicate: boolean;
  currentlyLaunched: boolean;
  highIntent: boolean;
};

export type OptionalFieldStat = {
  present: number;
  missing: number;
  missingLikelyDebt: number;
  required: boolean;
};

export type OptionalFieldBaseline = {
  officialUrl: OptionalFieldStat;
  feeNote: OptionalFieldStat;
  coverageNote: OptionalFieldStat;
  mapsQuery: OptionalFieldStat;
  relatedEpisodes: OptionalFieldStat;
  placeId: OptionalFieldStat;
  sources: {
    single: number;
    twoOrMore: number;
    hasOfficial: number;
    hasGov: number;
    editorialOnly: number;
  };
  lastVerified: {
    min: string;
    max: string;
  };
};

export type PaidFeeClarity = {
  activePaid: number;
  paidWithFeeNote: number;
  paidWithoutFeeNote: number;
  paidWithOfficialUrl: number;
  paidWithoutOfficialUrl: number;
  paidWithoutFeeNoteIds: string[];
};

export type TipsDebtBaseline = {
  count: number;
  placeIds: string[];
  byCity: Record<string, number>;
  byType: Record<string, number>;
  batchA2SelectionRule: string;
};

export type RelatedEpisodesBaseline = {
  schema: "optional string[] of story slugs";
  recordsWithField: number;
  recordsWithLinks: number;
  totalLinks: number;
  uniqueSlugs: string[];
  missingStorySlugs: string[];
};

export type PlaygroundBaseline = {
  global: GlobalBaseline;
  cities: CityBaseline[];
  launchRegistry: LaunchRegistry;
  threshold: ThresholdContract;
  candidates: CollectionCandidate[];
  launchedExactDuplicates: DuplicatePair[];
  candidateExactDuplicates: DuplicatePair[];
  nearThreshold: NearThresholdRow[];
  optionalFields: OptionalFieldBaseline;
  paidFeeClarity: PaidFeeClarity;
  tipsDebt: TipsDebtBaseline;
  relatedEpisodes: RelatedEpisodesBaseline;
  invariantIssues: string[];
};

export function isActivePlayground(place: Playground): boolean {
  return place.status !== "temporarily-closed";
}

export function citySlugFor(city: string): string {
  const slug = PLAYGROUND_CITY_SLUGS[city];
  if (!slug) {
    throw new Error(`未登錄的 playground city slug：${city}`);
  }
  return slug;
}

export function candidateSlug(city: string, family: CandidateFamily): string {
  const citySlug = citySlugFor(city);
  if (family === "city") return citySlug;
  return `${citySlug}-${family}`;
}

function emptyTypeDistribution(): TypeDistribution {
  return Object.fromEntries(
    PLAYGROUND_TYPES.map((type) => [type, 0]),
  ) as TypeDistribution;
}

function canonicalIdKey(ids: readonly string[]): string {
  return JSON.stringify([...new Set(ids)].sort());
}

function launchedSlugSet(): Set<string> {
  return new Set(COLLECTION_DEFINITIONS.map((item) => item.slug));
}

function placesForCandidate(
  city: string,
  family: CandidateFamily,
): { matching: Playground[]; active: Playground[] } {
  const filter =
    family === "city"
      ? { city }
      : family === "free"
        ? { city, freeOnly: true }
        : family === "indoor"
          ? { city, indoorOnly: true }
          : { city, rainyDayOnly: true };
  const matching = filterPlaygrounds(filter);
  const active = matching.filter(isActivePlayground);
  return { matching, active };
}

function countBy<T extends string>(
  items: readonly T[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item] = (counts[item] ?? 0) + 1;
  }
  return counts;
}

function optionalStat(
  present: number,
  total: number,
  missingLikelyDebt: number,
  required: boolean,
): OptionalFieldStat {
  return {
    present,
    missing: total - present,
    missingLikelyDebt,
    required,
  };
}

function computeLaunchRegistry(cities: readonly CityBaseline[]): LaunchRegistry {
  const definitions: readonly CollectionDefinition[] = COLLECTION_DEFINITIONS;
  const cityDefs = definitions.filter((item) => item.family === "city");
  const freeDefs = definitions.filter((item) => item.family === "free");
  const indoorDefs = definitions.filter((item) => item.family === "indoor");
  const knownFamilies = new Set<CollectionFamily>(["city", "free", "indoor"]);
  const otherFamilyCount = definitions.filter(
    (item) => !knownFamilies.has(item.family),
  ).length;

  return {
    total: definitions.length,
    cityCount: cityDefs.length,
    freeCount: freeDefs.length,
    indoorCount: indoorDefs.length,
    otherFamilyCount,
    slugs: definitions.map((item) => item.slug),
    citySlugs: cityDefs.map((item) => item.slug),
    freeSlugs: freeDefs.map((item) => item.slug),
    indoorSlugs: indoorDefs.map((item) => item.slug),
    unlaunchedCitySlugs: cities
      .filter((row) => !row.hasLaunchedCityCollection)
      .map((row) => row.slug),
  };
}

function computeCandidates(
  cityRows: readonly CityBaseline[],
): CollectionCandidate[] {
  const launched = launchedSlugSet();
  const parentByCity = new Map(
    cityRows.map((row) => {
      const { active } = placesForCandidate(row.city, "city");
      return [row.city, active.map((place) => place.id)] as const;
    }),
  );

  return cityRows.flatMap((row) =>
    CANDIDATE_FAMILIES.map((family) => {
      const { matching, active } = placesForCandidate(row.city, family);
      const activePlaceIds = active.map((place) => place.id);
      const parentIds = parentByCity.get(row.city) ?? [];
      const parentSet = new Set(parentIds);
      const overlapCount = activePlaceIds.filter((id) => parentSet.has(id)).length;
      const identical =
        family !== "city" &&
        activePlaceIds.length > 0 &&
        activePlaceIds.length === parentIds.length &&
        overlapCount === parentIds.length;

      return {
        slug: candidateSlug(row.city, family),
        city: row.city,
        family,
        matchingTotal: matching.length,
        activeCount: active.length,
        activePlaceIds,
        thresholdReached: active.length >= MIN_INDEXABLE_COLLECTION_SIZE,
        currentlyLaunched: launched.has(candidateSlug(row.city, family)),
        exactDuplicateOfParent: identical,
        overlapWithParentCity: {
          parentSlug: candidateSlug(row.city, "city"),
          parentActiveCount: parentIds.length,
          overlapCount,
          identical,
        },
      };
    }),
  );
}

function duplicatePairs(
  rows: readonly { slug: string; activePlaceIds: readonly string[] }[],
): DuplicatePair[] {
  const groups = new Map<string, { slugs: string[]; ids: string[] }>();
  for (const row of rows) {
    if (row.activePlaceIds.length === 0) continue;
    const key = canonicalIdKey(row.activePlaceIds);
    const group = groups.get(key);
    if (group) {
      group.slugs.push(row.slug);
    } else {
      groups.set(key, {
        slugs: [row.slug],
        ids: [...row.activePlaceIds].sort(),
      });
    }
  }

  const pairs: DuplicatePair[] = [];
  for (const group of groups.values()) {
    if (group.slugs.length < 2) continue;
    const slugs = [...group.slugs].sort();
    for (let i = 0; i < slugs.length; i += 1) {
      for (let j = i + 1; j < slugs.length; j += 1) {
        pairs.push({
          slugA: slugs[i]!,
          slugB: slugs[j]!,
          activePlaceIds: group.ids,
        });
      }
    }
  }
  return pairs.sort(
    (a, b) => a.slugA.localeCompare(b.slugA) || a.slugB.localeCompare(b.slugB),
  );
}

function computeNearThreshold(
  candidates: readonly CollectionCandidate[],
): NearThresholdRow[] {
  const highIntent = new Set<string>(HIGH_INTENT_CANDIDATE_SLUGS);
  const selected = candidates.filter((row) => {
    if (highIntent.has(row.slug)) return true;
    if (row.family === "rainy-day") return false;
    if (row.currentlyLaunched) return false;
    return row.activeCount >= 3 && row.activeCount <= 4;
  });

  const bySlug = new Map(selected.map((row) => [row.slug, row]));
  const orderedSlugs = [
    ...HIGH_INTENT_CANDIDATE_SLUGS,
    ...selected
      .map((row) => row.slug)
      .filter((slug) => !highIntent.has(slug))
      .sort(),
  ];

  return orderedSlugs.map((slug) => {
    const row = bySlug.get(slug);
    if (!row) {
      throw new Error(`near-threshold 缺少 candidate：${slug}`);
    }
    return {
      slug: row.slug,
      city: row.city,
      family: row.family,
      currentActive: row.activeCount,
      shortOf5: Math.max(0, MIN_INDEXABLE_COLLECTION_SIZE - row.activeCount),
      parentActive: row.overlapWithParentCity.parentActiveCount,
      overlap: row.overlapWithParentCity.overlapCount,
      exactDuplicate: row.exactDuplicateOfParent,
      currentlyLaunched: row.currentlyLaunched,
      highIntent: highIntent.has(row.slug),
    };
  });
}

function computeOptionalFields(places: readonly Playground[]): OptionalFieldBaseline {
  const total = places.length;
  const officialUrlPresent = places.filter((place) => place.officialUrl).length;
  const feeNotePresent = places.filter((place) => place.feeNote).length;
  const coveragePresent = places.filter((place) => place.coverageNote).length;
  const mapsQueryPresent = places.filter((place) => place.mapsQuery).length;
  const relatedPresent = places.filter(
    (place) => (place.relatedEpisodes?.length ?? 0) > 0,
  ).length;
  const placeIdPresent = places.filter((place) => place.placeId).length;

  const paidMissingOfficialUrl = places.filter(
    (place) => isActivePlayground(place) && !place.free && !place.officialUrl,
  ).length;
  const paidMissingFeeNote = places.filter(
    (place) => isActivePlayground(place) && !place.free && !place.feeNote,
  ).length;

  const dates = places.map((place) => place.lastVerified).sort();

  return {
    officialUrl: optionalStat(
      officialUrlPresent,
      total,
      paidMissingOfficialUrl,
      false,
    ),
    feeNote: optionalStat(feeNotePresent, total, paidMissingFeeNote, false),
    coverageNote: optionalStat(coveragePresent, total, 0, false),
    mapsQuery: optionalStat(mapsQueryPresent, total, 0, false),
    relatedEpisodes: optionalStat(relatedPresent, total, 0, false),
    placeId: optionalStat(placeIdPresent, total, 0, false),
    sources: {
      single: places.filter((place) => place.sources.length === 1).length,
      twoOrMore: places.filter((place) => place.sources.length >= 2).length,
      hasOfficial: places.filter((place) =>
        place.sources.some((source) => source.kind === "official"),
      ).length,
      hasGov: places.filter((place) =>
        place.sources.some((source) => source.kind === "gov"),
      ).length,
      editorialOnly: places.filter((place) =>
        place.sources.every((source) => source.kind === "editorial"),
      ).length,
    },
    lastVerified: {
      min: dates[0] ?? "",
      max: dates[dates.length - 1] ?? "",
    },
  };
}

function computePaidFeeClarity(places: readonly Playground[]): PaidFeeClarity {
  const paid = places.filter(
    (place) => isActivePlayground(place) && !place.free,
  );
  const withoutFeeNote = paid.filter((place) => !place.feeNote);
  return {
    activePaid: paid.length,
    paidWithFeeNote: paid.filter((place) => Boolean(place.feeNote)).length,
    paidWithoutFeeNote: withoutFeeNote.length,
    paidWithOfficialUrl: paid.filter((place) => Boolean(place.officialUrl)).length,
    paidWithoutOfficialUrl: paid.filter((place) => !place.officialUrl).length,
    paidWithoutFeeNoteIds: withoutFeeNote.map((place) => place.id),
  };
}

function computeTipsDebt(places: readonly Playground[]): TipsDebtBaseline {
  const matches = places.filter((place) =>
    FACILITY_LIST_TAIL_PATTERN.test(place.tips),
  );
  return {
    count: matches.length,
    placeIds: matches.map((place) => place.id),
    byCity: countBy(matches.map((place) => place.city)),
    byType: countBy(matches.map((place) => place.type)),
    batchA2SelectionRule:
      "先改需購票或缺 feeNote 的場內有…尾句，再改室內館，最後才是免費公園；一次 10–15 筆，不要一次清全部。",
  };
}

function computeRelatedEpisodes(
  places: readonly Playground[],
): RelatedEpisodesBaseline {
  const withField = places.filter((place) => place.relatedEpisodes !== undefined);
  const links = withField.flatMap((place) => place.relatedEpisodes ?? []);
  const uniqueSlugs = [...new Set(links)].sort();
  return {
    schema: "optional string[] of story slugs",
    recordsWithField: withField.length,
    recordsWithLinks: withField.filter(
      (place) => (place.relatedEpisodes?.length ?? 0) > 0,
    ).length,
    totalLinks: links.length,
    uniqueSlugs,
    missingStorySlugs: uniqueSlugs.filter((slug) => !getStory(slug)),
  };
}

function invariantIssues(
  global: GlobalBaseline,
  cities: readonly CityBaseline[],
): string[] {
  const issues: string[] = [];
  if (global.operating + global.temporarilyClosed !== global.total) {
    issues.push("operating + temporarilyClosed !== total");
  }
  if (global.free + global.paid !== global.operating) {
    issues.push("free + paid !== operating");
  }
  if (global.indoor + global.outdoor !== global.operating) {
    issues.push("indoor + outdoor !== operating");
  }
  const sum = (key: keyof Pick<
    CityBaseline,
    "total" | "operating" | "freeActive" | "indoorActive"
  >) => cities.reduce((acc, row) => acc + row[key], 0);
  if (sum("total") !== global.total) issues.push("sum(city.total) !== global.total");
  if (sum("operating") !== global.operating) {
    issues.push("sum(city.operating) !== global.operating");
  }
  if (sum("freeActive") !== global.free) {
    issues.push("sum(city.freeActive) !== global.free");
  }
  if (sum("indoorActive") !== global.indoor) {
    issues.push("sum(city.indoorActive) !== global.indoor");
  }
  return issues;
}

export function computePlaygroundBaseline(): PlaygroundBaseline {
  const places = listPlaygrounds();
  const operatingPlaces = places.filter(isActivePlayground);
  const closedPlaces = places.filter((place) => !isActivePlayground(place));
  const typeDistribution = emptyTypeDistribution();
  for (const place of places) {
    typeDistribution[place.type] += 1;
  }

  const districts = new Set(
    places
      .map((place) => place.district)
      .filter((district): district is string => Boolean(district)),
  );

  const launchedCityByName = new Map<string, string>(
    COLLECTION_DEFINITIONS.filter((item) => item.family === "city").map(
      (item) => [item.city, item.slug],
    ),
  );

  const cities: CityBaseline[] = listCities().map((city) => {
    const cityPlaces = places.filter((place) => place.city === city);
    const active = cityPlaces.filter(isActivePlayground);
    const closed = cityPlaces.filter((place) => !isActivePlayground(place));
    const activeDistricts = new Set(
      active.map((place) => place.district ?? place.city),
    );
    const activeTypes = new Set(active.map((place) => place.type));
    return {
      city,
      slug: citySlugFor(city),
      total: cityPlaces.length,
      operating: active.length,
      temporarilyClosed: closed.length,
      freeActive: active.filter((place) => place.free).length,
      paidActive: active.filter((place) => !place.free).length,
      indoorActive: active.filter((place) => place.indoor).length,
      outdoorActive: active.filter((place) => isOutdoorPlace(place)).length,
      rainyActive: active.filter(isRainyDayFriendly).length,
      highEnergyActive: active.filter(isHighEnergy).length,
      districtCount: activeDistricts.size,
      typeCount: activeTypes.size,
      hasLaunchedCityCollection: launchedCityByName.has(city),
    };
  });

  const global: GlobalBaseline = {
    total: places.length,
    operating: operatingPlaces.length,
    temporarilyClosed: closedPlaces.length,
    cities: cities.length,
    districts: districts.size,
    typeDistribution,
    free: operatingPlaces.filter((place) => place.free).length,
    paid: operatingPlaces.filter((place) => !place.free).length,
    indoor: operatingPlaces.filter((place) => place.indoor).length,
    outdoor: operatingPlaces.filter((place) => isOutdoorPlace(place)).length,
  };

  const candidates = computeCandidates(cities);
  const launchedCandidates = candidates.filter((row) => row.currentlyLaunched);

  return {
    global,
    cities,
    launchRegistry: computeLaunchRegistry(cities),
    threshold: {
      minimumActiveCount: MIN_INDEXABLE_COLLECTION_SIZE,
      usesActiveCount: true,
      excludesTemporarilyClosed: true,
      matchingCountIncludesTemporarilyClosed: true,
      appliesTo: [
        "isCollectionIndexable",
        "validateCollectionDefinitions",
        "generateStaticParams / collection pages",
        "sitemap collection URLs (registry already filtered)",
      ],
    },
    candidates,
    launchedExactDuplicates: duplicatePairs(launchedCandidates),
    candidateExactDuplicates: duplicatePairs(candidates),
    nearThreshold: computeNearThreshold(candidates),
    optionalFields: computeOptionalFields(places),
    paidFeeClarity: computePaidFeeClarity(places),
    tipsDebt: computeTipsDebt(places),
    relatedEpisodes: computeRelatedEpisodes(places),
    invariantIssues: invariantIssues(global, cities),
  };
}
