"use client";

import React from "react";

import { getStrings } from "@/lib/i18n";
import type { Language, RenderStatus } from "@/lib/types";

/**
 * Processing screen and result (PRD §6.7).
 *
 * The film is the confirmation — there is no "check back later" state. While it
 * renders, the screen shows real progress rather than a bare spinner, and a
 * real queue position when it is waiting behind another film.
 */

interface Status {
  status: RenderStatus;
  progress: number;
  queuePosition: number;
  language: Language;
  fullName: string;
  error: string | null;
}

const POLL_MS = 2000;

export const FilmView: React.FC<{ id: string }> = ({ id }) => {
  const [status, setStatus] = React.useState<Status | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [shareError, setShareError] = React.useState<string | null>(null);
  const [retrying, setRetrying] = React.useState(false);

  const t = getStrings(status?.language ?? "en");

  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const response = await fetch(`/api/status/${id}`, { cache: "no-store" });
        if (response.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = (await response.json()) as Status;
        if (cancelled) return;
        setStatus(data);

        // Stop polling once there is nothing left to wait for.
        if (data.status === "ready" || data.status === "failed") return;
      } catch {
        // A dropped request on a variable connection is expected; keep polling.
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS);
    }

    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, retrying]);

  async function share() {
    setShareError(null);
    const url = `/api/video/${id}`;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `${status?.fullName ?? "wrapped"}.mp4`, {
        type: "video/mp4",
      });

      // Web Share with a file hands the video to WhatsApp or Instagram. It
      // cannot post straight to Status or Stories — no web API can — so the
      // pharmacist picks the destination in the share sheet himself.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t.resultTitle });
        return;
      }
      setShareError(t.shareHelp);
    } catch (err) {
      // An aborted share is the pharmacist changing his mind, not an error.
      if (err instanceof Error && err.name === "AbortError") return;
      setShareError(t.shareHelp);
    }
  }

  async function retry() {
    setRetrying(true);
    try {
      await fetch(`/api/retry/${id}`, { method: "POST" });
      setStatus((s) => (s ? { ...s, status: "queued", progress: 0 } : s));
    } finally {
      setRetrying(false);
    }
  }

  if (notFound) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-ink">{t.renderFailedTitle}</h1>
        <a href="/" className="btn-primary mt-6">
          {t.startOver}
        </a>
      </Shell>
    );
  }

  if (!status) {
    return (
      <Shell>
        <Spinner />
      </Shell>
    );
  }

  if (status.status === "failed") {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-ink">{t.renderFailedTitle}</h1>
        <p className="mt-3 text-lg text-slate-600">{t.renderFailedSub}</p>
        <button
          type="button"
          className="btn-primary mt-6"
          onClick={retry}
          disabled={retrying}
        >
          {t.retryRender}
        </button>
      </Shell>
    );
  }

  if (status.status !== "ready") {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center">
          <Spinner />
          <h1 className="mt-6 text-2xl font-bold text-ink">
            {t.processingTitle}
          </h1>
          <p className="mt-2 text-lg text-slate-600">{t.processingSub}</p>

          {status.queuePosition > 0 ? (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-base font-medium text-amber-900">
              {t.processingQueued(status.queuePosition)}
            </p>
          ) : null}

          <div
            className="mt-8 h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={status.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${Math.max(3, status.progress)}%` }}
            />
          </div>
          <p className="mt-3 text-base font-semibold tabular-nums text-brand">
            {status.progress}%
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-ink">{t.resultTitle}</h1>
      <p className="mt-2 text-lg text-slate-600">{t.resultSub}</p>

      {/* Landscape film, so it sits in a 16:9 frame rather than filling the screen. */}
      <video
        className="mt-6 w-full rounded-2xl bg-black shadow-lg"
        src={`/api/video/${id}`}
        controls
        playsInline
        preload="metadata"
      />

      <div className="mt-6 flex flex-col gap-3">
        <a
          className="btn-primary"
          href={`/api/video/${id}?download=1`}
          download
        >
          {t.download}
        </a>
        <button type="button" className="btn-ghost" onClick={share}>
          {t.shareVideo}
        </button>
      </div>

      {shareError ? (
        <p className="mt-4 text-base text-slate-600">{shareError}</p>
      ) : null}

      <a
        href="/"
        className="mt-8 block text-center text-base font-medium text-brand underline underline-offset-4"
      >
        {t.startOver}
      </a>
    </Shell>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
    {children}
  </main>
);

const Spinner: React.FC = () => (
  <div
    className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand"
    role="status"
    aria-label="Loading"
  />
);
