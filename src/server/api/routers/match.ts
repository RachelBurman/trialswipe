import { z } from "zod";

import {
  clinicalTrialSchema,
  searchRecruitingTrials,
  type ClinicalTrial,
} from "~/server/clinical-trials";
import {
  patientProfileSchema,
  screeningResultSchema,
  screenTrialEligibility,
  type GatekeeperScreeningResult,
  type PatientProfile,
} from "~/server/eligibility-screening";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const travelEstimateSchema = z.object({
  siteCount: z.number(),
  nearestSite: z.string().nullable(),
  travelBurden: z.enum(["low", "medium", "high", "unknown"]),
  note: z.string(),
});

const matchCardSchema = clinicalTrialSchema
  .omit({
    eligibilityText: true,
    locations: true,
  })
  .merge(screeningResultSchema)
  .extend({
    costEstimate: travelEstimateSchema,
  });

export type MatchCard = z.infer<typeof matchCardSchema>;

const normalizeLocation = (value: string): string =>
  value.trim().toLocaleLowerCase();

const formatSite = (location: ClinicalTrial["locations"][number]): string => {
  return [location.city, location.country].filter(Boolean).join(", ");
};

const estimateTravel = (
  trial: ClinicalTrial,
  profile: PatientProfile,
): z.infer<typeof travelEstimateSchema> => {
  const siteCount = trial.locations.length;
  const patientLocation = profile.location?.trim();

  if (!patientLocation) {
    return {
      siteCount,
      nearestSite: null,
      travelBurden: "unknown",
      note: "Add a location to estimate travel burden.",
    };
  }

  const normalizedPatientLocation = normalizeLocation(patientLocation);
  const matchingSite = trial.locations.find((site) => {
    const city = site.city ? normalizeLocation(site.city) : null;
    const country = site.country ? normalizeLocation(site.country) : null;

    return [city, country].some(
      (place) =>
        place !== null &&
        (place === normalizedPatientLocation ||
          normalizedPatientLocation.includes(place)),
    );
  });

  if (matchingSite) {
    const nearestSite = formatSite(matchingSite) || null;

    return {
      siteCount,
      nearestSite,
      travelBurden: "low",
      note: nearestSite
        ? `A listed site matches the patient's location: ${nearestSite}.`
        : "A listed site matches the patient's location.",
    };
  }

  if (siteCount <= 2) {
    return {
      siteCount,
      nearestSite: null,
      travelBurden: "high",
      note: "No location match was found and the trial has two or fewer listed sites.",
    };
  }

  return {
    siteCount,
    nearestSite: null,
    travelBurden: "medium",
    note: "No location match was found, but the trial has several listed sites.",
  };
};

const verdictRank: Record<GatekeeperScreeningResult["verdict"], number> = {
  likely_eligible: 0,
  needs_more_info: 1,
  likely_ineligible: 2,
};

export const matchRouter = createTRPCRouter({
  run: publicProcedure
    .input(
      z.object({
        profile: patientProfileSchema,
        limit: z.number().int().positive().default(8),
      }),
    )
    .output(z.array(matchCardSchema))
    .mutation(async ({ input }) => {
      const trials = await searchRecruitingTrials({
        condition: input.profile.condition,
        limit: input.limit,
      });

      const cards = await Promise.all(
        trials.map(async (trial): Promise<MatchCard> => {
          const screening = await screenTrialEligibility({
            eligibilityText: trial.eligibilityText,
            profile: input.profile,
          });

          return {
            nctId: trial.nctId,
            title: trial.title,
            phase: trial.phase,
            status: trial.status,
            conditions: trial.conditions,
            url: trial.url,
            verdict: screening.verdict,
            verdictSummary: screening.verdictSummary,
            checks: screening.checks,
            doctorQuestions: screening.doctorQuestions,
            costEstimate: estimateTravel(trial, input.profile),
          };
        }),
      );

      return cards.sort(
        (first, second) =>
          verdictRank[first.verdict] - verdictRank[second.verdict],
      );
    }),
});
