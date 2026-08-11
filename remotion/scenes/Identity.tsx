import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { PhotoBadge } from "../components/PhotoBadge";
import { SceneWrap } from "../components/SceneWrap";
import { colors, sceneTints } from "../theme";

interface IdentityProps {
  fontFamily: string;
  greeting: string;
  atWord: string;
  fullName: string;
  pharmacyName: string;
  city: string;
  state: string;
  photoUrl: string | null;
  initials: string;
}

/**
 * Establishes who the film is about. This is the scene that has to carry the
 * "made for me" feeling, so the name gets the largest type in the film after
 * the statistics themselves.
 */
export const Identity: React.FC<IdentityProps> = ({
  fontFamily,
  greeting,
  atWord,
  fullName,
  pharmacyName,
  city,
  state,
  photoUrl,
  initials,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const greetIn = spring({ frame: frame - 30, fps, config: { damping: 200 } });
  const nameIn = spring({ frame: frame - 46, fps, config: { damping: 200 } });
  const shopIn = spring({ frame: frame - 68, fps, config: { damping: 200 } });

  // Long names need to step down a size or two; the render layer owns auto-fit
  // (PRD §6.4) rather than truncating what the pharmacist typed.
  const nameSize = fullName.length > 34 ? 40 : fullName.length > 22 ? 48 : 58;

  return (
    <SceneWrap tint={sceneTints.identity} seed={7}>
      <div
        style={{
          fontFamily,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <PhotoBadge
          photoUrl={photoUrl}
          initials={initials}
          size={286}
          delay={2}
        />

        <div
          style={{
            marginTop: 46,
            fontSize: 27,
            color: colors.accentLight,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 600,
            opacity: greetIn,
          }}
        >
          {greeting}
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: nameSize,
            fontWeight: 800,
            color: colors.white,
            lineHeight: 1.18,
            opacity: nameIn,
            transform: `translateY(${interpolate(nameIn, [0, 1], [18, 0])}px)`,
          }}
        >
          {fullName}
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 29,
            color: colors.cream,
            lineHeight: 1.4,
            opacity: shopIn * 0.95,
            fontWeight: 500,
          }}
        >
          {pharmacyName}
          <div style={{ fontSize: 24, marginTop: 8, opacity: 0.8 }}>
            {atWord} {city}, {state}
          </div>
        </div>
      </div>
    </SceneWrap>
  );
};
