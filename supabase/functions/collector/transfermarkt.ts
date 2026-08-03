import type { PlayerTarget } from "./config.ts";
import type { Db } from "./db.ts";

/**
 * Transfermarkt não tem API pública. Este endpoint (usado pelo próprio gráfico
 * de valor de mercado no site) retorna uma série histórica em JSON e costuma
 * ser mais estável que fazer parsing de HTML.
 */
export async function syncTransfermarktMarketValue(db: Db, target: PlayerTarget): Promise<number> {
  const url = `https://www.transfermarkt.com/ceapi/marketValueDevelopment/graph/${target.transfermarktId}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Transfermarkt market value -> HTTP ${res.status}`);
  }
  const json = await res.json();
  const points: any[] = json?.list ?? [];
  if (!points.length) return 0;

  const { data: player, error: playerErr } = await db
    .from("players")
    .select("id")
    .eq("sofascore_id", target.sofascorePlayerId)
    .single();
  if (playerErr || !player) throw new Error("Jogador ainda não existe no banco (rode o sync do Sofascore primeiro)");

  let upserted = 0;
  for (const point of points) {
    const date = point.datum_mw ? new Date(point.datum_mw) : null;
    if (!date || isNaN(date.getTime()) || typeof point.y !== "number") continue;
    const { error } = await db.from("market_value_history").upsert(
      {
        player_id: player.id,
        as_of_date: date.toISOString().substring(0, 10),
        value_eur: point.y,
        source: "transfermarkt",
      },
      { onConflict: "player_id,as_of_date,source" },
    );
    if (error) throw error;
    upserted++;
  }
  return upserted;
}
