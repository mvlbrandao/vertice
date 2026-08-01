import { finishRun, getClient, startRun } from "./db.ts";
import { syncSofascore } from "./sofascore.ts";
import { syncTransfermarktMarketValue } from "./transfermarkt.ts";
import { syncPress } from "./press.ts";

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

  // Sofascore é a fonte primária: as demais dependem do registro do jogador existir.
  const sofascoreResult = await runSource(db, "sofascore", () => syncSofascore(db));

  const [transfermarktResult, pressResult] = await Promise.all([
    runSource(db, "transfermarkt_market_value", () => syncTransfermarktMarketValue(db)),
    runSource(db, "press", () => syncPress(db)),
  ]);

  const results = [sofascoreResult, transfermarktResult, pressResult];
  const hasError = results.some((r) => r.status === "error");

  return new Response(JSON.stringify({ results }, null, 2), {
    status: hasError ? 207 : 200,
    headers: { "Content-Type": "application/json" },
  });
});
