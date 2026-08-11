import React from "react";
import { Composition } from "remotion";

import { PLATE } from "./plate/config";
import { PlateFilm, type PlateFilmProps } from "./plate/PlateFilm";
import { samplePayload } from "./sample";
import { FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "./theme";
import {
  FULL_DURATION,
  SHORT_DURATION,
  Wrapped,
  type WrappedProps,
} from "./Wrapped";

/**
 * 720×1280 rather than 1080×1920: it halves both render time and file size,
 * and a ~7MB file is the difference between a pharmacist on 3G finishing the
 * download and abandoning it.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/*
        The delivered film: the supplied reference plate with this
        pharmacist's data composited over the burned-in sample data.
      */}
      <Composition
        id="PlateFilm"
        component={PlateFilm}
        durationInFrames={PLATE.durationInFrames}
        fps={PLATE.fps}
        width={PLATE.width}
        height={PLATE.height}
        defaultProps={{ payload: samplePayload }}
      />

      <Composition
        id="Wrapped"
        component={Wrapped}
        durationInFrames={FULL_DURATION}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{ payload: samplePayload, variant: "full" }}
      />
      <Composition
        id="WrappedShort"
        component={Wrapped}
        durationInFrames={SHORT_DURATION}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{ payload: samplePayload, variant: "short" }}
      />
    </>
  );
};
