/**
 * Plain-language privacy note (PRD §6.6) — deliberately not a wall of legal
 * text.
 *
 * The retention period and the final wording are pending legal sign-off
 * (PRD §13, Open Question 3). The placeholders below are marked so they cannot
 * ship unnoticed.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <a
        href="/"
        className="text-base font-medium text-brand underline underline-offset-4"
      >
        ← Back
      </a>

      <h1 className="mt-6 text-2xl font-bold text-ink">
        How we handle your data
      </h1>

      <div className="mt-6 flex flex-col gap-5 text-base leading-relaxed text-slate-700">
        <p>
          <strong className="text-ink">What we collect.</strong> Your answers to
          six questions, your name, your pharmacy name, your city and state, the
          photo you upload, and — only if you choose to give it — your mobile
          number.
        </p>
        <p>
          <strong className="text-ink">What we do with it.</strong> We use it to
          generate your personalised World Pharmacist Day film. Mankind Pharma
          may use the film in World Pharmacist Day communications. We only show
          your film publicly — on social media or in press — if you ticked the
          second box.
        </p>
        <p>
          <strong className="text-ink">Your mobile number.</strong> Optional. It
          is used for one thing: sending you a WhatsApp copy of your film as a
          backup. Leaving it blank does not stop you downloading the film.
        </p>
        <p>
          <strong className="text-ink">Who can see your film.</strong> Your film
          sits at a private web address that cannot be guessed. There is no
          login. Anyone you share that address with can watch it, so treat it
          like the video file itself.
        </p>
        <p className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
          <strong>Pending legal sign-off:</strong> the retention period for
          photos, personal data and film links has not been finalised. This
          section must state a specific deletion date before the portal goes
          live (PRD §13).
        </p>
        <p>
          <strong className="text-ink">Getting your data removed.</strong> Write
          to the campaign team and we will delete your submission, your photo and
          your film.
        </p>
      </div>
    </main>
  );
}
