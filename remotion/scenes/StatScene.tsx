import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { CountUp } from "../components/CountUp";
import { SceneWrap } from "../components/SceneWrap";
import { colors } from "../theme";

interface StatSceneProps {
  tint: [string, string];
  seed: number;
  fontFamily: string;
  kicker: string;
  value: number;
  finalDisplay: string;
  unit: string;
  caption: string;
  decimals?: 0 | 1;
  /**
   * Counting up is wrong for values that display with a unit inside the string
   * (e.g. "43 sec"), where the animation would tick through bare decimals and
   * then snap. Those scenes show the final figure directly.
   */
  animateNumber?: boolean;
  /** Optional second line that lands after the main number settles. */
  footnote?: React.ReactNode;
}

const numberStyle: React.CSSProperties = {
  fontSize: 108,
  fontWeight: 800,
  color: colors.accent,
  letterSpacing: -2,
  lineHeight: 1,
  textShadow: "0 6px 30px rgba(0,0,0,0.35)",
};

/**
 * The workhorse scene: a line of setup, a large counting number, a caption,
 * and an optional comparison footnote.
 *
 * Used for five of the nine stats. Keeping them one component means the
 * timing and typography stay identical across the film.
 */
export const StatScene: React.FC<StatSceneProps> = ({
  tint,
  seed,
  fontFamily,
  kicker,
  value,
  finalDisplay,
  unit,
  caption,
  decimals = 0,
  animateNumber = true,
  footnote,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const kickerIn = spring({
    frame: frame - 6,
    fps,
    config: { damping: 200 },
  });
  const kickerY = interpolate(kickerIn, [0, 1], [24, 0]);

  const captionIn = spring({
    frame: frame - 56,
    fps,
    config: { damping: 200 },
  });

  const footnoteIn = spring({
    frame: frame - 96,
    fps,
    config: { damping: 200 },
  });

  return (
    <SceneWrap tint={tint} seed={seed}>
      <div style={{ fontFamily, textAlign: "center", width: "100%" }}>
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.35,
            color: colors.cream,
            opacity: kickerIn * 0.92,
            transform: `translateY(${kickerY}px)`,
            fontWeight: 500,
          }}
        >
          {kicker}
        </div>

        <div
          style={{
            marginTop: 26,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          {animateNumber ? (
            <CountUp
              value={value}
              finalDisplay={finalDisplay}
              startFrame={14}
              durationInFrames={44}
              decimals={decimals}
              style={numberStyle}
            />
          ) : (
            <span
              style={{
                ...numberStyle,
                opacity: interpolate(frame, [12, 34], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              {finalDisplay}
            </span>
          )}
          <span
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: colors.accentLight,
            }}
          >
            {unit}
          </span>
        </div>

        <div
          style={{
            marginTop: 22,
            fontSize: 33,
            lineHeight: 1.4,
            color: colors.white,
            opacity: captionIn,
            transform: `translateY(${interpolate(captionIn, [0, 1], [16, 0])}px)`,
            fontWeight: 500,
          }}
        >
          {caption}
        </div>

        {footnote ? (
          <div
            style={{
              marginTop: 40,
              paddingTop: 26,
              borderTop: `1px solid rgba(255,255,255,0.22)`,
              fontSize: 28,
              lineHeight: 1.45,
              color: colors.accentLight,
              opacity: footnoteIn,
              transform: `translateY(${interpolate(footnoteIn, [0, 1], [14, 0])}px)`,
            }}
          >
            {footnote}
          </div>
        ) : null}
      </div>
    </SceneWrap>
  );
};
