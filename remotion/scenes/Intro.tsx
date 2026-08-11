import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { SceneWrap } from "../components/SceneWrap";
import { colors, sceneTints } from "../theme";

interface IntroProps {
  fontFamily: string;
  kicker: string;
  title: string;
}

export const Intro: React.FC<IntroProps> = ({ fontFamily, kicker, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const kickerIn = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  const titleIn = spring({ frame: frame - 34, fps, config: { damping: 200 } });
  const ruleIn = interpolate(frame, [26, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneWrap tint={sceneTints.intro} seed={3}>
      <div style={{ fontFamily, textAlign: "center" }}>
        <div
          style={{
            fontSize: 25,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: colors.accent,
            fontWeight: 600,
            opacity: kickerIn,
          }}
        >
          {kicker}
        </div>

        <div
          style={{
            height: 2,
            width: `${ruleIn * 62}%`,
            margin: "26px auto",
            background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
          }}
        />

        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            color: colors.white,
            lineHeight: 1.2,
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [22, 0])}px)`,
          }}
        >
          {title}
        </div>
      </div>
    </SceneWrap>
  );
};
