import type { BurstParticle } from "@/lib/celebration-dom";
import type { CSSProperties } from "react";

type StarBurstProps = {
  particles: readonly BurstParticle[];
  className?: string;
};

/** DOM 慶祝 adapter：星星迸發層。 */
export default function StarBurst({ particles, className }: StarBurstProps) {
  if (particles.length === 0) return null;

  return (
    <>
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={`star-burst-particle${className ? ` ${className}` : ""}`}
          style={
            {
              "--burst-x": particle.x,
              "--burst-y": particle.y,
              color: particle.color,
              fontSize: particle.fontSize,
            } as CSSProperties
          }
          aria-hidden
        >
          {particle.symbol ?? "✦"}
        </span>
      ))}
    </>
  );
}
