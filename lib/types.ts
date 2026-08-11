/**
 * Shared domain types for the Pharmacist Wrapped Portal.
 *
 * The `WrappedPayload` produced here is the sole contract between the portal
 * and the render pipeline (PRD §7.5). The renderer must not need to look
 * anything else up.
 */

export type WorkingDaysPerWeek = 5 | 6 | 7;

/** 14 represents the "14+" option. */
export type HoursPerDay = 6 | 8 | 10 | 12 | 14;

export type StepsBucket =
  | "under_2000"
  | "2000_3000"
  | "3000_4000"
  | "4000_5000"
  | "over_5000"
  | "unknown";

export type KnownFor =
  | "patient_guidance"
  | "always_available"
  | "medicine_knowledge"
  | "friendly_advice"
  | "serving_generations"
  | "helping_emergencies";

export type Language = "en" | "hi";

/** Raw answers collected by the form, pre-calculation. */
export interface RawInputs {
  /** Q1 — years working as a pharmacist. 0–60. */
  years: number;
  /** Q2 */
  workingDaysPerWeek: WorkingDaysPerWeek;
  /** Q3 */
  hoursPerDay: HoursPerDay;
  /** Q4 — people served per day. 1–500. */
  peoplePerDay: number;
  /** Q5 */
  stepsBucket: StepsBucket;
  /** Q6 — selects a scene variant, not a calculation. */
  knownFor: KnownFor;
}

/** Personalisation fields (PRD §6.4). */
export interface Personalisation {
  fullName: string;
  pharmacyName: string;
  city: string;
  state: string;
  /** Optional — only used for the WhatsApp backup copy (PRD §6.2). */
  mobile?: string;
  /** MR-assisted mode (PRD §10). */
  mrCode?: string;
}

export interface Consent {
  /** Required. Generation + Mankind WPD communications. */
  primary: boolean;
  /** Optional, unchecked by default. Public/social feature usage. */
  publicFeature: boolean;
}

/** The nine calculated values from PRD §7.1. */
export interface CalculatedStats {
  weeksOfService: number;
  workingDays: number;
  totalWorkingHours: number;
  continuousYearsEquivalent: number;
  lifetimeInteractions: number;
  stadiumEquivalent: number;
  minutesPerPerson: number;
  lifetimeSteps: number;
  distanceWalkedKm: number;
}

/**
 * Pre-formatted strings for on-screen display, using Indian digit grouping
 * (1,23,456 — not 123,456).
 *
 * Formatting lives here, not in the renderer, so that a re-render (PRD §12)
 * can never produce different numbers than the first attempt.
 */
export interface DisplayStats {
  weeksOfService: string;
  workingDays: string;
  totalWorkingHours: string;
  continuousYearsEquivalent: string;
  lifetimeInteractions: string;
  stadiumEquivalent: string;
  minutesPerPerson: string;
  lifetimeSteps: string;
  distanceWalkedKm: string;
}

/**
 * The complete render contract (PRD §7.5).
 *
 * Persisted immutably at submit time. The renderer reads only this.
 */
export interface WrappedPayload {
  /** Non-sequential UUID — this is the access model in place of login (§8.1). */
  id: string;
  createdAt: string;
  language: Language;
  inputs: RawInputs;
  /** Steps/day after bucket resolution (§7.2). */
  resolvedStepsPerDay: number;
  stats: CalculatedStats;
  display: DisplayStats;
  /** True when years < 5 — renderer selects alternate caption set (§7.3). */
  earlyCareer: boolean;
  knownFor: KnownFor;
  personalisation: Personalisation;
  /**
   * Path/URL to the moderated photo, or null when the pharmacist could not
   * produce an acceptable photo. Null selects the photo-free template
   * variant (§6.5 fallback).
   */
  photoUrl: string | null;
}

export type RenderStatus =
  | "queued"
  | "rendering"
  | "ready"
  | "failed";

export interface SubmissionRecord {
  payload: WrappedPayload;
  consent: Consent;
  status: RenderStatus;
  /** 0–100, updated as the render progresses. */
  progress: number;
  videoPath: string | null;
  error: string | null;
  updatedAt: string;
}
