/**
 * Server-side validation of the submit payload (PRD §6.3, §6.4).
 *
 * The client validates too, for immediate feedback, but this is the boundary
 * that actually protects the calculation engine — never trust the form.
 */

import { z } from "zod";

import { PEOPLE_MAX, PEOPLE_MIN, YEARS_MAX, YEARS_MIN } from "./calc";

export const NAME_MAX = 60;
export const PHARMACY_MAX = 80;

const knownForValues = [
  "patient_guidance",
  "always_available",
  "medicine_knowledge",
  "friendly_advice",
  "serving_generations",
  "helping_emergencies",
] as const;

const stepsBucketValues = [
  "under_2000",
  "2000_3000",
  "3000_4000",
  "4000_5000",
  "over_5000",
  "unknown",
] as const;

/** Indian mobile numbers start 6–9 and run 10 digits. */
const MOBILE_RE = /^[6-9]\d{9}$/;

export const submitSchema = z.object({
  language: z.enum(["en", "hi"]),

  inputs: z.object({
    years: z
      .number({ invalid_type_error: "years must be a number" })
      .int()
      .min(YEARS_MIN)
      .max(YEARS_MAX),
    workingDaysPerWeek: z.union([
      z.literal(5),
      z.literal(6),
      z.literal(7),
    ]),
    hoursPerDay: z.union([
      z.literal(6),
      z.literal(8),
      z.literal(10),
      z.literal(12),
      z.literal(14),
    ]),
    peoplePerDay: z
      .number({ invalid_type_error: "peoplePerDay must be a number" })
      .int()
      .min(PEOPLE_MIN)
      .max(PEOPLE_MAX),
    stepsBucket: z.enum(stepsBucketValues),
    knownFor: z.enum(knownForValues),
  }),

  personalisation: z.object({
    fullName: z.string().trim().min(1).max(NAME_MAX),
    pharmacyName: z.string().trim().min(1).max(PHARMACY_MAX),
    city: z.string().trim().min(1).max(80),
    state: z.string().trim().min(1).max(80),
    mobile: z
      .string()
      .trim()
      .regex(MOBILE_RE)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    mrCode: z.string().trim().max(24).optional(),
  }),

  consent: z.object({
    // Refused rather than defaulted: no submission proceeds without it (§6.6).
    primary: z.literal(true),
    publicFeature: z.boolean(),
  }),

  /**
   * Data URL of the already-resized photo, or null for the photo-free variant.
   * Capped at ~4MB of base64 to bound the request body; the client targets
   * well under 1MB (§6.5).
   */
  photo: z
    .string()
    .regex(/^data:image\/(jpeg|png|webp);base64,/)
    .max(4 * 1024 * 1024)
    .nullable(),
});

export type SubmitInput = z.infer<typeof submitSchema>;

export function isValidMobile(value: string): boolean {
  return MOBILE_RE.test(value.trim());
}
