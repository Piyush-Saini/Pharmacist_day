import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { PhotoBadge } from "../components/PhotoBadge";
import { SceneWrap } from "../components/SceneWrap";
import { colors, sceneTints } from "../theme";

interface OutroProps {
  fontFamily: string;
  line1: string;
  thanksPrefix: string;
  fullName: string;
  signoff: string;
  photoUrl: string | null;
  initials: string;
}

export const Outro: React.FC<OutroProps> = ({
  fontFamily,
  line1,
  thanksPrefix,
  fullName,
  signoff,
  photoUrl,
  initials,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1In = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  const thanksIn = spring({ frame: frame - 40, fps, config: { damping: 200 } });
  const signIn = spring({ frame: frame - 78, fps, config: { damping: 200 } });
  const brandIn = spring({ frame: frame - 104, fps, config: { damping: 200 } });

  return (
    <SceneWrap tint={sceneTints.outro} seed={17}>
      <div
        style={{
          fontFamily,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 31,
            color: colors.cream,
            opacity: line1In * 0.9,
            marginBottom: 34,
            fontWeight: 500,
          }}
        >
          {line1}
        </div>

        <PhotoBadge
          photoUrl={photoUrl}
          initials={initials}
          size={210}
          kenBurns={false}
          delay={14}
        />

        <div
          style={{
            marginTop: 32,
            fontSize: 42,
            fontWeight: 800,
            color: colors.accent,
            lineHeight: 1.2,
            opacity: thanksIn,
            transform: `translateY(${interpolate(thanksIn, [0, 1], [16, 0])}px)`,
          }}
        >
          {thanksPrefix}
          {fullName}
        </div>

        <div
          style={{
            marginTop: 26,
            fontSize: 27,
            color: colors.white,
            opacity: signIn * 0.94,
            lineHeight: 1.4,
            fontWeight: 500,
          }}
        >
          {signoff}
        </div>

        <div
          style={{
            marginTop: 46,
            paddingTop: 22,
            borderTop: "1px solid rgba(255,255,255,0.2)",
            fontSize: 22,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: colors.accentLight,
            opacity: brandIn * 0.85,
            fontWeight: 600,
          }}
        >
          Mankind Pharma
        </div>
      </div>
    </SceneWrap>
  );
};
