import { SOFASCORE_HEADERS, TARGET } from "./config.ts";
import type { Db } from "./db.ts";

const BASE = "https://api.sofascore.com/api/v1";

async function sofascoreGet(path: string): Promise<any | null> {
  const res = await fetch(`${BASE}${path}`, { headers: SOFASCORE_HEADERS });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Sofascore ${path} -> HTTP ${res.status}`);
  }
  return await res.json();
}

async function upsertClub(db: Db, team: any): Promise<string | null> {
  if (!team) return null;
  const { data, error } = await db
    .from("clubs")
    .upsert(
      {
        sofascore_id: team.id,
        name: team.name,
        country: team.country?.name ?? null,
        logo_url: `https://api.sofascore.com/api/v1/team/${team.id}/image`,
      },
      { onConflict: "sofascore_id" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function upsertMatch(db: Db, event: any, homeClubId: string | null, awayClubId: string | null): Promise<string> {
  const { data, error } = await db
    .from("matches")
    .upsert(
      {
        sofascore_id: event.id,
        competition: event.tournament?.name ?? event.tournament?.uniqueTournament?.name ?? null,
        season: event.season?.year ?? null,
        round: event.roundInfo?.round ? String(event.roundInfo.round) : null,
        match_date: event.startTimestamp
          ? new Date(event.startTimestamp * 1000).toISOString()
          : null,
        home_club_id: homeClubId,
        away_club_id: awayClubId,
        home_score: event.homeScore?.current ?? null,
        away_score: event.awayScore?.current ?? null,
        venue: event.venue?.stadium?.name ?? null,
        status: event.status?.type ?? null,
      },
      { onConflict: "sofascore_id" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function fetchAndUpsertMatchStats(db: Db, playerId: string, matchId: string, eventId: number) {
  const stats = await sofascoreGet(`/event/${eventId}/player/${TARGET.sofascorePlayerId}/statistics`);
  const heatmap = await sofascoreGet(`/event/${eventId}/player/${TARGET.sofascorePlayerId}/heatmap`);
  if (!stats?.statistics) return false;

  const s = stats.statistics;
  const { error } = await db.from("player_match_stats").upsert(
    {
      player_id: playerId,
      match_id: matchId,
      minutes_played: s.minutesPlayed ?? null,
      rating: s.rating ?? null,
      goals: s.goals ?? 0,
      assists: s.goalAssist ?? 0,
      shots: (s.onTargetScoringAttempt ?? 0) + (s.shotOffTarget ?? 0) + (s.blockedScoringAttempt ?? 0),
      shots_on_target: s.onTargetScoringAttempt ?? 0,
      key_passes: s.keyPass ?? 0,
      passes_completed: s.accuratePass ?? null,
      passes_attempted: s.totalPass ?? null,
      dribbles_completed: s.wonContest ?? null,
      dribbles_attempted: s.totalContest ?? null,
      duels_won: s.duelWon ?? null,
      duels_total: (s.duelWon ?? 0) + (s.duelLost ?? 0),
      tackles: s.totalTackle ?? null,
      interceptions: s.interceptionWon ?? null,
      touches: s.touches ?? null,
      fouls_committed: s.fouls ?? null,
      fouls_suffered: s.wasFouled ?? null,
      yellow_card: (s.yellowCard ?? 0) > 0,
      red_card: (s.redCard ?? 0) > 0,
      position_played: stats.position ?? null,
      was_starter: stats.substitute === false,
      heatmap_data: heatmap ?? null,
      source: "sofascore",
      raw_json: stats,
    },
    { onConflict: "player_id,match_id" },
  );
  if (error) throw error;
  return true;
}

/** Sincroniza perfil, clube atual, partidas recentes (com stats) e próximas partidas. */
export async function syncSofascore(db: Db): Promise<number> {
  let upserted = 0;

  const profile = await sofascoreGet(`/player/${TARGET.sofascorePlayerId}`);
  if (!profile?.player) {
    throw new Error("Perfil do jogador não retornado pelo Sofascore");
  }
  const p = profile.player;

  const clubId = await upsertClub(db, p.team);
  if (clubId) upserted++;

  const { data: player, error: playerErr } = await db
    .from("players")
    .upsert(
      {
        sofascore_id: p.id,
        full_name: TARGET.fullName,
        known_as: p.name,
        birth_date: p.dateOfBirth ? p.dateOfBirth.substring(0, 10) : null,
        height_cm: p.height ?? null,
        preferred_foot: p.preferredFoot ?? null,
        nationality: p.country?.name ?? null,
        position: p.position ?? null,
        photo_url: `https://api.sofascore.com/api/v1/player/${p.id}/image`,
        current_club_id: clubId,
        jersey_number: p.jerseyNumber ?? null,
        market_value_eur: p.proposedMarketValue ?? null,
        contract_until: p.contractUntilTimestamp
          ? new Date(p.contractUntilTimestamp * 1000).toISOString().substring(0, 10)
          : null,
      },
      { onConflict: "sofascore_id" },
    )
    .select("id")
    .single();
  if (playerErr) throw playerErr;
  const playerId = player.id as string;
  upserted++;

  // Últimas partidas (várias páginas, para até tiver histórico o suficiente)
  for (let page = 0; page < 3; page++) {
    const last = await sofascoreGet(`/player/${TARGET.sofascorePlayerId}/events/last/${page}`);
    if (!last?.events?.length) break;
    for (const event of last.events) {
      try {
        const homeClubId = await upsertClub(db, event.homeTeam);
        const awayClubId = await upsertClub(db, event.awayTeam);
        const matchId = await upsertMatch(db, event, homeClubId, awayClubId);
        upserted++;
        const ok = await fetchAndUpsertMatchStats(db, playerId, matchId, event.id);
        if (ok) upserted++;
      } catch (e) {
        console.error(`Falha ao processar evento ${event.id}:`, (e as Error).message);
      }
    }
    if (!last.hasNextPage) break;
  }

  // Próximas partidas
  const next = await sofascoreGet(`/player/${TARGET.sofascorePlayerId}/events/next/0`);
  if (next?.events?.length) {
    for (const event of next.events) {
      try {
        const homeClubId = await upsertClub(db, event.homeTeam);
        const awayClubId = await upsertClub(db, event.awayTeam);
        const matchId = await upsertMatch(db, event, homeClubId, awayClubId);
        const opponentClubId = event.homeTeam?.id === p.team?.id ? awayClubId : homeClubId;
        const { error } = await db.from("upcoming_fixtures").upsert(
          {
            player_id: playerId,
            match_id: matchId,
            opponent_club_id: opponentClubId,
            competition: event.tournament?.name ?? null,
            match_date: event.startTimestamp
              ? new Date(event.startTimestamp * 1000).toISOString()
              : null,
          },
          { onConflict: "player_id,match_id" },
        );
        if (error) throw error;
        upserted++;
      } catch (e) {
        console.error(`Falha ao processar próximo evento ${event.id}:`, (e as Error).message);
      }
    }
  }

  return upserted;
}
