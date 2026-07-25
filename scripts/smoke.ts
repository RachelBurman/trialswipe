import { createRequire } from "node:module";

process.loadEnvFile(".env");

const require = createRequire(import.meta.url);
const serverOnlyPath = require.resolve("server-only");

require.cache[serverOnlyPath] = {
  children: [],
  exports: {},
  filename: serverOnlyPath,
  id: serverOnlyPath,
  isPreloading: false,
  loaded: true,
  path: "",
  paths: [],
} as unknown as NodeJS.Module;

async function main() {
  const { createCaller } = await import("../src/server/api/root");
  type CallerContext = Exclude<
    Parameters<typeof createCaller>[0],
    (...args: never[]) => unknown
  >;

  const context = {
    db: {},
    headers: new Headers(),
    session: null,
  } as CallerContext;

  const caller = createCaller(context);
  const result = await caller.match.run({
    profile: {
      condition: "type 2 diabetes",
      age: 54,
      location: "London",
    },
    limit: 5,
  });

  console.log(JSON.stringify(result, null, 2));
  console.log(
    `SMOKE_SUMMARY cards=${result.length} checks=${result.reduce(
      (total, card) => total + card.checks.length,
      0,
    )}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
