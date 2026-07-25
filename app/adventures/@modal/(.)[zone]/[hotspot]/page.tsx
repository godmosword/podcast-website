import { notFound } from "next/navigation";
import HotspotModal from "@/components/universe/HotspotModal";
import { hotspotById } from "@/lib/universe/hotspot";

type Props = {
  params: Promise<{ zone: string; hotspot: string }>;
};

/** 攔截 `/adventures/[zone]/[hotspot]` → 以 modal 疊在島上（保活地圖）。 */
export default async function InterceptedHotspotModalPage({ params }: Props) {
  const { zone: zoneId, hotspot: hotspotId } = await params;
  const found = hotspotById(zoneId, hotspotId);
  if (!found) notFound();

  return (
    <HotspotModal zone={found.zone} hotspot={found.hotspot} mode="modal" />
  );
}
