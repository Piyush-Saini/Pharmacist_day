import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { colors } from "../theme";

/**
 * Animated background — a slow gradient drift with floating motes.
 *
 * Stands in for the fixed Veo footage plates in the production film. Kept
 * deterministic (seeded, frame-derived) so every render of the same
 * submission produces an identical file.
 */

interface BackdropProps {
  tint: [string, string];
  /** Seeded so different scenes get different mote layouts, not random ones. */
  seed?: number;
}

function seededPositions(seed: number, count: number) {
  const out: { x: number; y: number; r: number; speed: number; phase: number }[] =
    [];
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < count; i++) {
    out.push({
      x: rand() * 100,
      y: rand() * 100,
      r: 2 + rand() * 5,
      speed: 0.15 + rand() * 0.5,
      phase: rand() * Math.PI * 2,
    });
  }
  return out;
}

export const Backdrop: React.FC<BackdropProps> = ({ tint, seed = 1 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Gentle rotation of the gradient across the scene's life.
  const angle = interpolate(frame, [0, durationInFrames], [140, 210], {
    extrapolateRight: "clamp",
  });

  const motes = React.useMemo(() => seededPositions(seed, 18), [seed]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${tint[0]} 0%, ${tint[1]} 100%)`,
      }}
    >
      {/* Soft vignette to keep text legible over the gradient */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0.42) 100%)",
        }}
      />

      {motes.map((m, i) => {
        const drift = Math.sin(frame * 0.02 * m.speed + m.phase);
        const y = m.y + drift * 4;
        const opacity =
          0.10 + 0.16 * (0.5 + 0.5 * Math.sin(frame * 0.03 * m.speed + m.phase));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${m.x}%`,
              top: `${y}%`,
              width: m.r * 2,
              height: m.r * 2,
              borderRadius: "50%",
              background: colors.accentLight,
              opacity,
              filter: "blur(1.5px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
