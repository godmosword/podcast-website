/** 新聽眾入門三集（首頁精選區）。 */
export const STARTER_EPISODE_SLUGS = ["ep-9", "racecar", "ambulance"] as const;

export type StarterEpisodeSlug = (typeof STARTER_EPISODE_SLUGS)[number];
