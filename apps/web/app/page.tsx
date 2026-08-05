"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import Login from "@/components/Login";
import Dashboard, { type DashboardData } from "@/components/Dashboard";
import type { Player } from "@/lib/types";

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Carrega o papel do usuário e a lista de atletas que ele pode ver (RLS já filtra).
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    async function loadAccess() {
      const [{ data: profile }, { data: playersData, error }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", session!.user.id).single(),
        supabase.from("players").select("*").order("full_name", { ascending: true }),
      ]);
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        return;
      }
      setRole(profile?.role ?? null);
      setPlayers(playersData ?? []);
      setSelectedPlayerId((prev) => prev ?? playersData?.[0]?.id ?? null);
      setPlayersLoaded(true);
    }
    loadAccess();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session || !selectedPlayerId) return;
    const player = players.find((p) => p.id === selectedPlayerId);
    if (!player) return;
    const currentUserId = session.user.id;
    let cancelled = false;

    async function load() {
      try {
        const [
          clubsRes,
          matchesRes,
          statsRes,
          seasonStatsRes,
          marketRes,
          newsRes,
          fixturesRes,
          focusRes,
          criteriaRes,
          scenariosRes,
          runsRes,
          notesRes,
          staffRes,
        ] = await Promise.all([
          supabase.from("clubs").select("*"),
          supabase.from("matches").select("*").order("match_date", { ascending: true }),
          supabase.from("player_match_stats").select("*").eq("player_id", player!.id),
          supabase
            .from("player_season_stats")
            .select("*")
            .eq("player_id", player!.id)
            .order("season", { ascending: false }),
          supabase
            .from("market_value_history")
            .select("as_of_date, value_eur, source")
            .eq("player_id", player!.id)
            .order("as_of_date", { ascending: true }),
          supabase
            .from("news_items")
            .select("*")
            .eq("player_id", player!.id)
            .order("published_at", { ascending: false })
            .limit(25),
          supabase
            .from("upcoming_fixtures")
            .select("*")
            .eq("player_id", player!.id)
            .order("match_date", { ascending: true }),
          supabase
            .from("development_focus_areas")
            .select("*")
            .eq("player_id", player!.id)
            .order("sort_order", { ascending: true }),
          supabase
            .from("decision_criteria")
            .select("*")
            .eq("player_id", player!.id)
            .order("sort_order", { ascending: true }),
          supabase
            .from("career_scenarios")
            .select("*")
            .eq("player_id", player!.id)
            .order("sort_order", { ascending: true }),
          supabase
            .from("collector_runs")
            .select("*")
            .order("started_at", { ascending: false })
            .limit(10),
          supabase
            .from("user_notes")
            .select("*")
            .eq("player_id", player!.id)
            .eq("user_id", currentUserId)
            .order("created_at", { ascending: false }),
          supabase
            .from("player_staff")
            .select("*")
            .eq("player_id", player!.id)
            .order("created_at", { ascending: true }),
        ]);

        const firstError = [
          clubsRes,
          matchesRes,
          statsRes,
          seasonStatsRes,
          marketRes,
          newsRes,
          fixturesRes,
          focusRes,
          criteriaRes,
          scenariosRes,
          runsRes,
          notesRes,
          staffRes,
        ].find((r) => r.error);
        if (firstError?.error) throw firstError.error;

        if (cancelled) return;
        setData({
          player: player!,
          clubs: clubsRes.data ?? [],
          matches: matchesRes.data ?? [],
          stats: statsRes.data ?? [],
          seasonStats: seasonStatsRes.data ?? [],
          marketValue: marketRes.data ?? [],
          news: newsRes.data ?? [],
          fixtures: fixturesRes.data ?? [],
          focusAreas: focusRes.data ?? [],
          criteria: criteriaRes.data ?? [],
          scenarios: scenariosRes.data ?? [],
          collectorRuns: runsRes.data ?? [],
          notes: notesRes.data ?? [],
          staff: staffRes.data ?? [],
        });
      } catch (err) {
        if (!cancelled) setLoadError((err as Error).message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session, selectedPlayerId, players]);

  if (authLoading) return null;
  if (!session) return <Login />;

  if (loadError) {
    return (
      <div className="sc-root">
        <div className="wrap" style={{ paddingTop: 40 }}>
          <div className="card">
            <h3>Erro ao carregar dados</h3>
            <p className="lede">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (playersLoaded && players.length === 0) {
    return (
      <div className="sc-root">
        <div className="wrap" style={{ paddingTop: 40 }}>
          <div className="card">
            <h3>Sem acesso a atleta ainda</h3>
            <p className="lede">
              Sua conta está ativa, mas nenhum atleta foi liberado para você. Peça para o administrador te
              cadastrar na equipe técnica de um atleta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <Dashboard
      data={data}
      userId={session.user.id}
      role={role}
      players={players}
      selectedPlayerId={selectedPlayerId}
      onSelectPlayer={setSelectedPlayerId}
    />
  );
}
