"use client";

import React from "react";

import type { Strings } from "@/lib/i18n";
import { processPhoto, type PhotoProblem } from "@/lib/photo";

/**
 * Photo step (PRD §6.5).
 *
 * Failures are named specifically — "too dark", "blurry", "too small" — with the
 * remedy in the same sentence, because "invalid input" gives a pharmacist
 * standing at his counter nothing to act on. Retries are unlimited, and there
 * is always a way past this screen: a pharmacist who cannot produce an
 * acceptable photo still gets a film, built from his name instead.
 */

export const PhotoStep: React.FC<{
  strings: Strings;
  photo: string | null;
  onChange: (dataUrl: string | null) => void;
  onSkip: () => void;
}> = ({ strings: t, photo, onChange, onSkip }) => {
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<PhotoProblem | null>(null);
  const [confirmSkip, setConfirmSkip] = React.useState(false);
  const cameraInput = React.useRef<HTMLInputElement>(null);
  const galleryInput = React.useRef<HTMLInputElement>(null);

  const messages: Record<PhotoProblem, string> = {
    unreadable: t.photoErrUnreadable,
    too_small: t.photoErrTooSmall,
    too_dark: t.photoErrTooDark,
    blurry: t.photoErrBlurry,
  };

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file twice still fires a change event.
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    setProblem(null);
    try {
      const result = await processPhoto(file);
      if (!result.ok || !result.dataUrl) {
        setProblem(result.problem ?? "unreadable");
        onChange(null);
        return;
      }
      onChange(result.dataUrl);
    } catch {
      setProblem("unreadable");
      onChange(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 pb-4 pt-6">
      <h1 className="text-2xl font-bold leading-snug text-ink">
        {t.photoTitle}
      </h1>
      <p className="mt-2 text-base text-slate-500">{t.photoHelp}</p>

      <div className="mt-6">
        {photo ? (
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt=""
              className="h-64 w-64 rounded-3xl object-cover shadow-md ring-4 ring-brand/30"
            />
            <p className="mt-4 text-base font-semibold text-emerald-700">
              ✓ {t.photoGood}
            </p>
          </div>
        ) : (
          <div className="flex h-64 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white">
            {busy ? (
              <>
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
                <p className="mt-4 text-base text-slate-500">
                  {t.photoChecking}
                </p>
              </>
            ) : (
              <GuideIllustration
                goodLabel={t.photoExampleGood}
                badLabel={t.photoExampleBad}
              />
            )}
          </div>
        )}
      </div>

      {problem ? (
        <div
          className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3"
          role="alert"
        >
          <p className="text-base font-medium text-amber-900">
            {messages[problem]}
          </p>
        </div>
      ) : null}

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={() => cameraInput.current?.click()}
        >
          {photo ? t.photoRetake : t.photoTake}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={busy}
          onClick={() => galleryInput.current?.click()}
        >
          {t.photoChoose}
        </button>
      </div>

      {/* The way past this screen — never let a bad photo end the submission. */}
      <div className="mt-6 border-t border-slate-200 pt-5">
        {confirmSkip ? (
          <div className="rounded-2xl bg-slate-100 px-4 py-4">
            <p className="text-base text-slate-700">{t.photoSkipConfirm}</p>
            <button
              type="button"
              className="btn-primary mt-4"
              onClick={() => {
                onChange(null);
                onSkip();
              }}
            >
              {t.next}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmSkip(true)}
            className="w-full text-center text-base font-medium text-slate-500 underline underline-offset-4"
          >
            {t.photoSkip}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Side-by-side good/bad guidance (PRD §6.5), drawn rather than shipped as
 * images so it costs nothing against the page-weight budget.
 */
const GuideIllustration: React.FC<{ goodLabel: string; badLabel: string }> = ({
  goodLabel,
  badLabel,
}) => (
  <div className="flex items-center gap-6">
    <figure className="flex flex-col items-center">
      <svg width="82" height="82" viewBox="0 0 82 82" aria-hidden>
        <rect width="82" height="82" rx="14" fill="#E8F0FB" />
        <circle cx="41" cy="32" r="14" fill="#0E4C92" />
        <path d="M17 74c4-15 12-22 24-22s20 7 24 22" fill="#0E4C92" />
      </svg>
      <figcaption className="mt-2 text-sm font-semibold text-emerald-700">
        ✓ {goodLabel}
      </figcaption>
    </figure>

    <figure className="flex flex-col items-center">
      <svg width="82" height="82" viewBox="0 0 82 82" aria-hidden>
        <rect width="82" height="82" rx="14" fill="#F1F1F1" />
        <circle cx="26" cy="30" r="9" fill="#B6BCC6" />
        <circle cx="55" cy="34" r="9" fill="#B6BCC6" />
        <path d="M8 72c3-11 9-16 18-16s15 5 18 16" fill="#B6BCC6" />
        <path d="M38 74c3-10 8-15 17-15s14 5 17 15" fill="#C9CED6" />
      </svg>
      <figcaption className="mt-2 text-sm font-semibold text-slate-500">
        ✕ {badLabel}
      </figcaption>
    </figure>
  </div>
);
