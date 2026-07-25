# TrialSwipe

Swipe through clinical trials you might actually qualify for.

TrialSwipe is a patient-first clinical trial discovery application. It searches
actively recruiting studies and is being built to turn dense eligibility
criteria into clear, plain-English screening questions.

> [!IMPORTANT]
> TrialSwipe is an informational discovery tool, not medical advice. A match
> does not confirm eligibility. Trial investigators make the final eligibility
> decision.

## Current status

The project currently provides the application foundation, a typed clinical
trial search API, and conservative AI-assisted eligibility screening. There is
no patient-facing search interface yet.

- T3 application using the Next.js App Router
- End-to-end typed tRPC API
- ClinicalTrials.gov v2 search integration
- Prisma connected to Supabase Postgres
- Supabase browser and SSR clients installed
- NextAuth scaffolded for later use
- Server-only Anthropic eligibility screening with defensive JSON validation

## How trial search works

The public `trials.search` tRPC procedure accepts a condition and optional
result limit. It queries ClinicalTrials.gov for recruiting studies and maps the
nested API response into a small, defensive application model.

```ts
const trials = await api.trials.search({
  condition: "asthma",
  limit: 10,
});
```

Each result contains:

```ts
{
  nctId: string;
  title: string;
  status: string;
  phase: string | null;
  conditions: string[];
  eligibilityText: string;
  locations: {
    city: string | null;
    country: string | null;
  }[];
  url: string;
}
```

Study data comes from the
[ClinicalTrials.gov v2 API](https://clinicaltrials.gov/data-api/api).

## How eligibility screening works

The public `gatekeeper.screen` tRPC mutation takes raw trial eligibility
criteria and a small patient profile:

```ts
{
  eligibilityText: string;
  profile: {
    condition: string;
    age?: number;
    sex?: string;
    location?: string;
    notes?: string;
  };
}
```

The server asks Anthropic to split the criteria into individual inclusion and
exclusion rules. Each rule receives a conservative `pass`, `fail`, or
`unknown` status with a plain-English reason. Missing profile information
always produces `unknown`; the model is explicitly instructed not to guess
clinical facts.

The typed result is:

```ts
{
  checks: {
    text: string;
    kind: "inclusion" | "exclusion";
    status: "pass" | "fail" | "unknown";
    reason: string;
  }[];
  verdict: "likely_eligible" | "likely_ineligible" | "needs_more_info";
  verdictSummary: string;
  doctorQuestions: string[];
}
```

Anthropic responses are stripped of stray Markdown fences, parsed as JSON, and
validated with Zod. Invalid responses return a safe `needs_more_info` fallback
instead of failing the request. The Anthropic client and API key exist only in
server code.

Screening results are preliminary. They must never be presented as a confirmed
eligibility decision or a substitute for advice from the trial team or the
patient's clinician.

## Technology

- [Next.js](https://nextjs.org/) with the App Router
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [tRPC](https://trpc.io/)
- [Prisma](https://www.prisma.io/)
- [Supabase](https://supabase.com/) Postgres
- [NextAuth](https://authjs.dev/)
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)

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
AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""

ANTHROPIC_API_KEY=""

NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""

DATABASE_URL=""
```

For `DATABASE_URL`, use the Supabase **Session pooler** connection string on
port `5432`. This is available from the project's **Connect** panel.

Never commit `.env`. It contains the database password and other credentials.
Only the variables prefixed with `NEXT_PUBLIC_` are intended to be exposed to
the browser.

### 3. Create the database schema

```bash
npm run db:push
```

This creates the Prisma models required by the scaffold, including the
NextAuth tables.

### 4. Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The scaffold page should
load and display `Hello from tRPC`.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm run db:push` | Synchronize the Prisma schema with the database |
| `npm run db:generate` | Create and apply a development migration |
| `npm run db:migrate` | Apply committed migrations |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```text
prisma/
  schema.prisma               Database schema
src/
  app/                        Next.js App Router
  server/
    api/
      root.ts                 Root tRPC router
      routers/
        gatekeeper.ts         AI-assisted eligibility screening mutation
        trials.ts             ClinicalTrials.gov search procedure
    auth/                     NextAuth configuration
    db.ts                     Prisma client
  env.js                      Validated environment variables
  trpc/                       tRPC React and server clients
```

## Data and privacy

Clinical trial information is fetched from ClinicalTrials.gov. Screening is
currently a stateless server API with no patient-facing UI or profile storage.
Before collecting real screening answers, the project must define appropriate
consent, retention, access control, security, and sensitive health-data
handling policies. Do not use real patient information during development.

## License

This project is available under the terms in [LICENSE](LICENSE).
