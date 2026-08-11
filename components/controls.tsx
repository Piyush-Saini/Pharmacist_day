"use client";

import React from "react";

/**
 * Form primitives.
 *
 * Every choice is a tap target and every number is a stepper (PRD §6.3 UI
 * note): the pharmacist is often standing at his counter between customers,
 * and dropdowns and raw number pads both cost accuracy on a small screen.
 */

export const ScreenHeader: React.FC<{
  step: number;
  total: number;
  stepLabel: string;
  backLabel: string;
  onBack?: () => void;
}> = ({ step, total, stepLabel, backLabel, onBack }) => (
  <header className="sticky top-0 z-10 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur">
    <div className="flex items-center gap-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink active:bg-slate-200"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <span className="h-11 w-11" />
      )}
      <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {stepLabel}
      </span>
    </div>

    <div
      className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      <div
        className="h-full rounded-full bg-brand transition-all duration-300"
        style={{ width: `${(step / total) * 100}%` }}
      />
    </div>
  </header>
);

export const Question: React.FC<{
  title: string;
  help?: string;
  children: React.ReactNode;
}> = ({ title, help, children }) => (
  <div className="px-5 pb-4 pt-6">
    <h1 className="text-2xl font-bold leading-snug text-ink">{title}</h1>
    {help ? <p className="mt-2 text-base text-slate-500">{help}</p> : null}
    <div className="mt-6">{children}</div>
  </div>
);

export interface Choice<T> {
  value: T;
  label: string;
}

export function ChoiceList<T extends string | number>({
  choices,
  selected,
  onSelect,
  columns = 1,
}: {
  choices: Choice<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
  columns?: 1 | 2;
}) {
  return (
    <div
      className={columns === 2 ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}
      role="radiogroup"
    >
      {choices.map((choice) => {
        const isSelected = selected === choice.value;
        return (
          <button
            key={String(choice.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(choice.value)}
            className={`tap-card ${isSelected ? "tap-card-selected" : ""} ${
              columns === 2 ? "flex items-center justify-center text-center" : ""
            }`}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * +/− stepper with a large visible number.
 *
 * Holding a button repeats, because "22 years" would otherwise be 22 taps.
 */
export const Stepper: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}> = ({ value, min, max, step = 1, unit, onChange }) => {
  const repeatTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const holdDelay = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Set once a hold starts repeating, so the release does not add one more. */
  const didRepeat = React.useRef(false);

  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  const stopRepeat = React.useCallback(() => {
    if (repeatTimer.current) clearInterval(repeatTimer.current);
    if (holdDelay.current) clearTimeout(holdDelay.current);
    repeatTimer.current = null;
    holdDelay.current = null;
  }, []);

  React.useEffect(() => stopRepeat, [stopRepeat]);

  // Kept in a ref so the repeat interval always sees the latest value.
  const nextValueRef = React.useRef<(direction: 1 | -1) => number>(() => value);
  nextValueRef.current = (direction: 1 | -1) => clamp(value + direction * step);

  const startRepeat = (direction: 1 | -1) => {
    stopRepeat();
    didRepeat.current = false;
    holdDelay.current = setTimeout(() => {
      repeatTimer.current = setInterval(() => {
        const next = nextValueRef.current(direction);
        // At the end of the range the button goes disabled, and a disabled
        // element may never fire pointerup — so stop from inside the loop.
        if (next === value) {
          stopRepeat();
          return;
        }
        didRepeat.current = true;
        onChange(next);
      }, 90);
    }, 420);
  };

  const button = (direction: 1 | -1, label: string) => (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        // A hold already applied its increments; releasing must not add one.
        if (didRepeat.current) {
          didRepeat.current = false;
          return;
        }
        onChange(clamp(value + direction * step));
      }}
      onPointerDown={() => startRepeat(direction)}
      onPointerUp={stopRepeat}
      onPointerLeave={stopRepeat}
      onPointerCancel={stopRepeat}
      disabled={direction === 1 ? value >= max : value <= min}
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-3xl font-semibold text-brand transition active:scale-95 disabled:opacity-40"
    >
      {direction === 1 ? "+" : "−"}
    </button>
  );

  return (
    <div className="flex items-center justify-between gap-4">
      {button(-1, "Decrease")}
      <div className="flex flex-1 flex-col items-center">
        <span
          className="text-5xl font-bold tabular-nums text-ink"
          aria-live="polite"
        >
          {value}
        </span>
        <span className="mt-1 text-sm font-medium uppercase tracking-wide text-slate-500">
          {unit}
        </span>
      </div>
      {button(1, "Increase")}
    </div>
  );
};

export const Footer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="sticky bottom-0 mt-auto border-t border-slate-200 bg-paper/95 px-5 pb-6 pt-4 backdrop-blur">
    {children}
  </div>
);

export const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p className="mt-2 text-sm font-medium text-red-600" role="alert">
      {message}
    </p>
  ) : null;
