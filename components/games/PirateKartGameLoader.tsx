"use client";

import dynamic from "next/dynamic";

const PirateKartGame = dynamic(() => import("./PirateKartGame"), {
  ssr: false,
});

/** Client 邊界：dynamic import + ssr:false（page 維持 Server Component）。 */
export default function PirateKartGameLoader() {
  return <PirateKartGame />;
}
