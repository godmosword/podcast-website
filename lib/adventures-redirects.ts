/** `/adventures?zone=id` → `/adventures/id`（永久相容）。 */
export function adventuresZoneQueryRedirects(): {
  source: string;
  has: { type: "query"; key: string; value: string }[];
  destination: string;
  permanent: boolean;
}[] {
  return [
    {
      source: "/adventures",
      has: [{ type: "query", key: "zone", value: "(?<zid>[a-z0-9-]+)" }],
      destination: "/adventures/:zid",
      permanent: true,
    },
  ];
}
