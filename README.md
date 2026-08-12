# Pharmacist Wrapped Portal — prototype

Personalised World Pharmacist Day films for retail pharmacists. A pharmacist
opens one link, answers six questions, uploads a photo, and downloads a film
with his own name, shop, photo and calculated statistics in it. No login, no
OTP, no waiting for a later date.

This repository is the **prototype**, scoped to one or two pharmacists at a
time. It deliberately leaves out the infrastructure a 30,000-registration
national campaign needs — see [Prototype vs production](#prototype-vs-production).

---

## What works today

| Piece | Status |
|---|---|
| Calculation engine (nine PRD §7.1 formulas, steps mapping, `earlyCareer`) | Done, 15 tests |
| Figure formatting — Indian numbering, rounded down | Done, 16 tests |
| Photo pipeline — on-device resize plus brightness/sharpness checks | Done, 12 tests |
| Download filenames safe across Indian scripts | Done, 12 tests |
| Render contract (`WrappedPayload`, PRD §7.5) | Done |
| Film built on the supplied reference plate, personalised per pharmacist | Done |
| Intake form — 9 screens, tap-first, autosave and resume | Done |
| Submit → render queue → live progress → download and share | Done |
| Ops dashboard — counts, by state, by MR code | Done |
| Hindi + English, all strings externalised | Done |
| Self-hosted fonts (Latin + Devanagari + serif) | Done |

## Running it

    npm install
    npm test        # 55 unit tests
    npm run dev     # portal on http://localhost:3000

Routes:

| Route | What it is |
|---|---|
| `/` | The form — landing, language, six questions, photo, details, consent |
| `/film/[id]` | Processing screen, then the film with download and share |
| `/admin` | Ops view. **Unauthenticated — add auth before deploying anywhere reachable** |
| `/privacy` | Plain-language data note |

Submissions, photos and finished films are written to `.data/` (gitignored).

## Deploying

**This app cannot run on Netlify, or on Vercel's serverless functions.** Not a
configuration problem — the architecture is incompatible.

Two of these are hard walls with no workaround:

| Requirement | Serverless reality |
|---|---|
| Remotion spawns a real Chromium to draw every frame | Function bundles cap at 250MB unzipped. Chromium is ~150MB on top of the 23MB compositor binary, and it has to be *executable*, not just present |
| Submissions, photos and finished films are written to `.data/` and served back later | The filesystem is read-only apart from `/tmp`, and `/tmp` is wiped between invocations — the film would not survive to be downloaded |

Two more are real but would only need rework, not a different platform:

| Requirement | Serverless reality |
|---|---|
| A render takes ~4 minutes | Synchronous functions cap at 10s (26s on paid plans). Netlify **background functions do allow up to 15 minutes**, so the render itself would fit — but they return 202 immediately and cannot hand the file back, so delivery would have to move to storage anyway |
| The render queue lives in the server process (`lib/render.ts`) | No process persists between requests; concurrent invocations would each hold their own empty queue |

A Netlify build that goes green would still give you a portal where the form
loads and **every submission fails**. Making the build pass would hide the
problem rather than solve it.

### What does work

Any container host — the `Dockerfile` covers all of them, and the code needs no
changes:

    docker build -t pharmacist-wrapped .
    docker run -p 3000:3000 -v pharmacist-data:/app/.data pharmacist-wrapped

- **Render.com / Railway / Fly.io** — point at the repo, they detect the
  Dockerfile. Attach a persistent disk mounted at `/app/.data`, or every film
  disappears on the next deploy.
- **A plain VM** (EC2, DigitalOcean) — same image, or just `npm ci && npm run
  build && npm start`.

Give it at least 2GB RAM and 2 vCPUs. Rendering is CPU-bound; on one shared vCPU
a film takes closer to ten minutes than four.

The image deliberately keeps dev dependencies, because the render pipeline calls
Remotion's bundler at runtime and that needs the TypeScript toolchain present.
`npm ci --omit=dev` produces an image that builds and then fails on first render.

### For the real campaign

The production split is the one PRD §8 describes and is genuinely serverless-
friendly: the form on Vercel or Netlify, rendering on **Remotion Lambda**, films
in **S3** behind CloudFront, submissions in **Postgres**. That removes every
constraint in the table above. It is also where the AWS concurrency quota
becomes the long-lead item — see [Prototype vs production](#prototype-vs-production).

Preview or render the film on its own:

    npm run remotion:studio
    npx remotion render remotion/index.ts PlateFilm out/film.mp4

Fonts are committed. To refresh them: `node scripts/fetch-fonts.mjs`.

### Compositions

- **`PlateFilm`** — the deliverable. The supplied reference film with this
  pharmacist's data composited over it. 1920×1080, 20s, original audio kept.
- `Wrapped` / `WrappedShort` — a self-contained vertical film (720×1280, 65s and
  25s) built before the reference plate arrived. Kept because it needs no source
  footage, and because the 25s cut solves a real sharing problem
  ([below](#sharing-limits)). Not the current deliverable.

---

## How the plate approach works

`public/plate/wrapped-plate.mp4` is the supplied reference film. It has one
pharmacist's sample data — Rahul Sharma, 18 years — **burned into the pixels**.

`remotion/plate/PlateFilm.tsx` plays it as the base layer, covers each burned-in
element, and redraws it from the pharmacist's payload. Every coordinate lives in
`remotion/plate/config.ts` and was measured off the real frames with
`scripts/measure-plate.mjs` rather than estimated by eye — the first eyeballed
pass was visibly wrong on the "Known for" scene.

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
| 15.9–17.6s | Digital hero shot | Six stat bubbles, name, subtitle |
| 17.7–20.0s | Certificate | Name, years, seal number, body copy |

### Two data bugs in the reference film, fixed here

1. **Interactions were 10× too high.** The 7s scene reads "4,70,000+" (470,000 —
   correct for 18 years × 85 people/day) but the 16s summary reads "4,700,000+",
   4.7 million. The overlay computes it once, so both scenes agree.
2. **A duplicated bubble.** The summary scene showed "5,600+ DAYS" twice. That
   position now carries the stadium multiple.

Every other number in the reference film reproduces exactly from the PRD §7.1
formulas — useful confirmation that portal and creative agree.
`lib/approx.test.ts` asserts it.

### Three things the overlay cannot fix

Properties of the supplied footage, not of the code.

1. **The pharmacist in the 15.9–17.6s hero shot is baked into the video.** It is
   a moving, AI-generated person, so every pharmacist's film currently shows that
   same face in that shot. The title-card photo *is* replaceable — it sits in a
   fixed frame and the code does replace it — but this one is not. Options: cut
   the scene, regenerate that plate with no person in it, or accept a stand-in.
2. **Garbled AI text throughout the background.** Shop signage reads "Prappeol &
   Korat", "Sneacis", "Kapout", "Ehemunt"; the wall clock reads "PVANSUT" in one
   shot and "PVANSIST" in another; medicine box labels are nonsense. For a
   national Mankind campaign that is a brand-quality risk, and no overlay can
   reach it — the footage needs regenerating or those shots replacing.
3. **The certificate signatures** are decorative AI scribbles. The captions under
   them were garbled ("Pharmacist, Days", "Emmmnnd Pharms") and are now covered
   and replaced; the squiggles remain.

### The clean-plate recommendation

Every cover panel in this codebase exists *only* because the sample data is
burned in. If the creative team exports the same film **without the data
layer** — clean plates, which is what PRD §8.1 assumes — then every cover can be
deleted, the overlay positions stay exactly as they are, and the result looks
composited rather than patched. About an afternoon of work here, and a large
quality gain. It is the highest-value thing to ask the creative team for.

---

## Number convention

One convention runs through the whole film: **Indian numbering**. Grouped digits
below a crore ("4,70,000+"), and the crore scale word above it ("2.2 CRORE+", or
करोड़ in Hindi). The reference film mixed Indian grouping with the Western
"22 MILLION+"; crore is both shorter on screen and how the audience reads a
number that size.

Every approximate figure rounds **down**, so a trailing "+" is never an
overstatement: 5,616 working days shows as "5,600+".

## Format

Landscape 1920×1080, confirmed as deliberate. Note the consequence for delivery:
the result page frames the film 16:9 rather than full-screen, and WhatsApp
Status will letterbox it.

## Sharing limits

- **No web page can post directly to WhatsApp Status or Instagram Stories.**
  `navigator.share({files})` hands the video to the app and the pharmacist picks
  the destination himself. Direct-to-story needs a native app.
- WhatsApp Status caps at 30s per segment, Instagram Stories at 15s. The 20s film
  is fine; the 65s `Wrapped` composition is not, which is why a 25s cut exists.

---

## Prototype vs production

Left out deliberately, all of it required for a 30,000-user campaign:

| Not built | Why it matters at scale |
|---|---|
| AWS Lambda render farm | Renders locally, one at a time, ~4 minutes per film on 4 cores. Remotion Lambda fans one film across ~20 workers, so 500 concurrent renders is **~10,000 concurrent Lambda executions** against a default account quota of 1,000. That quota request takes weeks — start it now (PRD §8.2). |
| SQS admission control | Without a hard concurrency cap, a field-force push throttles Lambda and renders fail at peak visibility. The in-process queue in `lib/render.ts` is the shape of it, not the scale. |
| Photo moderation (Rekognition + human queue) | PRD §6.5. No image should reach a render unmoderated. Note this conflicts with a 90-second promise for *flagged* photos — the classifier has to be the render gate, with human review as post-hoc takedown. |
| Server-side face detection | PRD §6.5. Deliberately not in the browser: a WASM model blows the sub-500KB page budget on a 2GB Android. Rekognition `DetectFaces` answers in under a second. |
| Rate limiting / bot check | PRD §6.2. Per-IP limits misfire badly in India (carrier CGNAT), and device fingerprinting conflicts with MR-assisted mode where one phone legitimately submits many times. MR sessions need their own higher limit. |
| Postgres | PRD §12 wants funnel drop-off and MR leaderboards — relational queries. The file store here is fine for two users and wrong for thirty thousand. |
| Auth on `/admin` | It lists every pharmacist's personal data. |
| WhatsApp backup delivery | PRD §8.4. The mobile number is collected and validated; nothing sends yet. |
| Data retention / DPDP compliance | PRD §13. Photos of identifiable people. Needs a stated deletion date and legal sign-off — the privacy page flags this. |

---

## Layout

    lib/
      calc.ts          Nine PRD §7.1 formulas, steps mapping, Indian grouping
      approx.ts        "5,600+" / "2.2 CRORE+", rounded down so claims stay true
      photo.ts         On-device resize, brightness and sharpness checks
      types.ts         WrappedPayload — the sole portal → renderer contract
      validation.ts    Server-side zod schema
      store.ts         File-backed submissions, photos, films
      render.ts        Render queue and Remotion orchestration
      i18n.ts          All portal strings, en + hi
      cities.ts        City → state lookup for the autocomplete
    components/
      Portal.tsx       The 9-screen flow, autosave, resume, submit
      controls.tsx     Steppers, choice cards, progress header
      PhotoStep.tsx    Photo capture with specific failure messages
      DetailsStep.tsx  Name, pharmacy, city autocomplete, mobile, MR code
      FilmView.tsx     Processing progress, then download and share
    app/
      api/submit       Validate → calculate → persist → queue
      api/status/[id]  Polled by the processing screen
      api/video/[id]   Serves the film, with range support
      api/retry/[id]   Re-runs a failed render on the stored payload
      film/[id]        Result page
      admin            Ops dashboard
      privacy          Plain-language data note
    remotion/
      plate/           The deliverable: reference plate + personalised overlays
      Wrapped.tsx      Self-contained vertical film (no source footage)
      theme.ts         Font loading, palette
    scripts/
      fetch-fonts.mjs   Self-hosts webfonts; renders must not fetch at runtime
      measure-plate.mjs Measures burned-in elements off the plate video

## Notes for whoever picks this up

- **Fonts must be local.** A render that fetches from fonts.gstatic.com can
  silently produce the wrong typeface, and for Hindi produces empty boxes.
  `ensureFontsLoaded()` also has to run *during* render, not at module scope —
  `staticFile()` returns a relative path at module-eval time and the render then
  dies on a `delayRender` timeout 30 seconds later. See the note in `theme.ts`.
- **Numbers are computed once and stored** in the payload. `/api/retry` replays
  that stored payload, so a re-render can never produce different figures than
  the first attempt (PRD §12).
- **The photo travels as a data URL** inside the submit body and the render
  props. Fine at this scale; production uploads to S3 with a presigned PUT and
  passes a URL instead.
- **The render is fire-and-forget** from the submit route, which works because
  `next start` is a long-lived process. On a serverless host the queue must move
  out of process.
- `zod` is pinned newer than the version Remotion wants, so `remotion render`
  prints a version-mismatch warning. Harmless — the compositions do not use
  Remotion's zod schema feature.
