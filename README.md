# TrialSwipe

Swipe through clinical trials you might actually qualify for.

TrialSwipe is a mobile-first clinical trial discovery experience for patients.
It searches actively recruiting studies, screens dense eligibility criteria
against a small patient profile, and explains the result in plain English.

> [!IMPORTANT]
> TrialSwipe provides an automated first-pass screen, not medical advice. A
> match does not confirm eligibility. Always confirm eligibility with the
> trial team and your clinician.

## What it does

1. A patient enters a condition and, optionally, their age, sex, location, and
   other relevant details.
2. TrialSwipe fetches live recruiting studies from ClinicalTrials.gov.
3. Each study's eligibility criteria are screened conservatively with
   Anthropic.
4. Results are ranked into a swipeable deck:
   `likely_eligible`, `needs_more_info`, then `likely_ineligible`.
5. The patient can dismiss a trial, save it to explore later, or open a full
   explanation.

The current interface includes:

- A calm, accessible, mobile-first intake form
- A Tinder-style swipe deck with button alternatives to every gesture
- Plain-English verdicts and the most relevant screening reasons
- Full inclusion and exclusion checks in an expanded detail view
- Trial site and travel-burden estimates
- Up to three questions to ask the trial team or clinician
- A saved-trials panel with links to the official study pages
- Profile editing without losing the current deck position or saved trials
- Medical-advice guardrails throughout the experience

Saved trials and profile data currently live only in React state for the active
browser session. Refreshing the page clears them.

## How matching works

The public `match.run` tRPC mutation accepts a profile and an optional result
limit:

```ts
{
  profile: {
    condition: string;
    age?: number;
    sex?: string;
    location?: string;
    notes?: string;
  };
  limit?: number; // defaults to 8
}
```

The matching pipeline:

1. Calls `trials.search` through shared server logic to fetch recruiting
   studies for the supplied condition.
2. Calls the shared eligibility screener for every study concurrently.
3. Combines trial data, screening results, and a simple travel estimate.
4. Sorts the cards by likely fit while preserving typed results end to end.

Each returned card contains:

```ts
{
  nctId: string;
  title: string;
  phase: string | null;
  status: string;
  conditions: string[];
  url: string;
  verdict:
    | "likely_eligible"
    | "likely_ineligible"
    | "needs_more_info";
  verdictSummary: string;
  checks: {
    text: string;
    kind: "inclusion" | "exclusion";
    status: "pass" | "fail" | "unknown";
    reason: string;
  }[];
  doctorQuestions: string[];
  costEstimate: {
    siteCount: number;
    nearestSite: string | null;
    travelBurden: "low" | "medium" | "high" | "unknown";
    note: string;
  };
}
```

The travel estimate is a lightweight location heuristic, not a route,
distance, time, or financial-cost calculation.

## Clinical trial data

The shared search helper calls the
[ClinicalTrials.gov v2 API](https://clinicaltrials.gov/data-api/api):

```text
GET https://clinicaltrials.gov/api/v2/studies
```

It requests recruiting studies for the supplied condition and defensively
maps the deeply nested, nullable response into a smaller application model.
The underlying `trials.search` query is also exposed directly through tRPC.

## Eligibility screening

The shared screener and public `gatekeeper.screen` mutation use the Anthropic
TypeScript SDK from server-only code. The API key is never exposed to the
browser.

The model is instructed to:

- Split the trial text into individual inclusion and exclusion rules
- Mark each rule as `pass`, `fail`, or `unknown`
- Use `unknown` whenever the profile does not contain enough information
- Never guess diagnoses, measurements, medicines, test results, or history
- Explain each decision in language a non-expert can understand
- Return no more than three useful questions for the trial team or clinician

Long eligibility documents are split into manageable chunks and screened
concurrently. Results are validated with Zod and merged conservatively. Invalid
JSON, an unexpected response shape, missing criteria, or a failed model request
returns a safe `needs_more_info` result instead of crashing the matching flow.

## Technology

- [Next.js](https://nextjs.org/) App Router
- [React](https://react.dev/) and TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://motion.dev/) for the swipe interaction
- [tRPC](https://trpc.io/) and TanStack Query
- [Zod](https://zod.dev/) validation
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [ClinicalTrials.gov v2 API](https://clinicaltrials.gov/data-api/api)
- [Prisma](https://www.prisma.io/)
- [Supabase](https://supabase.com/) Postgres
- [NextAuth](https://authjs.dev/), scaffolded for future authentication

Authentication does not currently block the public discovery and screening
flow.

## Local development

### Requirements

- Node.js 20.9 or newer
- npm
- A Supabase project
- An Anthropic API key

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux:

```bash
cp .env.example .env
```

Fill in the values in `.env`:

```dotenv
AUTH_SECRET=""

# Optional: leave both blank to disable Discord authentication
AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""

ANTHROPIC_API_KEY=""

NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""

DATABASE_URL=""
```

Use a Supabase Postgres connection string for `DATABASE_URL`. Never commit
`.env`; it contains database and API credentials. Only variables prefixed with
`NEXT_PUBLIC_` are exposed to the browser.

### 3. Synchronize the database

```bash
npm run db:push
```

### 4. Start TrialSwipe

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter a condition, and
select **Find trials**. A real match request can take a little while because
multiple studies are screened through the model.

## Validation

Run the static checks and production build:

```bash
npm run typecheck
npm run build
```

Run the server-side end-to-end smoke script:

```bash
npx tsx scripts/smoke.ts
```

The smoke script searches for five recruiting type 2 diabetes studies, screens
them against a sample London profile, and prints the ranked cards. It makes
real ClinicalTrials.gov and Anthropic requests and may incur API usage.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run db:push` | Synchronize the Prisma schema with the database |
| `npm run db:generate` | Create and apply a development migration |
| `npm run db:migrate` | Apply committed migrations |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```text
scripts/
  smoke.ts                    Real end-to-end matching smoke script
src/
  app/
    _components/
      intake-screen.tsx       Intake, navigation, and shared client state
      saved-trials-panel.tsx  Session shortlist
      swipe-deck.tsx          Swipe cards and expanded trial details
    page.tsx                  Main application page
  server/
    api/
      root.ts                 Root tRPC router
      routers/
        gatekeeper.ts         Eligibility screening mutation
        match.ts              Ranked matching mutation
        trials.ts             ClinicalTrials.gov search query
    clinical-trials.ts        Shared trial fetch and defensive parsing
    eligibility-screening.ts Shared Anthropic screening and validation
    auth/                     NextAuth configuration
    db.ts                     Prisma client
  env.js                      Validated environment variables
  trpc/                       tRPC React and server clients
prisma/
  schema.prisma               Database schema
```

## Data, privacy, and safety

- Trial data comes from ClinicalTrials.gov.
- Patient profile details and eligibility text are sent to the server-side
  screening pipeline and Anthropic for processing.
- TrialSwipe does not currently persist profiles, screening results, or saved
  trials.
- No authentication is required for the current public flow.
- Screening is intentionally conservative and cannot confirm eligibility.

Before handling real patient information, the project needs appropriate
consent, retention, access-control, security, and sensitive health-data
policies. Do not use real patient information during development.

## License

This project is available under the terms in [LICENSE](LICENSE).
