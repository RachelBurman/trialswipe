import "server-only";

import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const clinicalTrialSchema = z.object({
  nctId: z.string(),
  title: z.string(),
  status: z.string(),
  phase: z.string().nullable(),
  conditions: z.array(z.string()),
  eligibilityText: z.string(),
  locations: z.array(
    z.object({
      city: z.string().nullable(),
      country: z.string().nullable(),
    }),
  ),
  url: z.string(),
});

export type ClinicalTrial = z.infer<typeof clinicalTrialSchema>;

type ClinicalTrialsResponse = {
  studies?: (ClinicalTrialStudy | null)[] | null;
};

type ClinicalTrialStudy = {
  protocolSection?: {
    identificationModule?: {
      nctId?: string | null;
      briefTitle?: string | null;
    } | null;
    statusModule?: {
      overallStatus?: string | null;
    } | null;
    designModule?: {
      phases?: (string | null)[] | null;
    } | null;
    conditionsModule?: {
      conditions?: (string | null)[] | null;
    } | null;
    eligibilityModule?: {
      eligibilityCriteria?: string | null;
    } | null;
    contactsLocationsModule?: {
      locations?:
        | ({
            city?: string | null;
            country?: string | null;
          } | null)[]
        | null;
    } | null;
  } | null;
};

export const searchRecruitingTrials = async ({
  condition,
  limit,
}: {
  condition: string;
  limit: number;
}): Promise<ClinicalTrial[]> => {
  const url = new URL("https://clinicaltrials.gov/api/v2/studies");
  url.searchParams.set("query.cond", condition);
  url.searchParams.set("filter.overallStatus", "RECRUITING");
  url.searchParams.set("pageSize", String(limit));
  url.searchParams.set("format", "json");

  const response = await fetch(url);

  if (!response.ok) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `ClinicalTrials.gov returned ${response.status}`,
    });
  }

  const data = (await response.json()) as ClinicalTrialsResponse | null;
  const studies = data?.studies ?? [];

  console.log("First raw ClinicalTrials.gov study:", studies?.[0] ?? null);

  return studies.map((study) => {
    const protocolSection = study?.protocolSection;
    const identification = protocolSection?.identificationModule;
    const phases =
      protocolSection?.designModule?.phases?.filter(
        (phase): phase is string =>
          typeof phase === "string" && phase.length > 0,
      ) ?? [];
    const conditions =
      protocolSection?.conditionsModule?.conditions?.filter(
        (studyCondition): studyCondition is string =>
          typeof studyCondition === "string" && studyCondition.length > 0,
      ) ?? [];
    const nctId = identification?.nctId ?? "";

    return {
      nctId,
      title: identification?.briefTitle ?? "",
      status: protocolSection?.statusModule?.overallStatus ?? "",
      phase: phases.length > 0 ? phases.join(", ") : null,
      conditions,
      eligibilityText:
        protocolSection?.eligibilityModule?.eligibilityCriteria ?? "",
      locations:
        protocolSection?.contactsLocationsModule?.locations?.map(
          (location) => ({
            city: location?.city ?? null,
            country: location?.country ?? null,
          }),
        ) ?? [],
      url: `https://clinicaltrials.gov/study/${encodeURIComponent(nctId)}`,
    };
  });
};
