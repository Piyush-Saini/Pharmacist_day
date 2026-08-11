"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { getStrings, LANGUAGES } from "@/lib/i18n";
import type {
  HoursPerDay,
  KnownFor,
  Language,
  StepsBucket,
  WorkingDaysPerWeek,
} from "@/lib/types";
import { isValidMobile, NAME_MAX, PHARMACY_MAX } from "@/lib/validation";
import { PEOPLE_MAX, PEOPLE_MIN, YEARS_MAX, YEARS_MIN } from "@/lib/calc";

import {
  ChoiceList,
  FieldError,
  Footer,
  Question,
  ScreenHeader,
  Stepper,
} from "./controls";
import { DetailsStep, type DetailsErrors, type DetailsValue } from "./DetailsStep";
import { PhotoStep } from "./PhotoStep";

/**
 * The intake flow (PRD §5): one question per screen, progress always visible,
 * back always available.
 *
 * There is no OTP and no account (PRD §6.2), so an interrupted session resumes
 * from a browser-local draft. That resumes on the same phone and browser only —
 * without a verified number there is nothing to key a cross-device session to.
 */

const DRAFT_KEY = "pharmacist-wrapped-draft-v1";
const TOTAL_STEPS = 9;

interface Answers {
  years: number;
  workingDaysPerWeek: WorkingDaysPerWeek | null;
  hoursPerDay: HoursPerDay | null;
  peoplePerDay: number;
  stepsBucket: StepsBucket | null;
  knownFor: KnownFor | null;
}

const emptyAnswers: Answers = {
  years: 10,
  workingDaysPerWeek: null,
  hoursPerDay: null,
  peoplePerDay: 50,
  stepsBucket: null,
  knownFor: null,
};

const emptyDetails: DetailsValue = {
  fullName: "",
  pharmacyName: "",
  city: "",
  state: "",
  mobile: "",
  mrCode: "",
};

interface Draft {
  language: Language;
  step: number;
  answers: Answers;
  details: DetailsValue;
  mrMode: boolean;
}

export const Portal: React.FC = () => {
  const router = useRouter();

  const [language, setLanguage] = React.useState<Language>("en");
  const [started, setStarted] = React.useState(false);
  const [mrMode, setMrMode] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [answers, setAnswers] = React.useState<Answers>(emptyAnswers);
  const [details, setDetails] = React.useState<DetailsValue>(emptyDetails);
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [consentPrimary, setConsentPrimary] = React.useState(false);
  const [consentPublic, setConsentPublic] = React.useState(false);
  const [detailErrors, setDetailErrors] = React.useState<DetailsErrors>({});
  const [consentError, setConsentError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [resumable, setResumable] = React.useState<Draft | null>(null);

  const t = getStrings(language);

  // Offer to resume rather than restoring silently — the phone may be an MR's,
  // with someone else's half-finished answers on it.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Draft;
      if (draft?.answers && draft.step > 1) setResumable(draft);
    } catch {
      // A corrupt draft is not worth surfacing; the form just starts fresh.
    }
  }, []);

  // The photo is deliberately not persisted: a ~1MB data URL will blow the
  // 5MB localStorage quota, and it is quick to retake.
  React.useEffect(() => {
    if (!started) return;
    try {
      const draft: Draft = { language, step, answers, details, mrMode };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Private-mode Safari and a full quota both throw here. Losing autosave
      // must never break the form.
    }
  }, [started, language, step, answers, details, mrMode]);

  function clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* nothing to do */
    }
  }

  function goNext() {
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goBack() {
    if (step === 1) {
      setStarted(false);
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  }

  function validateDetails(): boolean {
    const errors: DetailsErrors = {};
    if (!details.fullName.trim()) errors.fullName = t.errRequired;
    else if (details.fullName.trim().length > NAME_MAX)
      errors.fullName = t.errTooLong(NAME_MAX);

    if (!details.pharmacyName.trim()) errors.pharmacyName = t.errRequired;
    else if (details.pharmacyName.trim().length > PHARMACY_MAX)
      errors.pharmacyName = t.errTooLong(PHARMACY_MAX);

    if (!details.city.trim()) errors.city = t.errRequired;
    if (!details.state.trim()) errors.state = t.errCityUnknown;

    // Optional, but if given it has to be usable for the WhatsApp backup.
    if (details.mobile.trim() && !isValidMobile(details.mobile))
      errors.mobile = t.errMobileInvalid;

    setDetailErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit() {
    if (!consentPrimary) {
      setConsentError(t.errConsentRequired);
      return;
    }
    setConsentError(null);
    setSubmitError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          inputs: {
            years: answers.years,
            workingDaysPerWeek: answers.workingDaysPerWeek,
            hoursPerDay: answers.hoursPerDay,
            peoplePerDay: answers.peoplePerDay,
            stepsBucket: answers.stepsBucket,
            knownFor: answers.knownFor,
          },
          personalisation: {
            fullName: details.fullName.trim(),
            pharmacyName: details.pharmacyName.trim(),
            city: details.city.trim(),
            state: details.state.trim(),
            mobile: details.mobile.trim() || undefined,
            mrCode: details.mrCode.trim() || undefined,
          },
          consent: { primary: consentPrimary, publicFeature: consentPublic },
          photo,
        }),
      });

      if (!response.ok) {
        setSubmitError(t.renderFailedSub);
        setSubmitting(false);
        return;
      }

      const { id } = (await response.json()) as { id: string };
      clearDraft();
      router.push(`/film/${id}`);
    } catch {
      setSubmitError(t.renderFailedSub);
      setSubmitting(false);
    }
  }

  /* ---------------------------------------------------------------- landing */

  if (!started) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <div className="flex justify-end px-5 pt-5">
          <div className="flex gap-2" role="radiogroup" aria-label={t.chooseLanguage}>
            {LANGUAGES.map((entry) => (
              <button
                key={entry.code}
                type="button"
                role="radio"
                aria-checked={language === entry.code}
                onClick={() => setLanguage(entry.code)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  language === entry.code
                    ? "bg-brand text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}
              >
                {entry.native}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">
            Mankind Pharma
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-ink">
            {t.landingHeadline}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {t.landingSub}
          </p>

          {resumable ? (
            <div className="mt-8 rounded-2xl border-2 border-brand/25 bg-brand/5 px-4 py-4">
              <p className="font-semibold text-ink">{t.resumeTitle}</p>
              <p className="mt-1 text-base text-slate-600">{t.resumeBody}</p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="btn-primary flex-1"
                  onClick={() => {
                    setLanguage(resumable.language);
                    setAnswers(resumable.answers);
                    setDetails(resumable.details);
                    setMrMode(resumable.mrMode);
                    setStep(resumable.step);
                    setResumable(null);
                    setStarted(true);
                  }}
                >
                  {t.resumeContinue}
                </button>
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  onClick={() => {
                    clearDraft();
                    setResumable(null);
                  }}
                >
                  {t.resumeFresh}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <Footer>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setStarted(true)}
          >
            {t.landingCta}
          </button>
          <p className="mt-3 text-center text-sm text-slate-500">
            {t.landingTime}
          </p>

          {/* MR-assisted mode (PRD §10) — captured once, at the start. */}
          <label className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <input
              type="checkbox"
              checked={mrMode}
              onChange={(e) => setMrMode(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
            {t.mrCodeHelp}
          </label>
        </Footer>
      </main>
    );
  }

  /* ------------------------------------------------------------------ steps */

  const dayChoices = ([5, 6, 7] as WorkingDaysPerWeek[]).map((d) => ({
    value: d,
    label: t.daysOption(d),
  }));

  const hourChoices = ([6, 8, 10, 12, 14] as HoursPerDay[]).map((h) => ({
    value: h,
    label: t.hoursOption(h),
  }));

  const stepChoices: { value: StepsBucket; label: string }[] = [
    { value: "under_2000", label: t.stepsUnder2000 },
    { value: "2000_3000", label: t.steps2000_3000 },
    { value: "3000_4000", label: t.steps3000_4000 },
    { value: "4000_5000", label: t.steps4000_5000 },
    { value: "over_5000", label: t.stepsOver5000 },
    { value: "unknown", label: t.stepsUnknown },
  ];

  const knownForChoices: { value: KnownFor; label: string }[] = [
    { value: "patient_guidance", label: t.knownForPatientGuidance },
    { value: "always_available", label: t.knownForAlwaysAvailable },
    { value: "medicine_knowledge", label: t.knownForMedicineKnowledge },
    { value: "friendly_advice", label: t.knownForFriendlyAdvice },
    { value: "serving_generations", label: t.knownForServingGenerations },
    { value: "helping_emergencies", label: t.knownForHelpingEmergencies },
  ];

  let body: React.ReactNode = null;
  let canAdvance = false;
  let primaryAction: () => void = goNext;
  let primaryLabel = t.next;

  switch (step) {
    case 1:
      body = (
        <Question title={t.q1Title} help={t.q1Help}>
          <Stepper
            value={answers.years}
            min={YEARS_MIN}
            max={YEARS_MAX}
            unit={t.q1Unit}
            onChange={(years) => setAnswers((a) => ({ ...a, years }))}
          />
        </Question>
      );
      canAdvance = true;
      break;

    case 2:
      body = (
        <Question title={t.q2Title}>
          <ChoiceList
            choices={dayChoices}
            selected={answers.workingDaysPerWeek}
            onSelect={(workingDaysPerWeek) =>
              setAnswers((a) => ({ ...a, workingDaysPerWeek }))
            }
          />
        </Question>
      );
      canAdvance = answers.workingDaysPerWeek !== null;
      break;

    case 3:
      body = (
        <Question title={t.q3Title}>
          <ChoiceList
            choices={hourChoices}
            selected={answers.hoursPerDay}
            onSelect={(hoursPerDay) => setAnswers((a) => ({ ...a, hoursPerDay }))}
          />
        </Question>
      );
      canAdvance = answers.hoursPerDay !== null;
      break;

    case 4:
      body = (
        <Question title={t.q4Title} help={t.q4Help}>
          <Stepper
            value={answers.peoplePerDay}
            min={PEOPLE_MIN}
            max={PEOPLE_MAX}
            step={5}
            unit={t.q4Unit}
            onChange={(peoplePerDay) =>
              setAnswers((a) => ({ ...a, peoplePerDay }))
            }
          />
        </Question>
      );
      canAdvance = true;
      break;

    case 5:
      body = (
        <Question title={t.q5Title} help={t.q5Help}>
          <ChoiceList
            choices={stepChoices}
            selected={answers.stepsBucket}
            onSelect={(stepsBucket) => setAnswers((a) => ({ ...a, stepsBucket }))}
          />
        </Question>
      );
      canAdvance = answers.stepsBucket !== null;
      break;

    case 6:
      body = (
        <Question title={t.q6Title} help={t.q6Help}>
          <ChoiceList
            choices={knownForChoices}
            selected={answers.knownFor}
            onSelect={(knownFor) => setAnswers((a) => ({ ...a, knownFor }))}
          />
        </Question>
      );
      canAdvance = answers.knownFor !== null;
      break;

    case 7:
      body = (
        <PhotoStep
          strings={t}
          photo={photo}
          onChange={setPhoto}
          onSkip={goNext}
        />
      );
      canAdvance = photo !== null;
      break;

    case 8:
      body = (
        <DetailsStep
          strings={t}
          value={details}
          errors={detailErrors}
          showMrCode={mrMode}
          onChange={(patch) => setDetails((d) => ({ ...d, ...patch }))}
        />
      );
      canAdvance = true;
      primaryAction = () => {
        if (validateDetails()) goNext();
      };
      break;

    case 9:
      body = (
        <div className="px-5 pb-4 pt-6">
          <h1 className="text-2xl font-bold leading-snug text-ink">
            {t.consentTitle}
          </h1>

          <div className="mt-6 flex flex-col gap-4">
            <label className="flex gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={consentPrimary}
                onChange={(e) => {
                  setConsentPrimary(e.target.checked);
                  if (e.target.checked) setConsentError(null);
                }}
                className="mt-1 h-6 w-6 shrink-0 rounded border-slate-300"
              />
              <span className="text-base leading-relaxed text-ink">
                {t.consentPrimary}
              </span>
            </label>

            {/* Separate and unchecked by default (PRD §6.6). */}
            <label className="flex gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={consentPublic}
                onChange={(e) => setConsentPublic(e.target.checked)}
                className="mt-1 h-6 w-6 shrink-0 rounded border-slate-300"
              />
              <span className="text-base leading-relaxed text-ink">
                {t.consentPublic}
              </span>
            </label>
          </div>

          <FieldError message={consentError ?? undefined} />
          {submitError ? (
            <p className="mt-4 text-base font-medium text-red-600" role="alert">
              {submitError}
            </p>
          ) : null}

          <a
            href="/privacy"
            className="mt-5 inline-block text-base font-medium text-brand underline underline-offset-4"
          >
            {t.consentPrivacyLink}
          </a>
        </div>
      );
      canAdvance = consentPrimary && !submitting;
      primaryAction = submit;
      primaryLabel = submitting ? t.processingTitle : t.submit;
      break;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <ScreenHeader
        step={step}
        total={TOTAL_STEPS}
        stepLabel={t.stepOf(step, TOTAL_STEPS)}
        backLabel={t.back}
        onBack={goBack}
      />
      <div className="flex-1">{body}</div>
      <Footer>
        <button
          type="button"
          className="btn-primary"
          disabled={!canAdvance}
          onClick={primaryAction}
        >
          {primaryLabel}
        </button>
      </Footer>
    </main>
  );
};
