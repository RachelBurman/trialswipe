"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { type RouterOutputs } from "~/trpc/react";

type MatchCard = RouterOutputs["match"]["run"][number];

const verdictCopy: Record<
  MatchCard["verdict"],
  { label: string; className: string }
> = {
  likely_eligible: {
    label: "Likely eligible",
    className: "bg-emerald-50 text-emerald-800",
  },
  needs_more_info: {
    label: "More information needed",
    className: "bg-amber-50 text-amber-900",
  },
  likely_ineligible: {
    label: "Likely not eligible",
    className: "bg-stone-100 text-stone-600",
  },
};

export function SavedTrialsPanel({
  cards,
  onClose,
  onRemove,
}: {
  cards: MatchCard[];
  onClose: () => void;
  onRemove: (nctId: string) => void;
}) {
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
      className="fixed inset-0 z-[120] flex items-end justify-center bg-stone-950/35 backdrop-blur-[2px] sm:items-stretch sm:justify-end"
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
        aria-labelledby="saved-trials-title"
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-[#fffdf8] shadow-2xl sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-[2rem]"
        initial={{ y: 40, x: 0 }}
        animate={{ y: 0, x: 0 }}
        exit={{ y: 40, x: 0 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
              Your shortlist
            </p>
            <h2
              id="saved-trials-title"
              className="mt-1 text-2xl font-bold tracking-tight text-stone-950"
            >
              Saved trials
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-11 min-w-11 items-center justify-center rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 outline-none transition hover:bg-stone-50 focus:ring-4 focus:ring-emerald-100"
          >
            Close
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          {cards.length > 0 ? (
            <>
              <p className="text-sm leading-6 text-stone-500">
                {cards.length} {cards.length === 1 ? "trial" : "trials"} saved
                for this session.
              </p>
              <ul className="mt-5 space-y-4">
                {cards.map((card) => {
                  const verdict = verdictCopy[card.verdict];

                  return (
                    <li
                      key={card.nctId}
                      className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
                    >
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${verdict.className}`}
                      >
                        {verdict.label}
                      </span>
                      <h3 className="mt-3 text-base font-bold leading-6 text-stone-950">
                        {card.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">
                        {card.verdictSummary}
                      </p>
                      <div className="mt-5 flex items-center gap-3">
                        <a
                          href={card.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white outline-none transition hover:bg-emerald-900 focus:ring-4 focus:ring-emerald-100"
                        >
                          View trial
                          <span aria-hidden="true" className="ml-2">
                            ↗
                          </span>
                        </a>
                        <button
                          type="button"
                          onClick={() => onRemove(card.nctId)}
                          className="min-h-11 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-500 outline-none transition hover:bg-stone-50 hover:text-stone-800 focus:ring-4 focus:ring-stone-100"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center">
              <span
                aria-hidden="true"
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                >
                  <path d="M6.75 4.75A1.75 1.75 0 0 1 8.5 3h7A1.75 1.75 0 0 1 17.25 4.75V21L12 17.5 6.75 21V4.75Z" />
                </svg>
              </span>
              <h3 className="mt-4 text-lg font-bold text-stone-950">
                Nothing saved yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Swipe right on a trial you want to explore and it will appear
                here.
              </p>
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
