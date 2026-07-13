import { ImageResponse } from "next/og";
import { MAP_STAGE, ZONES, ZONE_TERRAIN } from "@/data/universe-zones";
import {
  loadOgFont,
  OG_FONT_FAMILY,
  ogFontOptions,
} from "@/lib/og-font";

export const universeOgImageSize = { width: 1200, height: 630 };
export const universeOgContentType = "image/png";

const INK = "#34302b";
const INK_SOFT = "#7a7268";
const SEA = "#cfeaff";
const BRIDGE = "#c8a979";

const ZONE_OG_MARKS: Record<(typeof ZONES)[number]["id"], string> = {
  "car-park": "CAR",
  dino: "DINO",
  rescue: "HELP",
  ocean: "SEA",
  forest: "TREE",
};

/** `/adventures` 分享預覽：鳥瞰四島 + 標題。 */
export async function createUniverseOgImage() {
  const fontData = await loadOgFont();
  const w = universeOgImageSize.width;
  const h = universeOgImageSize.height;
  const pad = 56;
  const mapW = w - pad * 2;
  const mapH = h - pad * 2 - 48;
  const sx = mapW / MAP_STAGE.width;
  const sy = mapH / MAP_STAGE.height;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: OG_FONT_FAMILY,
          background: `linear-gradient(180deg, ${SEA} 0%, #b8e4ff 100%)`,
          padding: pad,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 28,
            left: pad,
            right: pad,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            fontWeight: 700,
            color: INK_SOFT,
          }}
        >
          <span>車車遊樂園</span>
          <span>宇宙地圖</span>
        </div>

        <div
          style={{
            position: "relative",
            flex: 1,
            marginTop: 36,
            borderRadius: 28,
            background: SEA,
            overflow: "hidden",
            boxShadow: "0 8px 0 #8ec4e8",
            display: "flex",
          }}
        >
          {ZONES.map((zone) => {
            const terrain = ZONE_TERRAIN[zone.id];
            const cx = zone.coord.x * sx;
            const cy = zone.coord.y * sy;
            return (
              <div
                key={zone.id}
                style={{
                  position: "absolute",
                  left: cx - 72 * sx,
                  top: cy - 52 * sy,
                  width: 144 * sx,
                  height: 104 * sy,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 120 * sx,
                    height: 86 * sy,
                    borderRadius: "50%",
                    background: terrain.sand,
                    position: "absolute",
                    top: 12 * sy,
                  }}
                />
                <div
                  style={{
                    width: 92 * sx,
                    height: 64 * sy,
                    borderRadius: "50%",
                    background: terrain.grass,
                    position: "absolute",
                    top: 4 * sy,
                  }}
                />
                <div
                  style={{
                    fontSize: 24 * sx,
                    fontWeight: 800,
                    color: INK,
                    lineHeight: 1,
                    letterSpacing: 1,
                  }}
                >
                  {ZONE_OG_MARKS[zone.id]}
                </div>
                <div
                  style={{
                    marginTop: 6 * sy,
                    fontSize: 18 * sx,
                    fontWeight: 800,
                    color: INK,
                    background: "rgba(255,255,255,0.82)",
                    padding: "2px 10px",
                    borderRadius: 8,
                  }}
                >
                  {zone.name}
                </div>
              </div>
            );
          })}

          {/* 簡化跨海橋 */}
          {ZONES.filter((z) => z.bridgeFrom === "car-park").map((zone) => {
            const hub = ZONES.find((z) => z.id === "car-park")!;
            const x1 = hub.coord.x * sx;
            const y1 = hub.coord.y * sy;
            const x2 = zone.coord.x * sx;
            const y2 = zone.coord.y * sy;
            const len = Math.hypot(x2 - x1, y2 - y1);
            const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
            return (
              <div
                key={`bridge-${zone.id}`}
                style={{
                  position: "absolute",
                  left: x1,
                  top: y1,
                  width: len,
                  height: 8,
                  background: BRIDGE,
                  transformOrigin: "0 50%",
                  transform: `rotate(${angle}deg)`,
                  opacity: zone.status === "coming" || zone.status === "planned" ? 0.55 : 0.9,
                  borderRadius: 4,
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 48,
            fontWeight: 800,
            color: INK,
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          車車宇宙 · 樂園地圖
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: INK_SOFT,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          點島出發 · 聽故事 · 玩遊戲
        </div>
      </div>
    ),
    { ...universeOgImageSize, fonts: ogFontOptions(fontData) },
  );
}
