import React from "react";
import { AbsoluteFill, Sequence } from "remotion";

import type { WrappedPayload } from "../lib/types";
import { getVideoCopy } from "./copy";
import { Identity } from "./scenes/Identity";
import { Intro } from "./scenes/Intro";
import { KnownFor } from "./scenes/KnownFor";
import { Outro } from "./scenes/Outro";
import { StatScene } from "./scenes/StatScene";
import { colors, ensureFontsLoaded, fontStack, sceneTints } from "./theme";

/**
 * The Wrapped film.
 *
 * Reads only from `WrappedPayload` — the single portal→renderer contract in
 * PRD §7.5. If something is not in the payload, the film cannot depend on it.
 */

export type WrappedProps = {
  payload: WrappedPayload;
  /**
   * "full" is the 65-second film for download. "short" is a 25-second cut that
   * fits the 30-second ceiling on WhatsApp Status and Instagram Stories, which
   * the full film cannot be posted to in one piece.
   */
  variant: "full" | "short";
};

/** Scene lengths in frames at 30fps. */
export const FULL_SCENES = {
  intro: 135,
  identity: 195,
  years: 240,
  hours: 240,
  people: 270,
  minutes: 210,
  steps: 270,
  knownFor: 210,
  outro: 180,
} as const;

export const SHORT_SCENES = {
  identity: 180,
  people: 210,
  steps: 180,
  outro: 180,
} as const;

export const FULL_DURATION = Object.values(FULL_SCENES).reduce(
  (a, b) => a + b,
  0,
);
export const SHORT_DURATION = Object.values(SHORT_SCENES).reduce(
  (a, b) => a + b,
  0,
);

/** First letters of the first two words — the photo-free monogram. */
export function initialsFor(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("");
}

export const Wrapped: React.FC<WrappedProps> = ({ payload, variant }) => {
  // Must run during render so the delayRender handles register before the
  // first frame is captured — see the note in theme.ts.
  ensureFontsLoaded();

  const { stats, display, personalisation, photoUrl, language, earlyCareer } =
    payload;
  const copy = getVideoCopy(language, earlyCareer);
  const font = fontStack(language);
  const initials = initialsFor(personalisation.fullName);

  const identity = (
    <Identity
      fontFamily={font}
      greeting={copy.identityGreeting}
      atWord={copy.identityAt}
      fullName={personalisation.fullName}
      pharmacyName={personalisation.pharmacyName}
      city={personalisation.city}
      state={personalisation.state}
      photoUrl={photoUrl}
      initials={initials}
    />
  );

  const peopleScene = (
    <StatScene
      tint={sceneTints.people}
      seed={23}
      fontFamily={font}
      kicker={copy.people.kicker}
      value={stats.lifetimeInteractions}
      finalDisplay={display.lifetimeInteractions}
      unit={copy.unitPeople}
      caption={copy.people.caption}
      footnote={copy.peopleFootnote(display.stadiumEquivalent)}
    />
  );

  const stepsScene = (
    <StatScene
      tint={sceneTints.steps}
      seed={31}
      fontFamily={font}
      kicker={copy.steps.kicker}
      value={stats.distanceWalkedKm}
      finalDisplay={display.distanceWalkedKm}
      unit={copy.unitKm}
      caption={copy.steps.caption}
    />
  );

  const outro = (
    <Outro
      fontFamily={font}
      line1={copy.outroLine1}
      thanksPrefix={copy.outroLine2}
      fullName={personalisation.fullName}
      signoff={copy.outroSignoff}
      photoUrl={photoUrl}
      initials={initials}
    />
  );

  if (variant === "short") {
    let at = 0;
    const seq = (dur: number, node: React.ReactNode, key: string) => {
      const el = (
        <Sequence key={key} from={at} durationInFrames={dur}>
          {node}
        </Sequence>
      );
      at += dur;
      return el;
    };

    return (
      <AbsoluteFill style={{ backgroundColor: colors.ink }}>
        {seq(SHORT_SCENES.identity, identity, "identity")}
        {seq(SHORT_SCENES.people, peopleScene, "people")}
        {seq(SHORT_SCENES.steps, stepsScene, "steps")}
        {seq(SHORT_SCENES.outro, outro, "outro")}
      </AbsoluteFill>
    );
  }

  let at = 0;
  const seq = (dur: number, node: React.ReactNode, key: string) => {
    const el = (
      <Sequence key={key} from={at} durationInFrames={dur}>
        {node}
      </Sequence>
    );
    at += dur;
    return el;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      {seq(
        FULL_SCENES.intro,
        <Intro
          fontFamily={font}
          kicker={copy.introKicker}
          title={copy.introTitle}
        />,
        "intro",
      )}

      {seq(FULL_SCENES.identity, identity, "identity")}

      {seq(
        FULL_SCENES.years,
        <StatScene
          tint={sceneTints.years}
          seed={13}
          fontFamily={font}
          kicker={copy.years.kicker}
          value={stats.weeksOfService}
          finalDisplay={display.weeksOfService}
          unit={copy.unitWeeks}
          caption={copy.years.caption}
        />,
        "years",
      )}

      {seq(
        FULL_SCENES.hours,
        <StatScene
          tint={sceneTints.hours}
          seed={19}
          fontFamily={font}
          kicker={copy.hours.kicker}
          value={stats.totalWorkingHours}
          finalDisplay={display.totalWorkingHours}
          unit={copy.unitHours}
          caption={copy.hours.caption}
          footnote={copy.hoursFootnote(display.continuousYearsEquivalent)}
        />,
        "hours",
      )}

      {seq(FULL_SCENES.people, peopleScene, "people")}

      {seq(
        FULL_SCENES.minutes,
        <StatScene
          tint={sceneTints.minutes}
          seed={29}
          fontFamily={font}
          kicker={copy.minutes.kicker}
          value={stats.minutesPerPerson}
          finalDisplay={display.minutesPerPerson}
          unit=""
          caption={copy.minutes.caption}
          decimals={1}
          animateNumber={false}
        />,
        "minutes",
      )}

      {seq(FULL_SCENES.steps, stepsScene, "steps")}

      {seq(
        FULL_SCENES.knownFor,
        <KnownFor
          fontFamily={font}
          kicker={copy.knownForKicker}
          title={copy.knownFor[payload.knownFor].title}
          sub={copy.knownFor[payload.knownFor].sub}
        />,
        "knownFor",
      )}

      {seq(FULL_SCENES.outro, outro, "outro")}
    </AbsoluteFill>
  );
};
