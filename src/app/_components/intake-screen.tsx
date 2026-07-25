"use client";

import { type FormEvent, useState } from "react";

import { api, type RouterOutputs } from "~/trpc/react";

type MatchCard = RouterOutputs["match"]["run"][number];

const verdictCopy: Record<
  MatchCard["verdict"],
  { label: string; className: string }
> = {
  likely_eligible: {
    label: "Likely eligible",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-700/15",
  },
  needs_more_info: {
    label: "More information needed",
    className: "bg-amber-50 text-amber-900 ring-amber-700/15",
  },
  likely_ineligible: {
    label: "Likely not eligible",
    className: "bg-rose-50 text-rose-800 ring-rose-700/15",
  },
};

const optionalText = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export function IntakeScreen() {
  const [condition, setCondition] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const match = api.match.run.useMutation();
  const cards = match.data ?? [];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCondition = condition.trim();
    if (!trimmedCondition) return;

    match.mutate({
      profile: {
        condition: trimmedCondition,
        age: age ? Number(age) : undefined,
        sex: optionalText(sex),
        location: optionalText(location),
        notes: optionalText(notes),
      },
      limit: 8,
    });
  };

  return (
    <main className="min-h-screen bg-[#f3f7f4] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 text-center sm:mb-10">
          <p className="mb-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-900">
            TrialSwipe
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Let&apos;s find trials that may fit you
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Tell us a little about what you&apos;re looking for. We&apos;ll
            screen recruiting trials and show the closest matches first.
          </p>
        </header>

        <section
          aria-labelledby="intake-heading"
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="mb-7">
            <h2
              id="intake-heading"
              className="text-xl font-semibold text-slate-950 sm:text-2xl"
            >
              About you
            </h2>
            <p className="mt-2 leading-6 text-slate-600">
              Only the condition is required. Add anything else you&apos;re
              comfortable sharing to help improve the screening.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="condition"
                className="block text-base font-semibold text-slate-900"
              >
                Health condition
              </label>
              <p id="condition-hint" className="mt-1 text-sm text-slate-500">
                For example, type 2 diabetes or asthma.
              </p>
              <input
                id="condition"
                name="condition"
                type="text"
                required
                aria-describedby="condition-hint"
                autoComplete="off"
                value={condition}
                onChange={(event) => setCondition(event.target.value)}
                placeholder="Enter a condition"
                className="mt-3 min-h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="age"
                  className="block text-base font-semibold text-slate-900"
                >
                  Age <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder="Your age"
                  className="mt-3 min-h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="sex"
                  className="block text-base font-semibold text-slate-900"
                >
                  Sex <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  id="sex"
                  name="sex"
                  type="text"
                  autoComplete="sex"
                  value={sex}
                  onChange={(event) => setSex(event.target.value)}
                  placeholder="How you describe your sex"
                  className="mt-3 min-h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-base font-semibold text-slate-900"
              >
                Location{" "}
                <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <p id="location-hint" className="mt-1 text-sm text-slate-500">
                A city or country is enough.
              </p>
              <input
                id="location"
                name="location"
                type="text"
                aria-describedby="location-hint"
                autoComplete="address-level2"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="For example, London"
                className="mt-3 min-h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-base font-semibold text-slate-900"
              >
                Anything else{" "}
                <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <p id="notes-hint" className="mt-1 text-sm text-slate-500">
                You can mention medicines, other conditions, or anything you
                think may matter.
              </p>
              <textarea
                id="notes"
                name="notes"
                rows={5}
                aria-describedby="notes-hint"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add a note"
                className="mt-3 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              disabled={match.isPending}
              className="min-h-14 w-full rounded-2xl bg-emerald-800 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-wait disabled:bg-emerald-800/60"
            >
              {match.isPending ? "Screening trials for you..." : "Find trials"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm leading-6 text-slate-500">
            This is an early screening, not a medical decision. The trial team
            always confirms who can take part.
          </p>
        </section>

        <div aria-live="polite">
          {match.isPending && (
            <div
              role="status"
              className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center"
            >
              <p className="text-lg font-semibold text-emerald-950">
                Screening trials for you...
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-800">
                This can take a little while. We&apos;re reading each
                trial&apos;s requirements.
              </p>
            </div>
          )}

          {match.isError && (
            <div
              role="alert"
              className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 px-6 py-6"
            >
              <p className="font-semibold text-rose-950">
                We couldn&apos;t screen trials just now.
              </p>
              <p className="mt-2 leading-6 text-rose-800">
                Please check your details and try again in a moment.
              </p>
            </div>
          )}

          {match.isSuccess && !match.isPending && (
            <section
              aria-labelledby="results-heading"
              className="mt-10 sm:mt-12"
            >
              <div className="mb-5">
                <h2
                  id="results-heading"
                  className="text-2xl font-bold text-slate-950 sm:text-3xl"
                >
                  Trials that may fit
                </h2>
                <p className="mt-2 leading-6 text-slate-600">
                  We found {cards.length}{" "}
                  {cards.length === 1 ? "trial" : "trials"} to review.
                </p>
              </div>

              {cards.length > 0 ? (
                <ul className="space-y-4">
                  {cards.map((card) => {
                    const verdict = verdictCopy[card.verdict];

                    return (
                      <li
                        key={card.nctId}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                      >
                        <p
                          className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${verdict.className}`}
                        >
                          {verdict.label}
                        </p>
                        <h3 className="mt-4 text-lg font-semibold leading-7 text-slate-950 sm:text-xl">
                          {card.title}
                        </h3>
                        <p className="mt-3 leading-7 text-slate-600">
                          {card.verdictSummary}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center">
                  <p className="font-semibold text-slate-900">
                    We didn&apos;t find a close match this time.
                  </p>
                  <p className="mt-2 leading-6 text-slate-600">
                    Try a broader condition name or check back later as new
                    trials open.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
