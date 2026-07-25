"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type FormEvent, useState } from "react";

import { SavedTrialsPanel } from "~/app/_components/saved-trials-panel";
import { SwipeDeck } from "~/app/_components/swipe-deck";
import { api, type RouterOutputs } from "~/trpc/react";

type MatchCard = RouterOutputs["match"]["run"][number];
type AppView = "intake" | "deck";

const optionalText = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="relative block h-9 w-9 rounded-2xl bg-emerald-800 shadow-sm"
      >
        <span className="absolute left-2 top-2 h-4 w-3 -rotate-6 rounded-md border-2 border-white/90" />
        <span className="absolute bottom-2 right-2 h-4 w-3 rotate-6 rounded-md border-2 border-white/90" />
      </span>
      <span className="hidden text-lg font-extrabold tracking-tight text-stone-950 min-[350px]:inline">
        TrialSwipe
      </span>
    </div>
  );
}

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6.75 4.75A1.75 1.75 0 0 1 8.5 3h7a1.75 1.75 0 0 1 1.75 1.75V21L12 17.5 6.75 21V4.75Z" />
    </svg>
  );
}

function AppHeader({
  view,
  savedCount,
  onEditProfile,
  onOpenSaved,
}: {
  view: AppView;
  savedCount: number;
  onEditProfile: () => void;
  onOpenSaved: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f8f4ec]/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Brand />

        <nav aria-label="TrialSwipe actions" className="flex items-center gap-2">
          {view === "deck" && (
            <button
              type="button"
              onClick={onEditProfile}
              aria-label="Edit profile"
              className="inline-flex min-h-11 items-center rounded-full border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 shadow-sm outline-none transition hover:border-stone-300 hover:bg-stone-50 focus:ring-4 focus:ring-emerald-100"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              >
                <path d="m4 20 4.25-1 10.5-10.5a2.12 2.12 0 0 0-3-3L5.25 16 4 20Z" />
                <path d="m13.75 7.5 3 3" />
              </svg>
              <span className="hidden min-[480px]:inline">Edit profile</span>
              <span className="min-[480px]:hidden">Edit</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSaved}
            aria-label={`Open saved trials. ${savedCount} saved.`}
            className="relative inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-bold text-white shadow-sm outline-none transition hover:bg-emerald-900 focus:ring-4 focus:ring-emerald-200"
          >
            <BookmarkIcon filled={savedCount > 0} />
            <span>Saved</span>
            <span className="flex min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
              {savedCount}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}

export function IntakeScreen() {
  const [condition, setCondition] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [view, setView] = useState<AppView>("intake");
  const [deckIndex, setDeckIndex] = useState(0);
  const [savedCards, setSavedCards] = useState<MatchCard[]>([]);
  const [isSavedOpen, setIsSavedOpen] = useState(false);

  const match = api.match.run.useMutation();
  const cards = match.data ?? [];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCondition = condition.trim();
    if (!trimmedCondition) return;

    match.mutate(
      {
        profile: {
          condition: trimmedCondition,
          age: age ? Number(age) : undefined,
          sex: optionalText(sex),
          location: optionalText(location),
          notes: optionalText(notes),
        },
        limit: 8,
      },
      {
        onSuccess: () => {
          setDeckIndex(0);
          setView("deck");
        },
      },
    );
  };

  const saveCard = (card: MatchCard) => {
    setSavedCards((saved) =>
      saved.some((savedCard) => savedCard.nctId === card.nctId)
        ? saved
        : [...saved, card],
    );
  };

  const removeSavedCard = (nctId: string) => {
    setSavedCards((saved) =>
      saved.filter((savedCard) => savedCard.nctId !== nctId),
    );
  };

  return (
    <main className="min-h-dvh bg-[#f8f4ec] text-stone-900">
      <AppHeader
        view={view}
        savedCount={savedCards.length}
        onEditProfile={() => setView("intake")}
        onOpenSaved={() => setIsSavedOpen(true)}
      />

      <AnimatePresence mode="wait">
        {view === "intake" ? (
          <motion.div
            key="intake"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:py-16"
          >
            <section className="pt-2 lg:sticky lg:top-28">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-900">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-emerald-600"
                />
                Recruiting trials, made clearer
              </p>
              <h1 className="mt-6 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-stone-950 sm:text-5xl lg:text-6xl">
                Find a trial that may fit{" "}
                <span className="text-emerald-800">your life.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
                Tell us what matters. We&apos;ll screen live recruiting trials
                and explain the closest matches in plain English.
              </p>

              <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ["01", "Live trial data"],
                  ["02", "Clear reasons"],
                  ["03", "No sign-in needed"],
                ].map(([number, label], index) => (
                  <div
                    key={label}
                    className={`rounded-2xl border border-stone-200 bg-white/70 px-4 py-4 ${
                      index === 2 ? "col-span-2 sm:col-span-1" : ""
                    }`}
                  >
                    <p className="text-xs font-extrabold tracking-widest text-emerald-700">
                      {number}
                    </p>
                    <p className="mt-1 text-sm font-bold text-stone-800">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section
              aria-labelledby="intake-heading"
              className="rounded-[2rem] border border-stone-200 bg-[#fffdf9] p-5 shadow-[0_24px_70px_-35px_rgba(41,52,44,0.35)] sm:p-8"
            >
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-800">
                    Your profile
                  </p>
                  <h2
                    id="intake-heading"
                    className="mt-2 text-2xl font-extrabold tracking-tight text-stone-950"
                  >
                    A few details to start
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    Only the condition is required. Add what you&apos;re
                    comfortable sharing.
                  </p>
                </div>
                {match.data && (
                  <button
                    type="button"
                    onClick={() => setView("deck")}
                    className="shrink-0 rounded-full bg-stone-100 px-3 py-2 text-xs font-bold text-stone-600 outline-none transition hover:bg-stone-200 focus:ring-4 focus:ring-stone-100"
                  >
                    Back to matches
                  </button>
                )}
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="condition"
                    className="block text-sm font-bold text-stone-800"
                  >
                    Health condition
                  </label>
                  <input
                    id="condition"
                    name="condition"
                    type="text"
                    required
                    aria-describedby="condition-hint"
                    autoComplete="off"
                    value={condition}
                    onChange={(event) => setCondition(event.target.value)}
                    placeholder="For example, type 2 diabetes"
                    className="mt-2 min-h-14 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                  />
                  <p id="condition-hint" className="sr-only">
                    Enter the health condition you want to find trials for.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="age"
                      className="block text-sm font-bold text-stone-800"
                    >
                      Age{" "}
                      <span className="font-medium text-stone-400">
                        optional
                      </span>
                    </label>
                    <input
                      id="age"
                      name="age"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                      placeholder="54"
                      className="mt-2 min-h-14 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sex"
                      className="block text-sm font-bold text-stone-800"
                    >
                      Sex{" "}
                      <span className="font-medium text-stone-400">
                        optional
                      </span>
                    </label>
                    <input
                      id="sex"
                      name="sex"
                      type="text"
                      autoComplete="sex"
                      value={sex}
                      onChange={(event) => setSex(event.target.value)}
                      placeholder="Your answer"
                      className="mt-2 min-h-14 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-bold text-stone-800"
                  >
                    Location{" "}
                    <span className="font-medium text-stone-400">
                      optional
                    </span>
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    aria-describedby="location-hint"
                    autoComplete="address-level2"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="City or country"
                    className="mt-2 min-h-14 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                  />
                  <p id="location-hint" className="mt-2 text-xs text-stone-400">
                    A city or country is enough.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-bold text-stone-800"
                  >
                    Medicines or other details{" "}
                    <span className="font-medium text-stone-400">
                      optional
                    </span>
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    aria-describedby="notes-hint"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Anything that may affect whether a trial fits"
                    className="mt-2 w-full resize-y rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                  />
                  <p id="notes-hint" className="sr-only">
                    Add medicines, other conditions, or anything you think may
                    matter.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={match.isPending}
                  className="group flex min-h-14 w-full items-center justify-center rounded-2xl bg-emerald-800 px-6 py-4 text-base font-extrabold text-white shadow-[0_12px_28px_-14px_rgba(6,95,70,0.85)] outline-none transition hover:-translate-y-0.5 hover:bg-emerald-900 focus:ring-4 focus:ring-emerald-200 disabled:cursor-wait disabled:translate-y-0 disabled:bg-emerald-800/60"
                >
                  {match.isPending
                    ? "Screening trials for you..."
                    : match.data
                      ? "Update my matches"
                      : "Find trials"}
                  {!match.isPending && (
                    <span
                      aria-hidden="true"
                      className="ml-2 transition group-hover:translate-x-1"
                    >
                      →
                    </span>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-sm leading-6 text-stone-500">
                TrialSwipe gives an automated first-pass screen, not medical
                advice. Always confirm eligibility with the trial team and your
                clinician.
              </p>

              <div aria-live="polite">
                {match.isPending && (
                  <div
                    role="status"
                    className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-600" />
                      </span>
                      <p className="font-bold text-emerald-950">
                        Reading each trial&apos;s requirements
                      </p>
                    </div>
                    <p className="mt-2 pl-6 text-sm leading-6 text-emerald-800">
                      This usually takes a little while. You can keep this page
                      open while we build your deck.
                    </p>
                  </div>
                )}

                {match.isError && (
                  <div
                    role="alert"
                    className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-5"
                  >
                    <p className="font-bold text-rose-950">
                      We couldn&apos;t screen trials just now.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-rose-800">
                      Check your details and try again in a moment.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="deck"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.24 }}
            className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-9"
          >
            <header className="mb-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-800">
                Matches for
              </p>
              <div className="mt-1 flex items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-stone-950 sm:text-3xl">
                    {condition.trim()}
                  </h1>
                  <p className="mt-1 text-sm text-stone-500">
                    {[
                      age ? `Age ${age}` : null,
                      optionalText(location),
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Your personalised trial deck"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-600">
                  {cards.length} {cards.length === 1 ? "match" : "matches"}
                </span>
              </div>
            </header>

            {cards.length > 0 ? (
              <SwipeDeck
                cards={cards}
                currentIndex={deckIndex}
                savedCards={savedCards}
                onIndexChange={setDeckIndex}
                onSave={saveCard}
                onOpenSaved={() => setIsSavedOpen(true)}
                onEditProfile={() => setView("intake")}
              />
            ) : (
              <div className="rounded-[2rem] border border-stone-200 bg-white px-7 py-12 text-center shadow-sm">
                <span
                  aria-hidden="true"
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl"
                >
                  ↻
                </span>
                <h2 className="mt-5 text-xl font-extrabold text-stone-950">
                  No close matches this time
                </h2>
                <p className="mt-2 leading-7 text-stone-500">
                  Try a broader condition name or check back as new trials open.
                </p>
                <button
                  type="button"
                  onClick={() => setView("intake")}
                  className="mt-6 min-h-12 rounded-2xl bg-emerald-800 px-6 py-3 font-bold text-white outline-none transition hover:bg-emerald-900 focus:ring-4 focus:ring-emerald-100"
                >
                  Edit profile
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSavedOpen && (
          <SavedTrialsPanel
            cards={savedCards}
            onClose={() => setIsSavedOpen(false)}
            onRemove={removeSavedCard}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
