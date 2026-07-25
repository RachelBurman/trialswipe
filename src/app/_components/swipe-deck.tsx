"use client";

import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { type RouterOutputs } from "~/trpc/react";

type MatchCard = RouterOutputs["match"]["run"][number];
type SwipeDirection = -1 | 1;

const DRAG_THRESHOLD = 110;

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
    className: "bg-slate-100 text-slate-700 ring-slate-600/15",
  },
};

const checkStatusCopy: Record<
  MatchCard["checks"][number]["status"],
  { label: string; className: string; dotClassName: string }
> = {
  pass: {
    label: "Pass",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-700/15",
    dotClassName: "bg-emerald-600",
  },
  unknown: {
    label: "More information needed",
    className: "bg-amber-50 text-amber-900 ring-amber-700/15",
    dotClassName: "bg-amber-500",
  },
  fail: {
    label: "Does not appear to match",
    className: "bg-slate-100 text-slate-700 ring-slate-600/15",
    dotClassName: "bg-slate-500",
  },
};

const travelBurdenCopy: Record<
  MatchCard["costEstimate"]["travelBurden"],
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-700/15",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-50 text-amber-900 ring-amber-700/15",
  },
  high: {
    label: "High",
    className: "bg-slate-100 text-slate-700 ring-slate-600/15",
  },
  unknown: {
    label: "Unknown",
    className: "bg-slate-100 text-slate-700 ring-slate-600/15",
  },
};

function CardContent({
  card,
  onSeeDetails,
}: {
  card: MatchCard;
  onSeeDetails?: () => void;
}) {
  const verdict = verdictCopy[card.verdict];
  const reasons = card.checks.slice(0, 2);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-extrabold ring-1 ring-inset ${verdict.className}`}
        >
          {verdict.label}
        </p>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-stone-400">
          {card.phase && <span>{card.phase.replaceAll("_", " ")}</span>}
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            />
            Recruiting
          </span>
        </div>
      </div>

      <h3 className="mt-5 line-clamp-4 text-2xl font-extrabold leading-8 tracking-[-0.025em] text-stone-950 sm:text-[1.7rem] sm:leading-9">
        {card.title}
      </h3>

      <p className="mt-4 line-clamp-4 text-[0.95rem] leading-7 text-stone-600">
        {card.verdictSummary}
      </p>

      {reasons.length > 0 && (
        <div className="mt-6 border-t border-stone-200 pt-5">
          <h4 className="text-xs font-extrabold uppercase tracking-[0.14em] text-stone-400">
            What stood out
          </h4>
          <ul className="mt-3 space-y-3">
            {reasons.map((check, index) => (
              <li
                key={`${check.kind}-${index}-${check.text}`}
                className="flex gap-3 text-sm leading-6 text-stone-700"
              >
                <span
                  aria-hidden="true"
                  className={`mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    check.status === "pass"
                      ? "bg-emerald-600"
                      : check.status === "unknown"
                        ? "bg-amber-500"
                        : "bg-stone-400"
                  }`}
                />
                <span className="line-clamp-2">{check.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onSeeDetails && (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onSeeDetails}
          className="mt-auto flex min-h-12 w-full items-center justify-center border-t border-stone-200 pt-5 text-sm font-extrabold text-emerald-800 outline-none transition hover:text-emerald-950 focus-visible:rounded-xl focus-visible:ring-4 focus-visible:ring-emerald-100"
        >
          See full eligibility details
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </button>
      )}
    </>
  );
}

function TrialDetails({
  card,
  onClose,
}: {
  card: MatchCard;
  onClose: () => void;
}) {
  const verdict = verdictCopy[card.verdict];
  const travelBurden = travelBurdenCopy[card.costEstimate.travelBurden];
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-details-title"
        className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl"
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
          <p className="text-sm font-semibold text-slate-600">Trial details</p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-slate-200"
          >
            Close
          </button>
        </div>

        <div className="space-y-9 px-5 py-7 sm:px-8 sm:py-9">
          <header>
            <p
              className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${verdict.className}`}
            >
              {verdict.label}
            </p>
            <h3
              id="trial-details-title"
              className="mt-4 text-2xl font-bold leading-9 text-slate-950"
            >
              {card.title}
            </h3>
            <p className="mt-4 leading-7 text-slate-600">
              {card.verdictSummary}
            </p>
          </header>

          <section aria-labelledby="eligibility-checks-heading">
            <h4
              id="eligibility-checks-heading"
              className="text-xl font-bold text-slate-950"
            >
              Eligibility checks
            </h4>

            {card.checks.length > 0 ? (
              <ul className="mt-5 space-y-4">
                {card.checks.map((check, index) => {
                  const status = checkStatusCopy[check.status];

                  return (
                    <li
                      key={`${check.kind}-${index}-${check.text}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-inset ring-slate-300">
                          {check.kind}
                        </span>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`h-2 w-2 rounded-full ${status.dotClassName}`}
                          />
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-4 font-semibold leading-7 text-slate-900">
                        {check.text}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                        {check.reason}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 leading-7 text-slate-600">
                No individual eligibility checks were available for this trial.
              </p>
            )}
          </section>

          <section
            aria-labelledby="travel-heading"
            className="rounded-2xl border border-slate-200 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 id="travel-heading" className="text-xl font-bold text-slate-950">
                Travel estimate
              </h4>
              <span
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${travelBurden.className}`}
              >
                {travelBurden.label} burden
              </span>
            </div>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-slate-500">
                  Listed sites
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">
                  {card.costEstimate.siteCount}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-500">
                  Nearest matching site
                </dt>
                <dd className="mt-1 text-base font-semibold text-slate-900">
                  {card.costEstimate.nearestSite ?? "No match found"}
                </dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-slate-200 pt-5 leading-7 text-slate-600">
              {card.costEstimate.note}
            </p>
          </section>

          <section aria-labelledby="doctor-questions-heading">
            <h4
              id="doctor-questions-heading"
              className="text-xl font-bold text-slate-950"
            >
              Questions to ask the trial team
            </h4>
            {card.doctorQuestions.length > 0 ? (
              <ol className="mt-5 space-y-4">
                {card.doctorQuestions.map((question, index) => (
                  <li
                    key={`${index}-${question}`}
                    className="flex gap-4 rounded-2xl bg-emerald-50/70 p-4 leading-7 text-slate-700"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{question}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 leading-7 text-slate-600">
                No suggested questions were generated for this trial.
              </p>
            )}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            This is an automated first-pass screen, not medical advice. Confirm
            eligibility with the trial team and your clinician.
          </aside>

          <button
            type="button"
            onClick={onClose}
            className="min-h-14 w-full rounded-2xl bg-emerald-800 px-5 py-3 text-base font-semibold text-white outline-none transition hover:bg-emerald-900 focus:ring-4 focus:ring-emerald-200"
          >
            Close details
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}

export function SwipeDeck({
  cards,
  currentIndex,
  savedCards,
  onIndexChange,
  onSave,
  onOpenSaved,
  onEditProfile,
}: {
  cards: MatchCard[];
  currentIndex: number;
  savedCards: MatchCard[];
  onIndexChange: (index: number) => void;
  onSave: (card: MatchCard) => void;
  onOpenSaved: () => void;
  onEditProfile: () => void;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [detailsCard, setDetailsCard] = useState<MatchCard | null>(null);
  const isAnimatingRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-3, 0, 3]);
  const cardOpacity = useTransform(
    x,
    [-500, -220, 0, 220, 500],
    [0, 1, 1, 1, 0],
  );
  const exploreOpacity = useTransform(
    x,
    [0, DRAG_THRESHOLD * 0.55, DRAG_THRESHOLD],
    [0, 0.35, 1],
  );
  const dismissOpacity = useTransform(
    x,
    [-DRAG_THRESHOLD, -DRAG_THRESHOLD * 0.55, 0],
    [1, 0.35, 0],
  );

  useEffect(() => {
    setDetailsCard(null);
    x.set(0);
  }, [cards, x]);

  const currentCard = cards[currentIndex];
  const visibleCards = cards.slice(currentIndex, currentIndex + 3);
  const isCurrentCardSaved = currentCard
    ? savedCards.some((savedCard) => savedCard.nctId === currentCard.nctId)
    : false;

  const finishSwipe = async (direction: SwipeDirection) => {
    if (!currentCard || isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    setIsAnimating(true);

    if (direction === 1) {
      onSave(currentCard);
    }

    const offscreenDistance =
      (typeof window === "undefined" ? 600 : window.innerWidth) + 240;

    if (shouldReduceMotion) {
      x.set(direction * offscreenDistance);
    } else {
      await animate(x, direction * offscreenDistance, {
        duration: 0.28,
        ease: [0.4, 0, 0.2, 1],
      });
    }

    onIndexChange(currentIndex + 1);
    x.set(0);
    isAnimatingRef.current = false;
    setIsAnimating(false);
  };

  if (!currentCard) {
    return (
      <div className="rounded-[2rem] border border-stone-200 bg-[#fffdf9] px-7 py-12 text-center shadow-[0_24px_70px_-40px_rgba(41,52,44,0.4)]">
        <span
          aria-hidden="true"
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-7 w-7"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
        </span>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-800">
          Review complete
        </p>
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-950">
          You&apos;ve seen every match
        </h3>
        <p className="mx-auto mt-3 max-w-sm leading-7 text-stone-500">
          You saved {savedCards.length}{" "}
          {savedCards.length === 1 ? "trial" : "trials"} to explore. You can
          revisit them or adjust your profile whenever you like.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenSaved}
            className="min-h-12 rounded-2xl bg-emerald-800 px-5 py-3 font-extrabold text-white outline-none transition hover:bg-emerald-900 focus:ring-4 focus:ring-emerald-100"
          >
            View saved ({savedCards.length})
          </button>
          <button
            type="button"
            onClick={onEditProfile}
            className="min-h-12 rounded-2xl border border-stone-300 bg-white px-5 py-3 font-bold text-stone-700 outline-none transition hover:bg-stone-50 focus:ring-4 focus:ring-stone-100"
          >
            Edit profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <p className="shrink-0 text-xs font-extrabold uppercase tracking-wider text-stone-500">
          {currentIndex + 1} of {cards.length}
        </p>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={cards.length}
          aria-valuenow={currentIndex + 1}
          aria-label="Trial review progress"
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200"
        >
          <motion.div
            className="h-full rounded-full bg-emerald-700"
            animate={{
              width: `${((currentIndex + 1) / cards.length) * 100}%`,
            }}
            transition={{ duration: 0.25 }}
          />
        </div>
        <p className="shrink-0 text-xs font-medium text-stone-400">
          Swipe to choose
        </p>
      </div>

      <div className="grid items-start">
        {visibleCards.map((card, stackIndex) => {
          const isTopCard = stackIndex === 0;

          if (!isTopCard) {
            return (
              <article
                key={card.nctId}
                aria-hidden="true"
                className="pointer-events-none col-start-1 row-start-1 min-h-[31rem] origin-bottom overflow-hidden rounded-[2rem] border border-stone-200 bg-[#fffdf9] shadow-sm"
                style={{
                  zIndex: 20 - stackIndex,
                  transform: `translateY(${stackIndex * 11}px) scale(${
                    1 - stackIndex * 0.028
                  })`,
                }}
              />
            );
          }

          return (
            <motion.article
              key={card.nctId}
              drag={isAnimating || detailsCard ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.82}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (info.offset.x >= DRAG_THRESHOLD) {
                  void finishSwipe(1);
                  return;
                }

                if (info.offset.x <= -DRAG_THRESHOLD) {
                  void finishSwipe(-1);
                  return;
                }

                void animate(x, 0, {
                  type: "spring",
                  stiffness: 420,
                  damping: 34,
                });
              }}
              whileDrag={{ cursor: "grabbing", scale: 1.01 }}
              className="relative col-start-1 row-start-1 flex min-h-[31rem] cursor-grab touch-pan-y flex-col overflow-hidden rounded-[2rem] border border-stone-200 bg-[#fffdf9] p-6 shadow-[0_28px_70px_-38px_rgba(41,52,44,0.55)] sm:min-h-[33rem] sm:p-7"
              style={{
                x,
                rotate,
                opacity: cardOpacity,
                zIndex: 30,
              }}
            >
              <motion.p
                aria-hidden="true"
                style={{ opacity: exploreOpacity }}
                className="absolute right-5 top-5 rotate-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-emerald-800"
              >
                Explore
              </motion.p>
              <motion.p
                aria-hidden="true"
                style={{ opacity: dismissOpacity }}
                className="absolute left-5 top-5 -rotate-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-rose-700"
              >
                Not for me
              </motion.p>

              <CardContent
                card={card}
                onSeeDetails={() => setDetailsCard(card)}
              />
            </motion.article>
          );
        })}
      </div>

      <div className="mt-8 flex items-start justify-center gap-14">
        <button
          type="button"
          disabled={isAnimating}
          onClick={() => void finishSwipe(-1)}
          aria-label="Not for me. Dismiss this trial."
          className="group flex flex-col items-center gap-2 text-sm font-bold text-stone-500 outline-none disabled:cursor-wait disabled:opacity-50"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600 shadow-[0_12px_28px_-18px_rgba(190,24,93,0.8)] transition group-hover:-translate-y-1 group-hover:bg-rose-50 group-focus:ring-4 group-focus:ring-rose-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </span>
          <span>Not for me</span>
        </button>
        <button
          type="button"
          disabled={isAnimating}
          onClick={() => void finishSwipe(1)}
          aria-label="Explore. Save this trial."
          className="group flex flex-col items-center gap-2 text-sm font-bold text-emerald-800 outline-none disabled:cursor-wait disabled:opacity-50"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-800 text-white shadow-[0_14px_30px_-16px_rgba(6,95,70,0.9)] transition group-hover:-translate-y-1 group-hover:bg-emerald-900 group-focus:ring-4 group-focus:ring-emerald-200">
            <svg
              viewBox="0 0 24 24"
              fill={isCurrentCardSaved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path d="M6.75 4.75A1.75 1.75 0 0 1 8.5 3h7a1.75 1.75 0 0 1 1.75 1.75V21L12 17.5 6.75 21V4.75Z" />
            </svg>
          </span>
          <span>{isCurrentCardSaved ? "Saved" : "Explore"}</span>
        </button>
      </div>

      <p className="mt-5 text-center text-xs leading-5 text-stone-400">
        Drag the card or use the buttons · First-pass screen, not medical
        advice.
      </p>

      <AnimatePresence>
        {detailsCard && (
          <TrialDetails
            key={detailsCard.nctId}
            card={detailsCard}
            onClose={() => setDetailsCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
