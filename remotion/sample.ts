/**
 * Sample payload, used as the default props in Remotion Studio so the film can
 * be worked on without running the form. Not used by the render pipeline.
 *
 * The inputs deliberately reproduce the pharmacist in the supplied reference
 * plate (18 years, 6 days/week, 10 hours/day, 85 people/day), so a render can
 * be compared frame-for-frame against it.
 */

import {
  buildDisplayStats,
  calculateStats,
  isEarlyCareer,
  resolveStepsPerDay,
} from "../lib/calc";
import type { RawInputs, WrappedPayload } from "../lib/types";

const inputs: RawInputs = {
  years: 18,
  workingDaysPerWeek: 6,
  hoursPerDay: 10,
  peoplePerDay: 85,
  stepsBucket: "4000_5000",
  knownFor: "patient_guidance",
};

const stats = calculateStats(inputs);

export const samplePayload: WrappedPayload = {
  id: "00000000-0000-4000-8000-000000000000",
  createdAt: new Date("2026-09-25T09:00:00Z").toISOString(),
  language: "en",
  inputs,
  resolvedStepsPerDay: resolveStepsPerDay(inputs.stepsBucket, inputs.hoursPerDay),
  stats,
  display: buildDisplayStats(stats),
  earlyCareer: isEarlyCareer(inputs.years),
  knownFor: inputs.knownFor,
  personalisation: {
    fullName: "Rahul Sharma",
    pharmacyName: "Sharma Medical Store",
    city: "Jaipur",
    state: "Rajasthan",
  },
  /**
   * A fixture cropped out of the plate itself, so photo placement can be
   * checked without a real upload. Real submissions pass a data URL.
   */
  photoUrl: "plate/sample-photo.jpg",
};
