import { finishRun, getClient, startRun } from "./db.ts";
import { syncSofascore } from "./sofascore.ts";
import { syncTransfermarktMarketValue } from "./transfermarkt.ts";
import { syncPress } from "./press.ts";
import { TARGETS } from "./config.ts";

async function runSource(
  db: ReturnType<typeof getClient>,
  name: string,
  fn: () => Promise<number>,
) {
  const runId = await startRun(db, name);
  try {
    const count = await fn();
    await finishRun(db, runId, "success", count);
    return { source: name, status: "success", records_upserted: count };
  } catch (e) {
    const message = (e as Error).message;
    await finishRun(db, runId, "error", 0, message);
    return { source: name, status: "error", error: message };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const db = getClient();
  const results = [];

  for (const target of TARGETS) {
    const tag = target.fullName.split(" ")[0];

    // Sofascore é a fonte primária: as demais dependem do registro do jogador existir.
    results.push(await runSource(db, `sofascore:${tag}`, () => syncSofascore(db, target)));

    const [transfermarktResult, pressResult] = await Promise.all([
      runSource(db, `transfermarkt:${tag}`, () => syncTransfermarktMarketValue(db, target)),
      runSource(db, `press:${tag}`, () => syncPress(db, target)),
    ]);
    results.push(transfermarktResult, pressResult);
  }

  const hasError = results.some((r) => r.status === "error");

  return new Response(JSON.stringify({ results }, null, 2), {
    status: hasError ? 207 : 200,
    headers: { "Content-Type": "application/json" },
  });
});
