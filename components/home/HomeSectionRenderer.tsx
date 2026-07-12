import { Fragment } from "react";
import type { Story } from "@/data/content";
import { HOME_SECTION_IDS, type HomeSectionId } from "@/data/home-sections";
import FavoritesSection from "@/components/FavoritesSection";
import LatestHero from "@/components/LatestHero";
import StoryFilter from "@/components/StoryFilter";

export type HomeSectionProps = {
  latest: Story | undefined;
  listStories: Story[];
  featuredStorySlug: string | null;
  vehicles: string[];
  tags: string[];
  initialVehicle: string | null;
  initialTag: string | null;
  initialQuery: string;
};

function renderSection(id: HomeSectionId, props: HomeSectionProps) {
  switch (id) {
    case "latestHero":
      return props.latest ? <LatestHero story={props.latest} /> : null;
    case "favorites":
      return <FavoritesSection />;
    case "storyFilter":
      return (
        <StoryFilter
          stories={props.listStories}
          vehicles={props.vehicles}
          tags={props.tags}
          featuredStorySlug={props.featuredStorySlug}
          initialVehicle={props.initialVehicle}
          initialTag={props.initialTag}
          initialQuery={props.initialQuery}
        />
      );
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
