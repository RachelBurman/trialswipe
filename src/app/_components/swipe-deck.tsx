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
  const reasons = card.checks.slice(0, 3);

  return (
    <>
      <p
        className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${verdict.className}`}
      >
        {verdict.label}
      </p>

      <h3 className="mt-5 text-xl font-bold leading-8 text-slate-950 sm:text-2xl">
        {card.title}
      </h3>

      <p className="mt-4 text-base leading-7 text-slate-600">
        {card.verdictSummary}
      </p>

      {reasons.length > 0 && (
        <div className="mt-7 border-t border-slate-200 pt-6">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Why this result
          </h4>
          <ul className="mt-4 space-y-4">
            {reasons.map((check, index) => (
              <li
                key={`${check.kind}-${index}-${check.text}`}
                className="flex gap-3 text-sm leading-6 text-slate-700 sm:text-base"
              >
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700"
                />
                <span>{check.reason}</span>
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
          className="mt-7 flex min-h-12 w-full items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-base font-semibold text-emerald-900 outline-none transition hover:bg-emerald-100 focus:ring-4 focus:ring-emerald-100"
        >
          See details
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

export function SwipeDeck({ cards }: { cards: MatchCard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exploring, setExploring] = useState<MatchCard[]>([]);
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
    setCurrentIndex(0);
    setExploring([]);
    setDetailsCard(null);
    x.set(0);
  }, [cards, x]);

  const currentCard = cards[currentIndex];
  const visibleCards = cards.slice(currentIndex, currentIndex + 3);

  const finishSwipe = async (direction: SwipeDirection) => {
    if (!currentCard || isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    setIsAnimating(true);

    if (direction === 1) {
      setExploring((saved) => [...saved, currentCard]);
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

    setCurrentIndex((index) => index + 1);
    x.set(0);
    isAnimatingRef.current = false;
    setIsAnimating(false);
  };

  if (!currentCard) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Review complete
        </p>
        <h3 className="mt-3 text-2xl font-bold text-slate-950">
          Trials you&apos;re exploring
        </h3>

        {exploring.length > 0 ? (
          <>
            <p className="mt-3 leading-7 text-slate-600">
              You saved {exploring.length}{" "}
              {exploring.length === 1 ? "trial" : "trials"} to look into.
            </p>
            <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              {exploring.map((card) => (
                <li key={card.nctId} className="py-5">
                  <a
                    href={card.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-12 items-center justify-between gap-4 rounded-xl text-base font-semibold leading-6 text-emerald-900 outline-none transition hover:text-emerald-700 focus:ring-4 focus:ring-emerald-100"
                  >
                    <span>{card.title}</span>
                    <span aria-hidden="true" className="shrink-0 text-xl">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-4 leading-7 text-slate-600">
            You didn&apos;t save a trial this time. You can adjust your details
            above and search again whenever you&apos;re ready.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4 text-sm text-slate-500">
        <p>
          Trial {currentIndex + 1} of {cards.length}
        </p>
        <p>Drag or use the buttons</p>
      </div>

      <div className="grid items-start">
        {visibleCards.map((card, stackIndex) => {
          const isTopCard = stackIndex === 0;

          if (!isTopCard) {
            return (
              <article
                key={card.nctId}
                aria-hidden="true"
                className="pointer-events-none col-start-1 row-start-1 min-h-[32rem] origin-bottom overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                style={{
                  zIndex: 20 - stackIndex,
                  transform: `translateY(${stackIndex * 14}px) scale(${
                    1 - stackIndex * 0.035
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
              className="relative col-start-1 row-start-1 min-h-[32rem] cursor-grab touch-pan-y overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8"
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
                className="absolute left-5 top-5 -rotate-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-slate-600"
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

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
        <button
          type="button"
          disabled={isAnimating}
          onClick={() => void finishSwipe(-1)}
          className="min-h-14 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-wait disabled:opacity-50"
        >
          Not for me
        </button>
        <button
          type="button"
          disabled={isAnimating}
          onClick={() => void finishSwipe(1)}
          className="min-h-14 rounded-2xl bg-emerald-800 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-wait disabled:opacity-50"
        >
          Explore
        </button>
      </div>

      <p className="mt-4 text-center text-sm leading-6 text-slate-500">
        First-pass screen, not medical advice.
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
