#!/usr/bin/env node
/**
 * Route warmup — runs after `npm run dev`, fetches every page so Turbopack
 * compiles them all upfront. First visits become instant.
 *
 * Usage:  npm run warm
 */

const BASE = "http://localhost:3000";
const BATCH = 4; // parallel requests per wave (keeps Turbopack from choking)
const TIMEOUT_MS = 45_000;

// Every route in the app (locale = en, covers all shared layouts)
const ROUTES = [
  // Public
  "/en/",
  "/en/login",
  "/en/register",
  "/en/forgot-password",
  "/en/reset-password",
  "/api/homepage",

  // Worker dashboard
  "/en/dashboard/worker",
  "/en/dashboard/worker/profile",
  "/en/dashboard/worker/cv",
  "/en/dashboard/worker/interview",
  "/en/dashboard/worker/pending-projects",
  "/en/dashboard/worker/projects",
  "/en/dashboard/worker/claims",
  "/en/dashboard/worker/messages",
  "/en/dashboard/worker/contract",
  "/en/dashboard/worker/account",

  // Provider dashboard
  "/en/dashboard/provider",
  "/en/dashboard/provider/profile",
  "/en/dashboard/provider/projects",
  "/en/dashboard/provider/projects/new",
  "/en/dashboard/provider/alumni",
  "/en/dashboard/provider/claims",
  "/en/dashboard/provider/claims/new",
  "/en/dashboard/provider/messages",
  "/en/dashboard/provider/contract",
  "/en/dashboard/provider/account",

  // Admin dashboard
  "/en/dashboard/admin",
  "/en/dashboard/admin/home-controller",
  "/en/dashboard/admin/users",
  "/en/dashboard/admin/users/create",
  "/en/dashboard/admin/projects",
  "/en/dashboard/admin/alumni",
  "/en/dashboard/admin/workers-monitor",
  "/en/dashboard/admin/contracts",
  "/en/dashboard/admin/audit-log",
  "/en/dashboard/admin/messaging",

  // Evaluator dashboard
  "/en/dashboard/evaluator",
  "/en/dashboard/evaluator/profile",
  "/en/dashboard/evaluator/claims",
  "/en/dashboard/evaluator/justifications",
  "/en/dashboard/evaluator/claim-monitor",
  "/en/dashboard/evaluator/messaging",

  // Refund Office dashboard
  "/en/dashboard/refund-office",
  "/en/dashboard/refund-office/profile",
  "/en/dashboard/refund-office/claims",
  "/en/dashboard/refund-office/refund-action",
  "/en/dashboard/refund-office/system-account",
  "/en/dashboard/refund-office/messaging",
];

async function waitForServer(maxMs = 60_000) {
  const deadline = Date.now() + maxMs;
  process.stdout.write("⏳ Waiting for Next.js server");
  while (Date.now() < deadline) {
    try {
      await fetch(`${BASE}/en/login`, { signal: AbortSignal.timeout(2000) });
      process.stdout.write(" ✓\n");
      return;
    } catch {
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Server did not become ready within 60 s");
}

async function fetchRoute(route) {
  try {
    const res = await fetch(`${BASE}${route}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "text/html" },
    });
    const ms = res.headers.get("x-response-time") ?? "?";
    console.log(`  ✓  ${route.padEnd(55)} [${res.status}]`);
  } catch (e) {
    console.log(`  ✗  ${route.padEnd(55)} (${e.message.slice(0, 40)})`);
  }
}

async function main() {
  console.log("\n🔥  SSFRS warmup — pre-compiling all routes\n");

  try {
    await waitForServer();
  } catch (e) {
    console.error("❌  " + e.message);
    process.exit(1);
  }

  const t = Date.now();
  console.log(`\n   Compiling ${ROUTES.length} routes in batches of ${BATCH}…\n`);

  for (let i = 0; i < ROUTES.length; i += BATCH) {
    await Promise.all(ROUTES.slice(i, i + BATCH).map(fetchRoute));
  }

  const secs = ((Date.now() - t) / 1000).toFixed(1);
  console.log(`\n✅  Done in ${secs} s — all routes compiled, first visits will be instant.\n`);
}

main();
