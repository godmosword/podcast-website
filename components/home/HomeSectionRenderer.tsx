import { Fragment } from "react";
import type { Story } from "@/data/content";
import {
  isHomeSectionActive,
  HOME_SECTIONS,
  type HomeSectionId,
} from "@/data/home-sections";
import { FEATURES } from "@/lib/features";
import ContinueBanner from "@/components/ContinueBanner";
import FavoritesSection from "@/components/FavoritesSection";
import LatestHero from "@/components/LatestHero";
import StarterEpisodes from "@/components/StarterEpisodes";
import StoryFilter from "@/components/StoryFilter";

export type HomeSectionProps = {
  latest: Story | undefined;
  listStories: Story[];
  featuredStorySlug: string | null;
  vehicles: string[];
  initialVehicle: string | null;
};

function renderSection(id: HomeSectionId, props: HomeSectionProps) {
  switch (id) {
    case "continue":
      return <ContinueBanner />;
    case "latestHero":
      return props.latest ? <LatestHero story={props.latest} /> : null;
    case "starter":
      return FEATURES.starterEpisodes ? <StarterEpisodes /> : null;
    case "subscribeBand":
      return null;
    case "favorites":
      return <FavoritesSection />;
    case "storyFilter":
      return (
        <StoryFilter
          stories={props.listStories}
          vehicles={props.vehicles}
          featuredStorySlug={props.featuredStorySlug}
          initialVehicle={props.initialVehicle}
        />
      );
    default:
      return null;
  }
}

export function HomeSectionList({ props }: { props: HomeSectionProps }) {
  return (
    <>
      {HOME_SECTIONS.filter(isHomeSectionActive).map((section) => (
        <Fragment key={section.id}>
          {renderSection(section.id, props)}
        </Fragment>
      ))}
    </>
  );
}
