import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { colors } from "../theme";

interface PhotoBadgeProps {
  photoUrl: string | null;
  /** Initials shown when there is no photo (PRD §6.5 fallback). */
  initials: string;
  size?: number;
  /** Slow Ken Burns zoom across the scene. */
  kenBurns?: boolean;
  delay?: number;
}

/**
 * Circular portrait with a brand ring.
 *
 * When `photoUrl` is null this renders a typographic monogram instead, which
 * is the photo-free template variant — a pharmacist who cannot get a usable
 * photo past the checks still gets a complete film.
 */
export const PhotoBadge: React.FC<PhotoBadgeProps> = ({
  photoUrl,
  initials,
  size = 300,
  kenBurns = true,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.7 },
  });

  const zoom = kenBurns
    ? interpolate(frame, [0, durationInFrames], [1, 1.12], {
        extrapolateRight: "clamp",
      })
    : 1;

  const ringSpin = interpolate(frame, [0, durationInFrames], [0, 25], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `scale(${entrance})`,
        position: "relative",
      }}
    >
      {/* Rotating accent ring */}
      <div
        style={{
          position: "absolute",
          inset: -14,
          borderRadius: "50%",
          background: `conic-gradient(from ${ringSpin}deg, ${colors.accent}, ${colors.brandLight}, ${colors.accent})`,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          background: colors.ink,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(160deg, ${colors.brand}, ${colors.deep})`,
        }}
      >
        {photoUrl ? (
          <Img
            src={photoUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${zoom})`,
            }}
          />
        ) : (
          <span
            style={{
              fontSize: size * 0.34,
              fontWeight: 700,
              color: colors.accentLight,
              letterSpacing: 2,
            }}
          >
            {initials}
          </span>
        )}
      </div>
    </div>
  );
};
