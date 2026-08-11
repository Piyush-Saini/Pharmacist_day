import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { SceneWrap } from "../components/SceneWrap";
import { colors, sceneTints } from "../theme";

interface KnownForProps {
  fontFamily: string;
  kicker: string;
  title: string;
  sub: string;
}

/**
 * Scene 8 — the one scene driven by Q6 rather than by arithmetic (PRD §7.4).
 *
 * Deliberately has no number in it. It is the emotional turn after six scenes
 * of statistics.
 */
export const KnownFor: React.FC<KnownForProps> = ({
  fontFamily,
  kicker,
  title,
  sub,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const kickerIn = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  const titleIn = spring({ frame: frame - 32, fps, config: { damping: 200 } });
  const subIn = spring({ frame: frame - 74, fps, config: { damping: 200 } });

  return (
    <SceneWrap tint={sceneTints.knownFor} seed={11}>
      <div style={{ fontFamily, textAlign: "center" }}>
        <div
          style={{
            fontSize: 31,
            color: colors.accentLight,
            fontWeight: 500,
            opacity: kickerIn,
            transform: `translateY(${interpolate(kickerIn, [0, 1], [16, 0])}px)`,
          }}
        >
          {kicker}
        </div>

        <div
          style={{
            marginTop: 22,
            fontSize: 44,
            fontWeight: 800,
            color: colors.white,
            lineHeight: 1.26,
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [20, 0])}px)`,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 30,
            fontSize: 29,
            color: colors.cream,
            lineHeight: 1.45,
            opacity: subIn * 0.9,
            fontStyle: "italic",
          }}
        >
          {sub}
        </div>
      </div>
    </SceneWrap>
  );
};
