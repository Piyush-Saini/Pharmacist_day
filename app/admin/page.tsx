import { listSubmissions } from "@/lib/store";

/**
 * Ops dashboard (PRD §12).
 *
 * Gated by basic auth in middleware.ts, which fails closed when ADMIN_PASSWORD
 * is unset — this page lists every pharmacist's name, pharmacy and city, so an
 * unconfigured deploy should lose the dashboard rather than expose it.
 */

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-800",
  rendering: "bg-blue-100 text-blue-800",
  queued: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
};

export default async function AdminPage() {
  const records = await listSubmissions();

  const total = records.length;
  const ready = records.filter((r) => r.status === "ready").length;
  const failed = records.filter((r) => r.status === "failed").length;
  const inFlight = records.filter(
    (r) => r.status === "queued" || r.status === "rendering",
  ).length;
  const withoutPhoto = records.filter((r) => !r.payload.photoUrl).length;

  const byState = new Map<string, number>();
  const byMr = new Map<string, number>();
  for (const r of records) {
    const state = r.payload.personalisation.state || "—";
    byState.set(state, (byState.get(state) ?? 0) + 1);
    const mr = r.payload.personalisation.mrCode;
    if (mr) byMr.set(mr, (byMr.get(mr) ?? 0) + 1);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold text-ink">Registrations</h1>
      <p className="mt-1 text-base text-slate-500">
        Prototype dashboard, behind basic auth. Fine for a handful of ops users;
        the campaign needs real accounts and a record of who viewed what.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Total" value={total} />
        <Stat label="Ready" value={ready} />
        <Stat label="In flight" value={inFlight} />
        <Stat label="Failed" value={failed} />
        <Stat label="No photo" value={withoutPhoto} />
      </div>

      {byMr.size > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-ink">By MR code</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {[...byMr.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([mr, count]) => (
                <li
                  key={mr}
                  className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200"
                >
                  <span className="font-semibold text-ink">{mr}</span>
                  <span className="ml-2 text-slate-500">{count}</span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink">By state</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {[...byState.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([state, count]) => (
              <li
                key={state}
                className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200"
              >
                <span className="font-semibold text-ink">{state}</span>
                <span className="ml-2 text-slate-500">{count}</span>
              </li>
            ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Submissions</h2>
        {records.length === 0 ? (
          <p className="mt-3 text-base text-slate-500">Nothing yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl ring-1 ring-slate-200">
            <table className="w-full bg-white text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Pharmacy</th>
                  <th className="px-4 py-3 font-semibold">City</th>
                  <th className="px-4 py-3 font-semibold">Yrs</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Film</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.payload.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-ink">
                      {r.payload.personalisation.fullName}
                      {r.payload.earlyCareer ? (
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                          early
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.payload.personalisation.pharmacyName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.payload.personalisation.city}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {r.payload.inputs.years}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          statusStyles[r.status] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {r.status}
                        {r.status === "rendering" ? ` ${r.progress}%` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "ready" ? (
                        <a
                          className="font-medium text-brand underline underline-offset-2"
                          href={`/film/${r.payload.id}`}
                        >
                          open
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
    <div className="text-2xl font-bold tabular-nums text-ink">{value}</div>
    <div className="mt-0.5 text-sm text-slate-500">{label}</div>
  </div>
);
