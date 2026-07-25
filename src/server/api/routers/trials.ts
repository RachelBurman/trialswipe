import { z } from "zod";

import {
  clinicalTrialSchema,
  searchRecruitingTrials,
} from "~/server/clinical-trials";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const trialsRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        condition: z.string().trim().min(1),
        limit: z.number().int().positive().default(10),
      }),
    )
    .output(z.array(clinicalTrialSchema))
    .query(({ input }) => searchRecruitingTrials(input)),
});
