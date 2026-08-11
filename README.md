# Pharmacist Wrapped Portal — prototype

Personalised World Pharmacist Day films for retail pharmacists. A pharmacist
answers six questions, uploads a photo, and gets a film with his own name,
shop, photo and calculated statistics in it.

This repository is the **prototype**, scoped to one or two users at a time. It
deliberately leaves out the infrastructure a 30,000-registration national
campaign needs — see [Prototype vs production](#prototype-vs-production).

---

## What works today

| Piece | Status |
|---|---|
| Calculation engine (all nine PRD §7.1 formulas, steps mapping, `earlyCareer`) | Done, 27 unit tests |
| Approximate figure formatting ("5,600+", "22 MILLION+") | Done, tested against the reference film |
| Render contract (`WrappedPayload`, PRD §7.5) | Done |
| Film built on the supplied reference plate, personalised per pharmacist | Done |
| Hindi + English, all strings externalised | Done |
| Self-hosted fonts (Latin + Devanagari) | Done |
| Intake form, photo upload, submit → render → download | **Not built yet** |

The film currently renders from a sample payload. Wiring the form to it is the
next step.

## Running it

```bash
npm install
npm test                  # calculation engine
npm run remotion:studio    # preview and scrub the film
```

Render a film:

```bash
npx remotion render remotion/index.ts PlateFilm out/film.mp4
```

Fonts are committed. To refresh them:

```bash
node scripts/fetch-fonts.mjs
```

### Compositions

- **`PlateFilm`** — the deliverable. The supplied reference film with this
  pharmacist's data composited over it. 1920×1080, 20s, keeps the original audio.
- `Wrapped` / `WrappedShort` — a self-contained vertical film (720×1280, 65s and
  25s) built before the reference plate arrived. Kept because it needs no source
  footage and because the 25s cut solves a real sharing problem (see
  [Sharing](#sharing-limits)). Not the current deliverable.

---

## How the plate approach works

`public/plate/wrapped-plate.mp4` is the supplied reference film. It has one
pharmacist's sample data — Rahul Sharma, 18 years — **burned into the pixels**.

`remotion/plate/PlateFilm.tsx` plays it as the base layer, covers each burned-in
element, and redraws it from the pharmacist's payload. Every coordinate lives in
`remotion/plate/config.ts` and was measured off the real frames with
`scripts/measure-plate.mjs`, not estimated by eye.

Ten scenes carry personalised data:

| Time | Scene | Data replaced |
|---|---|---|
| 0.0–2.2s | Title card | Photo, name, pharmacy • city, state |
| 2.3–4.1s | White coats | Years, weeks, working days |
| 4.2–6.2s | Clock / neon | Total hours, continuous-years equivalent |
| 6.4–8.2s | Handover | People per day, lifetime interactions |
| 8.3–10.4s | Stadium | Stadium multiple |
| 10.5–11.9s | Counter | Minutes per person |
| 12.0–14.2s | Walking aisle | Lifetime steps, distance walked |
| 14.4–15.8s | Blister handover | "Known for" (Q6) |
| 15.9–17.6s | Digital hero shot | All six stat bubbles, name, subtitle |
| 17.7–20.0s | Certificate | Name, years, seal number, body copy |

### Two data bugs in the reference film, fixed here

1. **Interactions were 10× too high.** The 7s scene reads "4,70,000+" (470,000,
   correct for 18 years × 85 people/day) but the 16s summary reads
   "4,700,000+" — 4.7 million. The overlay computes it once and shows the same
   figure in both places.
2. **A duplicated bubble.** The summary scene showed "5,600+ DAYS" twice. That
   position now carries the stadium multiple instead.

The reference film's other numbers all reproduce exactly from the PRD §7.1
formulas, which is a useful confirmation that portal and creative agree —
`lib/approx.test.ts` asserts this.

### Three things the overlay cannot fix

These are properties of the supplied footage, not of the code.

1. **The pharmacist in the 15.9–17.6s hero shot is baked into the video.** It is
   a moving, AI-generated person. Every pharmacist's film currently shows that
   same face in that shot. The title card photo *is* replaceable (it sits in a
   fixed frame, and the code does replace it); this one is not. Options: cut the
   scene, re-shoot/re-generate that plate without a person in it, or accept a
   generic model.
2. **Garbled AI text throughout the background.** Shop signage reads "Prappeol &
   Korat", "Sneacis", "Kapout", "Ehemunt"; the wall clock reads "PVANSUT" in one
   shot and "PVANSIST" in another; medicine box labels are nonsense. For a
   national Mankind campaign this is a brand-quality risk. No overlay can reach
   it — it needs the footage regenerated or those shots replaced.
3. **The certificate signatures.** The two signature squiggles are decorative
   AI scribbles. The captions under them were garbled ("Pharmacist, Days",
   "Emmmnnd Pharms") and are now covered and replaced, but the squiggles remain.

### The clean-plate recommendation

Everything under "covers" in this codebase exists only because the sample data
is burned in. If the creative team exports the same film **without the data
layer** — clean plates, which is what PRD §8.1 assumes — then:

- every cover panel can be deleted
- the overlay positions stay exactly as they are
- the result looks composited rather than patched, because nothing is being
  hidden

That is a one-afternoon change to this code and a large quality gain. It is the
single highest-value thing to ask the creative team for.

---

## Sharing limits

The film is 20 seconds, which fits WhatsApp Status. Worth knowing for the
delivery design:

- **There is no way to post directly to WhatsApp Status or Instagram Stories
  from a web page.** `navigator.share({files})` hands the file to the app and
  the pharmacist picks Status himself. Direct-to-story needs a native app.
- WhatsApp Status caps at 30s per segment, Instagram Stories at 15s. A 20s film
  is fine; the 65s `Wrapped` composition is not, which is why a 25s cut exists.

## Format note

The reference film is **1920×1080 landscape**. The PRD targets Android-first
pharmacists sharing on WhatsApp, where vertical or square performs
substantially better. Worth confirming this was a deliberate choice — a vertical
version of the same plate would serve the actual audience better.

Also mixed number conventions: the film uses Indian digit grouping
("4,70,000+") in one scene and Western scale words ("22 MILLION+") in another.
`lib/approx.ts` reproduces the reference behaviour; if the creative team wants
one convention throughout, that is a two-line change.

---

## Prototype vs production

Left out deliberately, all of it required for a 30,000-user campaign:

| Not built | Why it matters at scale |
|---|---|
| AWS Lambda render farm | This renders locally. At 500 concurrent renders, Remotion Lambda fans each film across ~20 workers, so the AWS concurrency quota needs to be **~10,000+**, against a default of 1,000. That request takes weeks — start it now. |
| SQS admission control | Without a hard concurrency cap, a field-force push throttles Lambda and renders fail at peak visibility. |
| Photo moderation (Rekognition + human queue) | PRD §6.5. No image should reach a render unmoderated. |
| Server-side face/quality checks | PRD §6.5. Do these server-side, not in the browser — a MediaPipe bundle blows the sub-500KB page budget on a 2GB Android. |
| Rate limiting / bot check | PRD §6.2. Note per-IP limits misfire badly in India (carrier CGNAT), and device fingerprinting conflicts with MR-assisted mode, where one phone legitimately submits many times. |
| Postgres + admin dashboard | PRD §12 wants funnel drop-off and MR leaderboards — queries DynamoDB is poor at. |
| WhatsApp backup delivery | PRD §8.4. |
| Data retention / DPDP compliance | PRD §13. Photos of identifiable people; needs a stated deletion date and legal sign-off. |

## Layout

```
lib/
  calc.ts          Nine PRD §7.1 formulas, steps mapping, Indian number formatting
  approx.ts        "5,600+" / "22 MILLION+" figures, rounded down so claims stay true
  types.ts         WrappedPayload — the sole portal → renderer contract (PRD §7.5)
  validation.ts    Server-side zod schema for submissions
  i18n.ts          All portal strings, en + hi
  cities.ts        City → state lookup for the autocomplete
remotion/
  plate/           The deliverable: reference plate + personalised overlays
    config.ts      Measured geometry and scene timings
    PlateFilm.tsx  Composition
    copy.ts        On-screen copy, en + hi
    primitives.tsx Covers, scrims, bubbles
  Wrapped.tsx      Self-contained vertical film (no source footage needed)
  theme.ts         Font loading, palette
scripts/
  fetch-fonts.mjs  Self-hosts the webfonts; renders must not fetch fonts at runtime
  measure-plate.mjs Measures burned-in elements off the plate video
```

## Notes for whoever picks this up

- **Fonts must be local.** A render that fetches from fonts.gstatic.com can
  silently produce the wrong typeface, and for Hindi produces empty boxes.
  `ensureFontsLoaded()` also has to run *during* render, not at module scope —
  `staticFile()` returns a relative path at module-eval time and the render then
  dies on a `delayRender` timeout. There is a comment on this in `theme.ts`.
- **Numbers are computed once and stored** in the payload. Re-rendering a
  submission (PRD §12) must not produce different figures than the first attempt.
- `zod` is pinned newer than the version Remotion wants, so `remotion render`
  prints a version-mismatch warning. It is harmless here — the compositions do
  not use Remotion's zod schema feature.
