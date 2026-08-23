import { Fragment, Suspense } from "react";
import type { Story } from "@/data/content";
import { HOME_SECTION_IDS, type HomeSectionId } from "@/data/home-sections";
import FavoritesSection from "@/components/FavoritesSection";
import LatestHero from "@/components/LatestHero";
import {
  StoryFilterFallback,
  StoryFilterFromUrl,
} from "@/components/StoryFilter";

export type HomeSectionProps = {
  latest: Story | undefined;
  listStories: Story[];
  featuredStorySlug: string | null;
  vehicles: string[];
  tags: string[];
};

function storyFilterProps(props: HomeSectionProps) {
  return {
    stories: props.listStories,
    vehicles: props.vehicles,
    tags: props.tags,
    featuredStorySlug: props.featuredStorySlug,
  };
}

function renderSection(id: HomeSectionId, props: HomeSectionProps) {
  switch (id) {
    case "latestHero":
      return props.latest ? <LatestHero story={props.latest} /> : null;
    case "favorites":
      return <FavoritesSection />;
    case "storyFilter": {
      const filterProps = storyFilterProps(props);
      return (
        <Suspense fallback={<StoryFilterFallback {...filterProps} />}>
          <StoryFilterFromUrl {...filterProps} />
        </Suspense>
      );
    }
    default:
      return null;
  }
}

export function HomeSectionList({ props }: { props: HomeSectionProps }) {
  return (
    <>
      {HOME_SECTION_IDS.map((id) => (
        <Fragment key={id}>
          {renderSection(id, props)}
        </Fragment>
      ))}
    </>
  );
}
