import { createClient } from "@supabase/supabase-js";

export function getClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export type Db = ReturnType<typeof getClient>;

export async function startRun(db: Db, source: string) {
  const { data, error } = await db
    .from("collector_runs")
    .insert({ source, status: "running" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function finishRun(
  db: Db,
  runId: string,
  status: "success" | "error",
  recordsUpserted: number,
  errorMessage?: string,
) {
  await db
    .from("collector_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      records_upserted: recordsUpserted,
      error_message: errorMessage ?? null,
    })
    .eq("id", runId);
}
