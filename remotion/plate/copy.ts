/**
 * On-screen copy for the plate overlays.
 *
 * Wording follows the reference film so the overlay reads as the same piece,
 * with two deliberate corrections:
 *   - the certificate body, which is garbled AI text in the plate
 *   - the summary subtitle, likewise
 */

import type { KnownFor, Language } from "../../lib/types";

export interface PlateCopy {
  titleKicker: string;

  labelYears: string;
  labelWeeks: string;
  labelWorkingDays: string;
  labelHours: string;
  labelDays: string;
  labelInteractions: string;
  labelSteps: string;
  labelStadiums: string;
  labelKm: string;

  hoursFootnote: (years: number) => string;
  peoplePerDay: (value: string) => string;
  estimatedInteractions: string;
  stadiumLine1: string;
  stadiumLine2: string;
  stadiumLine3: (times: number) => string;
  minutesLine1: string;
  minutesLine2: (minutes: string) => string;

  trustLine1: string;
  trustLine2: string;
  knownForLabel: string;
  knownFor: Record<KnownFor, string>;

  summarySubtitle: (pharmacy: string) => string;

  certPresentedTo: string;
  certBody: (years: number) => string;
  certSignLeft: string;
  certSignRight: string;
  certYearsLabel: string;
}

const en: PlateCopy = {
  titleKicker: "PHARMACIST WRAPPED 2026",

  labelYears: "YEARS",
  labelWeeks: "WEEKS",
  labelWorkingDays: "WORKING DAYS",
  labelHours: "HOURS",
  labelDays: "DAYS",
  labelInteractions: "INTERACTIONS",
  labelSteps: "STEPS",
  labelStadiums: "STADIUMS",
  labelKm: "KM",

  hoursFootnote: (years) => `MORE THAN ${years} YEARS — NON-STOP`,
  peoplePerDay: (value) => `${value} PEOPLE A DAY`,
  estimatedInteractions: "ESTIMATED INTERACTIONS",
  stadiumLine1: "ENOUGH TO FILL A",
  stadiumLine2: "50,000-SEAT STADIUM",
  stadiumLine3: (times) => `MORE THAN ${times} TIMES`,
  minutesLine1: "ONE PERSON APPROX.",
  minutesLine2: (minutes) => `EVERY ${minutes}`,

  trustLine1: "We couldn't calculate",
  trustLine2: "TRUST",
  knownForLabel: "Known for:",
  knownFor: {
    patient_guidance: "PATIENT GUIDANCE",
    always_available: "ALWAYS BEING AVAILABLE",
    medicine_knowledge: "MEDICINE KNOWLEDGE",
    friendly_advice: "FRIENDLY ADVICE",
    serving_generations: "SERVING GENERATIONS",
    helping_emergencies: "HELPING IN EMERGENCIES",
  },

  summarySubtitle: (pharmacy) => `Pharmacist, ${pharmacy}`,

  certPresentedTo: "Presented to",
  certBody: (years) =>
    `In grateful recognition of ${years} ${years === 1 ? "year" : "years"} of dedicated service to the health of your community.`,
  certSignLeft: "World Pharmacist Day",
  certSignRight: "Mankind Pharma",
  certYearsLabel: "YEARS",
};

const hi: PlateCopy = {
  titleKicker: "फार्मासिस्ट रैप्ड 2026",

  labelYears: "वर्ष",
  labelWeeks: "हफ़्ते",
  labelWorkingDays: "कार्य दिवस",
  labelHours: "घंटे",
  labelDays: "दिन",
  labelInteractions: "मुलाक़ातें",
  labelSteps: "कदम",
  labelStadiums: "स्टेडियम",
  labelKm: "किमी",

  hoursFootnote: (years) => `${years} वर्ष से ज़्यादा — लगातार`,
  peoplePerDay: (value) => `${value} लोग रोज़`,
  estimatedInteractions: "अनुमानित मुलाक़ातें",
  stadiumLine1: "इतने लोग कि",
  stadiumLine2: "50,000 सीट का स्टेडियम",
  stadiumLine3: (times) => `${times} बार से ज़्यादा भर जाए`,
  minutesLine1: "लगभग हर",
  minutesLine2: (minutes) => `${minutes} में एक व्यक्ति`,

  trustLine1: "जिसे हम गिन नहीं सके —",
  trustLine2: "भरोसा",
  knownForLabel: "पहचान:",
  knownFor: {
    patient_guidance: "मरीज़ को सही सलाह",
    always_available: "हमेशा उपलब्ध",
    medicine_knowledge: "दवाओं की जानकारी",
    friendly_advice: "अपनापन भरी सलाह",
    serving_generations: "पीढ़ियों की सेवा",
    helping_emergencies: "आपात स्थिति में मदद",
  },

  summarySubtitle: (pharmacy) => `फार्मासिस्ट, ${pharmacy}`,

  certPresentedTo: "प्रस्तुत",
  certBody: (years) =>
    `अपने समुदाय के स्वास्थ्य के लिए ${years} वर्षों की समर्पित सेवा के सम्मान में।`,
  certSignLeft: "वर्ल्ड फार्मासिस्ट डे",
  certSignRight: "मैनकाइंड फार्मा",
  certYearsLabel: "वर्ष",
};

export const plateCopy: Record<Language, PlateCopy> = { en, hi };

export function getPlateCopy(lang: Language): PlateCopy {
  return plateCopy[lang] ?? plateCopy.en;
}
