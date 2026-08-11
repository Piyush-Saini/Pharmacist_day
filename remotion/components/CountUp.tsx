import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { formatIndian, formatIndian1dp } from "../../lib/calc";

interface CountUpProps {
  /** Numeric target, used only to animate towards the final value. */
  value: number;
  /**
   * The persisted display string (PRD §7.5). Shown verbatim once the count
   * finishes, so the frame the pharmacist actually reads always matches the
   * stored payload rather than a re-derived number.
   */
  finalDisplay: string;
  startFrame?: number;
  durationInFrames?: number;
  decimals?: 0 | 1;
  style?: React.CSSProperties;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  finalDisplay,
  startFrame = 0,
  durationInFrames = 45,
  decimals = 0,
  style,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Ease-out so the number decelerates into its final value.
  const eased = 1 - (1 - progress) ** 3;

  const text =
    progress >= 1
      ? finalDisplay
      : decimals === 1
        ? formatIndian1dp(value * eased)
        : formatIndian(Math.round(value * eased));

  return <span style={style}>{text}</span>;
};
