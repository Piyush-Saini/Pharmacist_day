import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import type { Box } from "./config";

/**
 * Shared building blocks for the plate overlay layer.
 *
 * Everything is positioned in the plate's own 1920×1080 coordinate space, so
 * the numbers in config.ts can be used directly as measured.
 */

export const boxStyle = (box: Box): React.CSSProperties => ({
  position: "absolute",
  left: box.x,
  top: box.y,
  width: box.width,
  height: box.height,
});

/** Fade in at the start of a sequence and out at the end. */
export function useSceneFade(fadeFrames = 8): number {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(
    frame,
    [0, fadeFrames, durationInFrames - fadeFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
}

/**
 * Hides burned-in sample data underneath a frosted panel.
 *
 * A blurred, tinted panel reads as a deliberate lower-third rather than a
 * patch, and it tolerates the ±15px error on the estimated boxes in config.ts.
 * With clean plates (no burned-in text) these can be dropped entirely.
 */
export const Cover: React.FC<{
  box: Box;
  radius?: number;
  tint?: string;
  blur?: number;
  opacity?: number;
}> = ({ box, radius = 28, tint = "rgba(6,18,32,0.82)", blur = 18, opacity = 1 }) => (
  <div
    style={{
      ...boxStyle(box),
      borderRadius: radius,
      background: tint,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      opacity,
    }}
  />
);

/**
 * Cover with no hard edge — an elliptical scrim that is fully opaque across the
 * middle and fades to nothing at the boundary.
 *
 * Preferred over `Cover` on scenes where the burned-in text sits over moving
 * footage, because a rectangle with visible sides reads as a patch. The core is
 * held near-opaque out to 66%, which is where the text ends, so nothing shows
 * through the part that matters.
 */
export const SoftCover: React.FC<{
  box: Box;
  tint?: string;
  blur?: number;
}> = ({ box, tint = "6,18,32", blur = 16 }) => (
  <div
    style={{
      ...boxStyle(box),
      background: `radial-gradient(ellipse at center, rgba(${tint},0.94) 0%, rgba(${tint},0.92) 58%, rgba(${tint},0.62) 82%, rgba(${tint},0) 100%)`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      // Keeps the blur from showing a rectangular seam of its own.
      maskImage:
        "radial-gradient(ellipse at center, #000 0%, #000 74%, transparent 100%)",
      WebkitMaskImage:
        "radial-gradient(ellipse at center, #000 0%, #000 74%, transparent 100%)",
    }}
  />
);

/** Circular version, for the summary scene's stat bubbles. */
export const CoverDisc: React.FC<{
  cx: number;
  cy: number;
  r: number;
  tint?: string;
  blur?: number;
}> = ({ cx, cy, r, tint = "rgba(6,20,36,0.88)", blur = 16 }) => (
  <div
    style={{
      position: "absolute",
      left: cx - r,
      top: cy - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: tint,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
    }}
  />
);

/**
 * Bottom-of-frame gradient, used on the title card where the burned-in name
 * block sits over moving footage and a hard-edged panel would be obvious.
 */
export const BottomScrim: React.FC<{
  from?: number;
  /** Point at which the scrim reaches full opacity. */
  solidFrom?: number;
}> = ({ from = 700, solidFrom = 780 }) => {
  const fadeHeight = solidFrom - from;
  return (
    <>
      {/* Soft top edge so the band does not start with a visible line. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: from,
          width: 1920,
          height: fadeHeight,
          background:
            "linear-gradient(to bottom, rgba(4,14,26,0) 0%, rgba(4,14,26,0.72) 55%, rgba(4,14,26,1) 100%)",
        }}
      />
      {/*
        Fully opaque below. The burned-in name block is bright white text, and
        anything less than opaque leaves it ghosting through the replacement.
      */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: solidFrom,
          width: 1920,
          height: 1080 - solidFrom,
          background: "#040E1A",
        }}
      />
    </>
  );
};

/** A stat bubble: big value, small caps label, on the summary scene. */
export const Bubble: React.FC<{
  cx: number;
  cy: number;
  r: number;
  value: string;
  label: string;
  fontFamily: string;
  opacity: number;
}> = ({ cx, cy, r, value, label, fontFamily, opacity }) => {
  // Long values ("4,70,000+") need to step down or they overflow the ring.
  const valueSize = value.length > 9 ? r * 0.34 : value.length > 6 ? r * 0.42 : r * 0.52;

  return (
    <div
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: "2px solid rgba(150,225,255,0.55)",
        boxShadow: "0 0 26px rgba(80,190,235,0.30) inset",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        opacity,
      }}
    >
      <div
        style={{
          fontSize: valueSize,
          fontWeight: 700,
          color: "#FFFFFF",
          lineHeight: 1.05,
          textAlign: "center",
          padding: "0 6px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: r * 0.06,
          fontSize: r * 0.19,
          letterSpacing: 1.4,
          color: "#B9E6FA",
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {label}
      </div>
    </div>
  );
};
