import {
  listCities,
  type Playground,
} from "@/data/playgrounds";
import {
  buildPlayMapQueryString,
  filterPlaygrounds,
  type PlaygroundFilter,
  type PlayMapQuery,
} from "@/lib/playgrounds-query";
import { isHighEnergy } from "@/lib/playground-context";

export const MIN_INDEXABLE_COLLECTION_SIZE = 5;

export const COLLECTION_FAMILIES = ["city", "free", "indoor"] as const;
export type CollectionFamily = (typeof COLLECTION_FAMILIES)[number];

type CollectionFilter = Pick<
  PlaygroundFilter,
  "city" | "freeOnly" | "indoorOnly"
>;

export type CollectionDefinition = {
  slug: string;
  city: string;
  cityDisplayName: string;
  family: CollectionFamily;
  filter: CollectionFilter;
  title: string;
  shortLabel: string;
};

const CITY_COLLECTIONS = [
  {
    slug: "keelung",
    city: "基隆市",
    cityDisplayName: "基隆",
    family: "city",
    filter: { city: "基隆市" },
    title: "基隆親子景點",
    shortLabel: "基隆",
  },
  {
    slug: "taipei",
    city: "台北市",
    cityDisplayName: "台北",
    family: "city",
    filter: { city: "台北市" },
    title: "台北親子景點",
    shortLabel: "台北",
  },
  {
    slug: "new-taipei",
    city: "新北市",
    cityDisplayName: "新北",
    family: "city",
    filter: { city: "新北市" },
    title: "新北親子景點",
    shortLabel: "新北",
  },
  {
    slug: "taoyuan",
    city: "桃園市",
    cityDisplayName: "桃園",
    family: "city",
    filter: { city: "桃園市" },
    title: "桃園親子景點",
    shortLabel: "桃園",
  },
  {
    slug: "hsinchu-city",
    city: "新竹市",
    cityDisplayName: "新竹",
    family: "city",
    filter: { city: "新竹市" },
    title: "新竹親子景點",
    shortLabel: "新竹市",
  },
  {
    slug: "hsinchu-county",
    city: "新竹縣",
    cityDisplayName: "新竹縣",
    family: "city",
    filter: { city: "新竹縣" },
    title: "新竹縣親子景點",
    shortLabel: "新竹縣",
  },
  {
    slug: "miaoli",
    city: "苗栗縣",
    cityDisplayName: "苗栗縣",
    family: "city",
    filter: { city: "苗栗縣" },
    title: "苗栗縣親子景點",
    shortLabel: "苗栗縣",
  },
  {
    slug: "taichung",
    city: "台中市",
    cityDisplayName: "台中",
    family: "city",
    filter: { city: "台中市" },
    title: "台中親子景點",
    shortLabel: "台中",
  },
  {
    slug: "changhua",
    city: "彰化縣",
    cityDisplayName: "彰化縣",
    family: "city",
    filter: { city: "彰化縣" },
    title: "彰化縣親子景點",
    shortLabel: "彰化縣",
  },
  {
    slug: "nantou",
    city: "南投縣",
    cityDisplayName: "南投縣",
    family: "city",
    filter: { city: "南投縣" },
    title: "南投縣親子景點",
    shortLabel: "南投縣",
  },
  {
    slug: "yunlin",
    city: "雲林縣",
    cityDisplayName: "雲林縣",
    family: "city",
    filter: { city: "雲林縣" },
    title: "雲林縣親子景點",
    shortLabel: "雲林縣",
  },
  {
    slug: "chiayi-county",
    city: "嘉義縣",
    cityDisplayName: "嘉義縣",
    family: "city",
    filter: { city: "嘉義縣" },
    title: "嘉義縣親子景點",
    shortLabel: "嘉義縣",
  },
  {
    slug: "tainan",
    city: "台南市",
    cityDisplayName: "台南",
    family: "city",
    filter: { city: "台南市" },
    title: "台南親子景點",
    shortLabel: "台南",
  },
  {
    slug: "kaohsiung",
    city: "高雄市",
    cityDisplayName: "高雄",
    family: "city",
    filter: { city: "高雄市" },
    title: "高雄親子景點",
    shortLabel: "高雄",
  },
] as const satisfies readonly CollectionDefinition[];

const FREE_COLLECTIONS = [
  {
    slug: "new-taipei-free",
    city: "新北市",
    cityDisplayName: "新北",
    family: "free",
    filter: { city: "新北市", freeOnly: true },
    title: "新北免費親子景點",
    shortLabel: "新北免費",
  },
  {
    slug: "taoyuan-free",
    city: "桃園市",
    cityDisplayName: "桃園",
    family: "free",
    filter: { city: "桃園市", freeOnly: true },
    title: "桃園免費親子景點",
    shortLabel: "桃園免費",
  },
  {
    slug: "hsinchu-city-free",
    city: "新竹市",
    cityDisplayName: "新竹",
    family: "free",
    filter: { city: "新竹市", freeOnly: true },
    title: "新竹免費親子景點",
    shortLabel: "新竹市免費",
  },
  {
    slug: "hsinchu-county-free",
    city: "新竹縣",
    cityDisplayName: "新竹縣",
    family: "free",
    filter: { city: "新竹縣", freeOnly: true },
    title: "新竹縣免費親子景點",
    shortLabel: "新竹縣免費",
  },
  {
    slug: "taichung-free",
    city: "台中市",
    cityDisplayName: "台中",
    family: "free",
    filter: { city: "台中市", freeOnly: true },
    title: "台中免費親子景點",
    shortLabel: "台中免費",
  },
] as const satisfies readonly CollectionDefinition[];

const INDOOR_COLLECTIONS = [] as const satisfies readonly CollectionDefinition[];

export const COLLECTION_DEFINITIONS = [
  ...CITY_COLLECTIONS,
  ...FREE_COLLECTIONS,
  ...INDOOR_COLLECTIONS,
] as const satisfies readonly CollectionDefinition[];

export const MIN_COLLECTION_DEFINITION_COUNT = 19;

const definitionsBySlug = new Map<string, CollectionDefinition>(
  COLLECTION_DEFINITIONS.map((definition) => [definition.slug, definition]),
);

const allDefinitions: readonly CollectionDefinition[] = COLLECTION_DEFINITIONS;

export type ResolvedCollection = {
  definition: CollectionDefinition;
  matchingCount: number;
  activeCount: number;
  freeCount: number;
  indoorCount: number;
  highEnergyCount: number;
  districtCount: number;
  typeCount: number;
  places: Playground[];
  mapQuery: PlayMapQuery;
  mapQueryString: string;
};

export function collectionPath(slug: string): string {
  return `/for-parents/play-map/collections/${encodeURIComponent(slug)}`;
}

export function getCollectionDefinition(
  slug: string,
): CollectionDefinition | undefined {
  return definitionsBySlug.get(slug);
}

export function listCollectionDefinitions(
  family?: CollectionFamily,
): readonly CollectionDefinition[] {
  if (!family) return allDefinitions;
  return allDefinitions.filter((definition) => definition.family === family);
}

export function collectionMapQuery(
  definition: CollectionDefinition,
): PlayMapQuery {
  return {
    city: definition.city,
    type: null,
    indoorOnly: definition.filter.indoorOnly ?? false,
    outdoorOnly: false,
    freeOnly: definition.filter.freeOnly ?? false,
    rainyDayOnly: false,
    parkingOnly: false,
    strollerFriendlyOnly: false,
    highEnergyOnly: false,
    view: "map",
  };
}

export function collectionMapPath(definition: CollectionDefinition): string {
  const query = buildPlayMapQueryString(collectionMapQuery(definition));
  return `/for-parents/play-map?${query}`;
}

export function collectionMapCtaLabel(
  definition: CollectionDefinition,
): string {
  const suffix =
    definition.family === "city"
      ? "景點"
      : definition.family === "free"
        ? "免費景點"
        : "室內景點";
  return `在地圖上看${definition.cityDisplayName}${suffix}`;
}

export function collectionConditionLabel(
  definition: CollectionDefinition,
): string {
  switch (definition.family) {
    case "city":
      return "親子景點";
    case "free":
      return "免費親子景點";
    case "indoor":
      return "室內親子景點";
  }
}

export function resolveCollection(
  definition: CollectionDefinition,
): ResolvedCollection {
  const matchingPlaces = filterPlaygrounds(definition.filter);
  const places = matchingPlaces.filter(
    (place) => place.status !== "temporarily-closed",
  );
  const districts = new Set(places.map((place) => place.district ?? place.city));
  const types = new Set(places.map((place) => place.type));
  const mapQuery = collectionMapQuery(definition);

  return {
    definition,
    matchingCount: matchingPlaces.length,
    activeCount: places.length,
    freeCount: places.filter((place) => place.free).length,
    indoorCount: places.filter((place) => place.indoor).length,
    highEnergyCount: places.filter(isHighEnergy).length,
    districtCount: districts.size,
    typeCount: types.size,
    places,
    mapQuery,
    mapQueryString: buildPlayMapQueryString(mapQuery),
  };
}

export function resolveCollectionBySlug(
  slug: string,
): ResolvedCollection | undefined {
  const definition = getCollectionDefinition(slug);
  if (!definition) return undefined;
  return resolveCollection(definition);
}

export function collectionDescription(
  resolved: ResolvedCollection,
): string {
  const { definition } = resolved;
  return `目前收錄 ${resolved.activeCount} 個${definition.cityDisplayName}${collectionConditionLabel(definition)}，涵蓋 ${resolved.districtCount} 個行政區、${resolved.typeCount} 種景點類型。`;
}

export function collectionParentSummary(
  resolved: ResolvedCollection,
): string | null {
  const { definition } = resolved;
  if (definition.family === "city") return null;

  const parentDefinition = allDefinitions.find(
    (candidate) =>
      candidate.family === "city" && candidate.city === definition.city,
  );
  if (!parentDefinition) return null;

  const parent = resolveCollection(parentDefinition);
  const condition =
    definition.family === "free"
      ? `${resolved.activeCount} 個不用門票`
      : `${resolved.activeCount} 個室內選擇`;
  const summary = `${parentDefinition.cityDisplayName}目前 ${parent.activeCount} 個親子景點中，有 ${condition}。`;

  if (
    definition.family === "free" &&
    resolved.places.length > 0 &&
    resolved.places.every((place) => !place.indoor)
  ) {
    return `${summary}目前這 ${resolved.activeCount} 個免費選擇都是戶外景點。`;
  }

  return summary;
}

export function isCollectionIndexable(
  resolved: ResolvedCollection,
): boolean {
  return resolved.activeCount >= MIN_INDEXABLE_COLLECTION_SIZE;
}

export function relatedCollections(
  definition: CollectionDefinition,
): CollectionDefinition[] {
  const sameCity = allDefinitions.filter(
    (candidate) => candidate.city === definition.city && candidate.slug !== definition.slug,
  );

  if (definition.family === "city") {
    return sameCity.filter((candidate) => candidate.family !== "city").slice(0, 2);
  }

  const cityCollection = sameCity.find((candidate) => candidate.family === "city");
  const otherVariant = sameCity.find(
    (candidate) => candidate.family !== "city" && candidate.family !== definition.family,
  );
  return [cityCollection, otherVariant].filter(
    (candidate): candidate is CollectionDefinition => Boolean(candidate),
  );
}

function canonicalActivePlaceIdSet(places: readonly Playground[]): string {
  return JSON.stringify(
    [...new Set(places.map((place) => place.id))].sort(),
  );
}

export function validateCollectionDefinitions(
  definitions: readonly CollectionDefinition[] = COLLECTION_DEFINITIONS,
): string[] {
  const issues: string[] = [];
  const slugs = new Set<string>();
  const resultSets = new Map<string, string>();
  const cities = new Set(listCities());

  if (definitions.length !== MIN_COLLECTION_DEFINITION_COUNT) {
    issues.push(
      `expected ${MIN_COLLECTION_DEFINITION_COUNT} collection definitions, got ${definitions.length}`,
    );
  }

  const resolvedDefinitions = definitions.map((definition) => ({
    definition,
    resolved: resolveCollection(definition),
  }));

  for (const { definition, resolved } of resolvedDefinitions) {
    if (slugs.has(definition.slug)) {
      issues.push(`duplicate collection slug: ${definition.slug}`);
    }
    slugs.add(definition.slug);

    if (!cities.has(definition.city)) {
      issues.push(`unknown collection city: ${definition.slug} → ${definition.city}`);
    }

    if (!isCollectionIndexable(resolved)) {
      issues.push(
        `${definition.slug} has ${resolved.activeCount} active places; minimum is ${MIN_INDEXABLE_COLLECTION_SIZE}`,
      );
      continue;
    }

    const resultKey = canonicalActivePlaceIdSet(resolved.places);
    const parentCity = resolvedDefinitions.find(
      ({ definition: candidateDefinition }) =>
        candidateDefinition.family === "city" &&
        candidateDefinition.city === definition.city,
    );
    if (
      definition.family !== "city" &&
      parentCity &&
      isCollectionIndexable(parentCity.resolved) &&
      canonicalActivePlaceIdSet(parentCity.resolved.places) === resultKey
    ) {
      issues.push(
        `${definition.slug} has an identical active place ID set to parent city collection ${parentCity.definition.slug}`,
      );
    }

    const duplicateOf = resultSets.get(resultKey);
    if (duplicateOf) {
      issues.push(
        `${definition.slug} has an identical active place ID set to launch collection ${duplicateOf}`,
      );
    } else {
      resultSets.set(resultKey, definition.slug);
    }
  }

  return issues;
}

export function assertCollectionDefinitions(): void {
  const issues = validateCollectionDefinitions();
  if (issues.length > 0) {
    throw new Error(`Invalid Play Map collection registry:\n- ${issues.join("\n- ")}`);
  }
}
