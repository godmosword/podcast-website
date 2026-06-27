import type { ZoneId, ZoneStatus } from "@/data/universe-zones";
import ZoneLandmarkArt from "./ZoneLandmarkArt";

type Props = {
  zoneId: ZoneId;
  status?: ZoneStatus;
  /** 靜態 tile（SVG/PNG）；未設則 fallback inline SVG */
  artTile?: string;
  className?: string;
};

/** R2：優先靜態 artTile，否則 R1 inline SVG。 */
export default function ZoneLandmark({ zoneId, status = "open", artTile, className }: Props) {
  if (artTile) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={artTile}
        alt=""
        className={className}
        aria-hidden
        draggable={false}
        decoding="async"
      />
    );
  }
  return <ZoneLandmarkArt zoneId={zoneId} status={status} className={className} />;
}
