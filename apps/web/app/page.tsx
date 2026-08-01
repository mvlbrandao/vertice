"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, PLAYER_SOFASCORE_ID } from "@/lib/supabaseClient";
import Login from "@/components/Login";
import Dashboard, { type DashboardData } from "@/components/Dashboard";

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
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

  useEffect(() => {
    if (!session) return;
    const currentUserId = session.user.id;
    let cancelled = false;

    async function load() {
      try {
        const { data: player, error: playerErr } = await supabase
          .from("players")
          .select("*")
          .eq("sofascore_id", PLAYER_SOFASCORE_ID)
          .single();
        if (playerErr) throw playerErr;

        const [
          clubsRes,
          matchesRes,
          statsRes,
          marketRes,
          newsRes,
          fixturesRes,
          focusRes,
          criteriaRes,
          scenariosRes,
          runsRes,
          notesRes,
        ] = await Promise.all([
          supabase.from("clubs").select("*"),
          supabase.from("matches").select("*").order("match_date", { ascending: true }),
          supabase.from("player_match_stats").select("*").eq("player_id", player.id),
          supabase
            .from("market_value_history")
            .select("as_of_date, value_eur, source")
            .eq("player_id", player.id)
            .order("as_of_date", { ascending: true }),
          supabase
            .from("news_items")
            .select("*")
            .eq("player_id", player.id)
            .order("published_at", { ascending: false })
            .limit(25),
          supabase
            .from("upcoming_fixtures")
            .select("*")
            .eq("player_id", player.id)
            .order("match_date", { ascending: true }),
          supabase
            .from("development_focus_areas")
            .select("*")
            .eq("player_id", player.id)
            .order("sort_order", { ascending: true }),
          supabase
            .from("decision_criteria")
            .select("*")
            .eq("player_id", player.id)
            .order("sort_order", { ascending: true }),
          supabase
            .from("career_scenarios")
            .select("*")
            .eq("player_id", player.id)
            .order("sort_order", { ascending: true }),
          supabase
            .from("collector_runs")
            .select("*")
            .order("started_at", { ascending: false })
            .limit(10),
          supabase
            .from("user_notes")
            .select("*")
            .eq("player_id", player.id)
            .eq("user_id", currentUserId)
            .order("created_at", { ascending: false }),
        ]);

        const firstError = [
          clubsRes,
          matchesRes,
          statsRes,
          marketRes,
          newsRes,
          fixturesRes,
          focusRes,
          criteriaRes,
          scenariosRes,
          runsRes,
          notesRes,
        ].find((r) => r.error);
        if (firstError?.error) throw firstError.error;

        if (cancelled) return;
        setData({
          player,
          clubs: clubsRes.data ?? [],
          matches: matchesRes.data ?? [],
          stats: statsRes.data ?? [],
          marketValue: marketRes.data ?? [],
          news: newsRes.data ?? [],
          fixtures: fixturesRes.data ?? [],
          focusAreas: focusRes.data ?? [],
          criteria: criteriaRes.data ?? [],
          scenarios: scenariosRes.data ?? [],
          collectorRuns: runsRes.data ?? [],
          notes: notesRes.data ?? [],
        });
      } catch (err) {
        if (!cancelled) setLoadError((err as Error).message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session]);

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
  if (!data) return null;

  return <Dashboard data={data} userId={session.user.id} />;
}
