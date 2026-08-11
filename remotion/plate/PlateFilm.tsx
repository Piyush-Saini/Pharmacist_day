import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { approxLarge, approxPlus, moreThan } from "../../lib/approx";
import { formatIndian } from "../../lib/calc";
import type { WrappedPayload } from "../../lib/types";
import { initialsFor } from "../Wrapped";
import { ensureFontsLoaded, fontStack, serifStack } from "../theme";
import {
  CERTIFICATE,
  HOURS,
  KNOWN_FOR,
  MINUTES,
  PEOPLE,
  PLATE,
  STADIUM,
  STEPS,
  SCENES,
  SUMMARY,
  TENURE,
  TITLE,
  type SummarySlot,
} from "./config";
import { getPlateCopy } from "./copy";
import {
  BottomScrim,
  Bubble,
  boxStyle,
  Cover,
  CoverDisc,
  SoftCover,
  useSceneFade,
} from "./primitives";

/**
 * The Wrapped film, built on the supplied reference plate.
 *
 * The plate video plays underneath (with its own audio) and this layer covers
 * the burned-in sample data and redraws it from the pharmacist's payload.
 *
 * Known limitations of the current plate, documented in README:
 *   - The pharmacist visible in the 16s hero shot is baked into the footage and
 *     cannot be personalised by overlay.
 *   - Background signage, medicine labels and the wall clock carry garbled
 *     AI-generated text that no overlay can reach.
 */

// A type alias rather than an interface: Remotion constrains composition props
// to Record<string, unknown>, and only type aliases get an implicit index
// signature.
export type PlateFilmProps = {
  payload: WrappedPayload;
};

const white = "#FFFFFF";
const cyan = "#8FE0FA";

/**
 * Real submissions carry a data URL; the studio fixture carries a path
 * relative to public/. Only the latter needs resolving.
 */
function resolvePhoto(photoUrl: string): string {
  return /^(data:|https?:|blob:|\/)/.test(photoUrl)
    ? photoUrl
    : staticFile(photoUrl);
}

/** Scales a font size down when the text is too long for its box. */
function fitSize(text: string, base: number, maxChars: number): number {
  if (text.length <= maxChars) return base;
  return Math.max(base * 0.55, base * (maxChars / text.length));
}

/**
 * A single line of replacement text, centred on the full frame width but
 * vertically centred within the measured box of the line it replaces.
 */
const Line: React.FC<{
  box: { y: number; height: number };
  font: string;
  size: number;
  weight: number;
  tracking?: number;
  color?: string;
  uppercase?: boolean;
  children: React.ReactNode;
}> = ({
  box,
  font,
  size,
  weight,
  tracking = 0,
  color = white,
  uppercase = false,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: box.y,
      width: PLATE.width,
      height: box.height,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: font,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: tracking,
      color,
      textTransform: uppercase ? "uppercase" : "none",
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

const TitleOverlay: React.FC<PlateFilmProps & { font: string }> = ({
  payload,
  font,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useSceneFade(10);
  const copy = getPlateCopy(payload.language);
  const { personalisation, photoUrl } = payload;

  const photoIn = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });
  const meta = `${personalisation.pharmacyName} • ${personalisation.city}, ${personalisation.state}`;

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {/* The pharmacist's own photo, inside the plate's cyan frame. */}
      <div
        style={{
          ...boxStyle(TITLE.photo),
          borderRadius: 44,
          overflow: "hidden",
          transform: `scale(${interpolate(photoIn, [0, 1], [0.94, 1])})`,
          background: "linear-gradient(160deg,#0E4C92,#08325F)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {photoUrl ? (
          <Img
            src={resolvePhoto(photoUrl)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              fontFamily: font,
              fontSize: 210,
              fontWeight: 800,
              color: "#FFD08A",
              letterSpacing: 4,
            }}
          >
            {initialsFor(personalisation.fullName)}
          </span>
        )}
      </div>

      {/* Covers the burned-in name block, then redraws it. */}
      <BottomScrim from={748} solidFrom={790} />

      {/*
        Each line is centred inside its own measured box rather than stacked
        with margins, so the replacement lands exactly where the burned-in
        line was instead of drifting below it.
      */}
      <Line box={TITLE.kicker} font={font} size={44} weight={700} tracking={3}>
        {copy.titleKicker}
      </Line>
      <Line
        box={TITLE.name}
        font={font}
        size={fitSize(personalisation.fullName, 50, 24)}
        weight={700}
        tracking={2}
        color={TITLE.nameColor}
        uppercase
      >
        {personalisation.fullName}
      </Line>
      <Line
        box={TITLE.meta}
        font={font}
        size={fitSize(meta, 30, 46)}
        weight={500}
        color="rgba(255,255,255,0.92)"
      >
        {meta}
      </Line>
    </AbsoluteFill>
  );
};

/** One value + label pair in the left-hand stat column. */
const StatLine: React.FC<{
  value: string;
  label: string;
  font: string;
  delay: number;
  valueSize?: number;
}> = ({ value, label, font, delay, valueSize = 96 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 200 } });

  return (
    <div
      style={{
        fontFamily: font,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [22, 0])}px)`,
      }}
    >
      <div
        style={{
          fontSize: fitSize(value, valueSize, 8),
          fontWeight: 700,
          color: white,
          lineHeight: 1.02,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: 2.4,
          color: "rgba(255,255,255,0.86)",
        }}
      >
        {label}
      </div>
    </div>
  );
};

const TenureOverlay: React.FC<PlateFilmProps & { font: string }> = ({
  payload,
  font,
}) => {
  const fade = useSceneFade();
  const copy = getPlateCopy(payload.language);
  const { stats, inputs } = payload;

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <SoftCover box={TENURE.cover} blur={20} />
      <div
        style={{
          ...boxStyle(TENURE.panel),
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <StatLine
          value={String(inputs.years)}
          label={copy.labelYears}
          font={font}
          delay={0}
        />
        <StatLine
          value={formatIndian(stats.weeksOfService)}
          label={copy.labelWeeks}
          font={font}
          delay={8}
        />
        <StatLine
          value={approxPlus(stats.workingDays)}
          label={copy.labelWorkingDays}
          font={font}
          delay={16}
        />
      </div>
    </AbsoluteFill>
  );
};

const HoursOverlay: React.FC<PlateFilmProps & { font: string }> = ({
  payload,
  font,
}) => {
  const fade = useSceneFade();
  const copy = getPlateCopy(payload.language);
  const { stats } = payload;
  const value = approxPlus(stats.totalWorkingHours);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <SoftCover box={HOURS.cover} blur={20} />
      <div style={{ ...boxStyle(HOURS.panel), fontFamily: font }}>
        <div
          style={{
            fontSize: fitSize(value, 128, 9),
            fontWeight: 700,
            color: cyan,
            textShadow: "0 0 34px rgba(90,200,240,0.65)",
            lineHeight: 1.02,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 82,
            fontWeight: 700,
            color: cyan,
            letterSpacing: 4,
            textShadow: "0 0 30px rgba(90,200,240,0.55)",
            lineHeight: 1.1,
          }}
        >
          {copy.labelHours}
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: 1.8,
            color: "rgba(255,255,255,0.94)",
          }}
        >
          {copy.hoursFootnote(moreThan(stats.continuousYearsEquivalent))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Frosted pill matching the plate's own design language. */
const Pill: React.FC<{
  box: typeof PEOPLE.left;
  value: string;
  label: string;
  font: string;
  delay: number;
}> = ({ box, value, label, font, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 200 } });

  return (
    <div
      style={{
        ...boxStyle(box),
        borderRadius: 110,
        background: "rgba(10,26,44,0.80)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(150,215,245,0.28)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font,
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
      }}
    >
      <div
        style={{
          fontSize: fitSize(value, 82, 9),
          fontWeight: 700,
          color: white,
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: fitSize(label, 27, 24),
          fontWeight: 600,
          letterSpacing: 2,
          color: "rgba(200,235,250,0.95)",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        {label}
      </div>
    </div>
  );
};

const PeopleOverlay: React.FC<PlateFilmProps & { font: string }> = ({
  payload,
  font,
}) => {
  const fade = useSceneFade();
  const copy = getPlateCopy(payload.language);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Pill
        box={PEOPLE.left}
        value={`${payload.inputs.peoplePerDay}+`}
        label={copy.peoplePerDay("").trim()}
        font={font}
        delay={0}
      />
      <Pill
        box={PEOPLE.right}
        value={approxPlus(payload.stats.lifetimeInteractions)}
        label={copy.estimatedInteractions}
        font={font}
        delay={7}
      />
    </AbsoluteFill>
  );
};

const StadiumOverlay: React.FC<PlateFilmProps & { font: string }> = ({
  payload,
  font,
}) => {
  const fade = useSceneFade();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const copy = getPlateCopy(payload.language);

  const lines = [
    copy.stadiumLine1,
    copy.stadiumLine2,
    copy.stadiumLine3(moreThan(payload.stats.stadiumEquivalent)),
  ];

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <SoftCover box={STADIUM.cover} blur={20} />
      <div
        style={{
          position: "absolute",
          left: STADIUM.cover.x,
          top: STADIUM.cover.y + 30,
          width: STADIUM.cover.width,
          textAlign: "center",
          fontFamily: font,
        }}
      >
        {lines.map((line, i) => {
          const enter = spring({
            frame: frame - i * 9,
            fps,
            config: { damping: 200 },
          });
          return (
            <div
              key={i}
              style={{
                fontSize: i === 0 ? 46 : 54,
                fontWeight: 700,
                color: white,
                letterSpacing: 1.6,
                lineHeight: 1.5,
                opacity: enter,
                transform: `translateY(${interpolate(enter, [0, 1], [16, 0])}px)`,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const MinutesOverlay: React.FC<PlateFilmProps & { font: string }> = ({
  payload,
  font,
}) => {
  const fade = useSceneFade();
  const copy = getPlateCopy(payload.language);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Cover box={MINUTES.cover} radius={30} tint="rgba(8,22,38,0.82)" blur={20} />
      <div
        style={{
          position: "absolute",
          left: MINUTES.cover.x,
          top: MINUTES.cover.y + 62,
          width: MINUTES.cover.width,
          textAlign: "center",
          fontFamily: font,
        }}
      >
        <div
          style={{
            fontSize: 38,
            fontWeight: 600,
            letterSpacing: 2,
            color: "rgba(255,255,255,0.90)",
          }}
        >
          {copy.minutesLine1}
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 62,
            fontWeight: 700,
            color: white,
            letterSpacing: 1.4,
          }}
        >
          {copy.minutesLine2(payload.display.minutesPerPerson)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StepsOverlay: React.FC<PlateFilmProps & { font: string }> = ({
  payload,
  font,
}) => {
  const fade = useSceneFade();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const copy = getPlateCopy(payload.language);
  const { stats } = payload;

  const stepsEnter = spring({ frame, fps, config: { damping: 200 } });
  const kmEnter = spring({ frame: frame - 10, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <SoftCover box={STEPS.cover} blur={20} />
      <div
        style={{
          position: "absolute",
          left: STEPS.cover.x + 40,
          top: STEPS.cover.y + 26,
          fontFamily: font,
        }}
      >
        <div
          style={{
            fontSize: 86,
            fontWeight: 700,
            color: white,
            letterSpacing: 1,
            opacity: stepsEnter,
            transform: `translateY(${interpolate(stepsEnter, [0, 1], [18, 0])}px)`,
          }}
        >
          {approxLarge(stats.lifetimeSteps, { croreWord: copy.croreWord })}{" "}
          {copy.labelSteps}
        </div>
        <div
          style={{
            marginTop: 26,
            fontSize: 86,
            fontWeight: 700,
            color: cyan,
            letterSpacing: 1,
            textShadow: "0 0 30px rgba(90,200,240,0.5)",
            opacity: kmEnter,
            transform: `translateY(${interpolate(kmEnter, [0, 1], [18, 0])}px)`,
          }}
        >
          {approxPlus(stats.distanceWalkedKm)} {copy.labelKm}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const KnownForOverlay: React.FC<PlateFilmProps & { font: string }> = ({
  payload,
  font,
}) => {
  const fade = useSceneFade();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const copy = getPlateCopy(payload.language);
  const serif = serifStack(payload.language);

  const headIn = spring({ frame, fps, config: { damping: 200 } });
  const labelIn = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  const label = copy.knownFor[payload.knownFor];

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Cover
        box={KNOWN_FOR.headlineCover}
        radius={24}
        tint="rgba(10,16,22,0.52)"
        blur={18}
      />
      <div
        style={{
          position: "absolute",
          left: KNOWN_FOR.headlineCover.x,
          top: KNOWN_FOR.headlineCover.y + 34,
          width: KNOWN_FOR.headlineCover.width,
          textAlign: "center",
          fontFamily: serif,
          opacity: headIn,
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 500, color: "rgba(255,255,255,0.95)" }}>
          {copy.trustLine1}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 96,
            fontWeight: 700,
            color: white,
            letterSpacing: 3,
          }}
        >
          {copy.trustLine2}
        </div>
      </div>

      <Cover
        box={KNOWN_FOR.labelCover}
        radius={24}
        tint="rgba(10,16,22,0.58)"
        blur={18}
      />
      <div
        style={{
          position: "absolute",
          left: KNOWN_FOR.labelCover.x + 34,
          top: KNOWN_FOR.labelCover.y + 40,
          width: KNOWN_FOR.labelCover.width - 68,
          fontFamily: font,
          opacity: labelIn,
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: "rgba(255,255,255,0.86)",
            fontStyle: "italic",
          }}
        >
          {copy.knownForLabel}
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: fitSize(label, 46, 18),
            fontWeight: 700,
            color: white,
            letterSpacing: 1.4,
            lineHeight: 1.2,
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SummaryOverlay: React.FC<PlateFilmProps & { font: string }> = ({
  payload,
  font,
}) => {
  const fade = useSceneFade();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const copy = getPlateCopy(payload.language);
  const { stats, inputs, personalisation } = payload;

  const values: Record<SummarySlot, { value: string; label: string }> = {
    years: { value: String(inputs.years), label: copy.labelYears },
    workingDays: {
      value: approxPlus(stats.workingDays),
      label: copy.labelDays,
    },
    interactions: {
      value: approxPlus(stats.lifetimeInteractions),
      label: copy.labelInteractions,
    },
    steps: {
      value: approxLarge(stats.lifetimeSteps, {
        short: true,
        croreWord: copy.croreWordShort,
      }),
      label: copy.labelSteps,
    },
    hours: {
      value: approxPlus(stats.totalWorkingHours),
      label: copy.labelHours,
    },
    stadium: {
      value: `${moreThan(stats.stadiumEquivalent)}×`,
      label: copy.labelStadiums,
    },
  };

  const nameIn = spring({ frame: frame - 6, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {SUMMARY.bubbles.map((b) => (
        <CoverDisc key={b.slot} cx={b.cx} cy={b.cy} r={b.coverR} />
      ))}

      {SUMMARY.bubbles.map((b, i) => {
        const enter = spring({
          frame: frame - i * 3,
          fps,
          config: { damping: 200 },
        });
        return (
          <Bubble
            key={b.slot}
            cx={b.cx}
            cy={b.cy}
            r={b.r}
            value={values[b.slot].value}
            label={values[b.slot].label}
            fontFamily={font}
            opacity={enter}
          />
        );
      })}

      {/* Name plate and the garbled subtitle beneath it. */}
      <Cover
        box={{
          x: SUMMARY.namePlate.x - 24,
          y: SUMMARY.namePlate.y - 10,
          width: SUMMARY.namePlate.width + 48,
          height: SUMMARY.namePlate.height + SUMMARY.subtitle.height + 34,
        }}
        radius={16}
        tint="rgba(12,34,58,0.94)"
        blur={14}
      />
      <div
        style={{
          position: "absolute",
          left: SUMMARY.namePlate.x - 60,
          top: SUMMARY.namePlate.y + 2,
          width: SUMMARY.namePlate.width + 120,
          textAlign: "center",
          fontFamily: font,
          opacity: nameIn,
        }}
      >
        <div
          style={{
            fontSize: fitSize(personalisation.fullName, 40, 20),
            fontWeight: 700,
            color: white,
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          {personalisation.fullName}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: fitSize(
              copy.summarySubtitle(personalisation.pharmacyName),
              25,
              34,
            ),
            fontWeight: 500,
            color: "#B9E6FA",
          }}
        >
          {copy.summarySubtitle(personalisation.pharmacyName)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CertificateOverlay: React.FC<PlateFilmProps & { font: string }> = ({
  payload,
  font,
}) => {
  const fade = useSceneFade(12);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const copy = getPlateCopy(payload.language);
  const serif = serifStack(payload.language);
  const { personalisation, inputs } = payload;

  const nameIn = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  const ink = CERTIFICATE.ink;

  /** Covers garbled certificate copy with the paper colour sampled at its band. */
  const patch = (
    box: { x: number; y: number; width: number; height: number },
    paper: string,
  ): React.CSSProperties => ({
    position: "absolute",
    left: box.x,
    top: box.y,
    width: box.width,
    height: box.height,
    background: paper,
  });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <div style={patch(CERTIFICATE.presentedTo, CERTIFICATE.paperUpper)} />
      <div style={patch(CERTIFICATE.name, CERTIFICATE.paperUpper)} />
      <div style={patch(CERTIFICATE.body, CERTIFICATE.paperBody)} />
      <div style={patch(CERTIFICATE.signLeft, CERTIFICATE.paperLower)} />
      <div style={patch(CERTIFICATE.signRight, CERTIFICATE.paperLower)} />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: CERTIFICATE.presentedTo.y,
          width: PLATE.width,
          textAlign: "center",
          fontFamily: serif,
          fontSize: 26,
          letterSpacing: 3,
          color: "rgba(30,40,80,0.78)",
        }}
      >
        {copy.certPresentedTo}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          top: CERTIFICATE.name.y,
          width: PLATE.width,
          textAlign: "center",
          fontFamily: serif,
          fontSize: fitSize(personalisation.fullName, 62, 22),
          fontWeight: 700,
          color: ink,
          opacity: nameIn,
          transform: `translateY(${interpolate(nameIn, [0, 1], [10, 0])}px)`,
        }}
      >
        {personalisation.fullName}
      </div>

      <div
        style={{
          position: "absolute",
          left: CERTIFICATE.body.x,
          top: CERTIFICATE.body.y,
          width: CERTIFICATE.body.width,
          textAlign: "center",
          fontFamily: serif,
          fontSize: 27,
          lineHeight: 1.42,
          color: "rgba(28,38,72,0.86)",
        }}
      >
        {copy.certBody(inputs.years)}
      </div>

      {[
        { box: CERTIFICATE.signLeft, text: copy.certSignLeft },
        { box: CERTIFICATE.signRight, text: copy.certSignRight },
      ].map(({ box, text }, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: font,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 1.2,
            color: "rgba(28,38,72,0.82)",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
      ))}

      {/*
        The seal has "18" burned into it, so it would otherwise claim 18 years
        for every pharmacist. Cover the number in the seal's own gold and
        redraw the real figure on it.
      */}
      <div
        style={{
          position: "absolute",
          left: CERTIFICATE.badge.cx - CERTIFICATE.badge.r,
          top: CERTIFICATE.badge.cy - CERTIFICATE.badge.r,
          width: CERTIFICATE.badge.r * 2,
          height: CERTIFICATE.badge.r * 2,
          borderRadius: "50%",
          background: CERTIFICATE.sealGold,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: font,
          fontSize: inputs.years >= 10 ? 32 : 38,
          fontWeight: 800,
          color: "#4A2F0C",
          lineHeight: 1,
        }}
      >
        {inputs.years}
      </div>
    </AbsoluteFill>
  );
};

export const PlateFilm: React.FC<PlateFilmProps> = ({ payload }) => {
  ensureFontsLoaded();
  const font = fontStack(payload.language);

  const scene = (
    key: keyof typeof SCENES,
    node: React.ReactNode,
  ): React.ReactNode => {
    const s = SCENES[key];
    return (
      <Sequence key={key} from={s.from} durationInFrames={s.durationInFrames}>
        {node}
      </Sequence>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo src={staticFile(PLATE.src)} />

      {scene("title", <TitleOverlay payload={payload} font={font} />)}
      {scene("tenure", <TenureOverlay payload={payload} font={font} />)}
      {scene("hours", <HoursOverlay payload={payload} font={font} />)}
      {scene("people", <PeopleOverlay payload={payload} font={font} />)}
      {scene("stadium", <StadiumOverlay payload={payload} font={font} />)}
      {scene("minutes", <MinutesOverlay payload={payload} font={font} />)}
      {scene("steps", <StepsOverlay payload={payload} font={font} />)}
      {scene("knownFor", <KnownForOverlay payload={payload} font={font} />)}
      {scene("summary", <SummaryOverlay payload={payload} font={font} />)}
      {scene("certificate", <CertificateOverlay payload={payload} font={font} />)}
    </AbsoluteFill>
  );
};
