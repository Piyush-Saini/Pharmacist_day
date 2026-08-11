import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { Backdrop } from "./Backdrop";

interface SceneWrapProps {
  tint: [string, string];
  seed?: number;
  children: React.ReactNode;
  /** Frames of cross-fade at each end of the scene. */
  fade?: number;
}

/** Backdrop + edge fades, so scenes butt together without hard cuts. */
export const SceneWrap: React.FC<SceneWrapProps> = ({
  tint,
  seed,
  children,
  fade = 10,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, fade, durationInFrames - fade, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      <Backdrop tint={tint} seed={seed} />
      <AbsoluteFill
        style={{
          padding: "0 56px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
