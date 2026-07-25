import {
  screenInputSchema,
  screeningResultSchema,
  screenTrialEligibility,
} from "~/server/eligibility-screening";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const gatekeeperRouter = createTRPCRouter({
  screen: publicProcedure
    .input(screenInputSchema)
    .output(screeningResultSchema)
    .mutation(({ input }) => screenTrialEligibility(input)),
});
