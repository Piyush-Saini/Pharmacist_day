"use client";

import React from "react";

import { searchCities, STATES, stateForCity, type CityEntry } from "@/lib/cities";
import type { Strings } from "@/lib/i18n";
import { NAME_MAX, PHARMACY_MAX } from "@/lib/validation";

import { FieldError } from "./controls";

/**
 * Personalisation fields (PRD §6.4).
 *
 * City is one field with autocomplete that fills the state, rather than two
 * fields — one less thing to type. When the typed city is not in the list the
 * state selector appears rather than blocking, because the list will never
 * cover every tier-4 town.
 */

export interface DetailsValue {
  fullName: string;
  pharmacyName: string;
  city: string;
  state: string;
  mobile: string;
  mrCode: string;
}

export type DetailsErrors = Partial<Record<keyof DetailsValue, string>>;

export const DetailsStep: React.FC<{
  strings: Strings;
  value: DetailsValue;
  errors: DetailsErrors;
  showMrCode: boolean;
  onChange: (patch: Partial<DetailsValue>) => void;
}> = ({ strings: t, value, errors, showMrCode, onChange }) => {
  const [suggestions, setSuggestions] = React.useState<CityEntry[]>([]);
  const [cityTouched, setCityTouched] = React.useState(false);

  function handleCity(next: string) {
    onChange({ city: next });
    setSuggestions(searchCities(next));
    const matched = stateForCity(next);
    if (matched) onChange({ city: next, state: matched });
  }

  function pickCity(entry: CityEntry) {
    onChange({ city: entry.city, state: entry.state });
    setSuggestions([]);
    setCityTouched(true);
  }

  // Only ask for the state when the city lookup could not supply it.
  const needsState =
    cityTouched && value.city.trim().length > 1 && !stateForCity(value.city);

  return (
    <div className="px-5 pb-4 pt-6">
      <h1 className="text-2xl font-bold leading-snug text-ink">
        {t.detailsTitle}
      </h1>

      <div className="mt-6 flex flex-col gap-5">
        <label className="block">
          <span className="mb-2 block text-base font-semibold text-ink">
            {t.fullNameLabel}
          </span>
          <input
            className={`field ${errors.fullName ? "field-error" : ""}`}
            value={value.fullName}
            maxLength={NAME_MAX}
            autoComplete="name"
            placeholder={t.fullNamePlaceholder}
            onChange={(e) => onChange({ fullName: e.target.value })}
          />
          <FieldError message={errors.fullName} />
        </label>

        <label className="block">
          <span className="mb-2 block text-base font-semibold text-ink">
            {t.pharmacyLabel}
          </span>
          <input
            className={`field ${errors.pharmacyName ? "field-error" : ""}`}
            value={value.pharmacyName}
            maxLength={PHARMACY_MAX}
            placeholder={t.pharmacyPlaceholder}
            onChange={(e) => onChange({ pharmacyName: e.target.value })}
          />
          <FieldError message={errors.pharmacyName} />
        </label>

        <div className="relative block">
          <span className="mb-2 block text-base font-semibold text-ink">
            {t.cityLabel}
          </span>
          <input
            className={`field ${errors.city ? "field-error" : ""}`}
            value={value.city}
            autoComplete="address-level2"
            placeholder={t.cityPlaceholder}
            onChange={(e) => handleCity(e.target.value)}
            onBlur={() => {
              setCityTouched(true);
              // Delay so a tap on a suggestion still registers.
              setTimeout(() => setSuggestions([]), 150);
            }}
          />
          <FieldError message={errors.city} />

          {suggestions.length > 0 ? (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-lg">
              {suggestions.map((entry) => (
                <li key={`${entry.city}-${entry.state}`}>
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-base active:bg-slate-100"
                    onClick={() => pickCity(entry)}
                  >
                    <span className="font-medium text-ink">{entry.city}</span>
                    <span className="ml-2 text-sm text-slate-500">
                      {entry.state}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {value.state && !needsState ? (
          <p className="-mt-2 text-base text-slate-500">
            {t.stateLabel}: <span className="font-semibold text-ink">{value.state}</span>
          </p>
        ) : null}

        {needsState ? (
          <label className="block">
            <span className="mb-2 block text-base font-semibold text-ink">
              {t.stateLabel}
            </span>
            <select
              className={`field ${errors.state ? "field-error" : ""}`}
              value={value.state}
              onChange={(e) => onChange({ state: e.target.value })}
            >
              <option value="">—</option>
              {STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <FieldError message={errors.state} />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-base font-semibold text-ink">
            {t.mobileLabel}
          </span>
          <input
            className={`field ${errors.mobile ? "field-error" : ""}`}
            value={value.mobile}
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            placeholder="—"
            onChange={(e) =>
              onChange({ mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
            }
          />
          <p className="mt-2 text-sm text-slate-500">{t.mobileHelp}</p>
          <FieldError message={errors.mobile} />
        </label>

        {showMrCode ? (
          <label className="block">
            <span className="mb-2 block text-base font-semibold text-ink">
              {t.mrCodeLabel}
            </span>
            <input
              className="field"
              value={value.mrCode}
              maxLength={24}
              placeholder="—"
              onChange={(e) => onChange({ mrCode: e.target.value })}
            />
            <p className="mt-2 text-sm text-slate-500">{t.mrCodeHelp}</p>
          </label>
        ) : null}
      </div>
    </div>
  );
};
