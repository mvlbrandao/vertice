"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type {
  CareerScenario,
  Club,
  CollectorRun,
  DecisionCriterion,
  DevelopmentFocusArea,
  Match,
  MarketValueEntry,
  NewsItem,
  Player,
  PlayerMatchStats,
  PlayerSeasonStats,
  PlayerStaffMember,
  UpcomingFixture,
  UserNote,
} from "@/lib/types";
import Dossie from "@/components/tabs/Dossie";
import Desempenho from "@/components/tabs/Desempenho";
import Plano from "@/components/tabs/Plano";
import Jogos from "@/components/tabs/Jogos";
import Destino from "@/components/tabs/Destino";
import Dados from "@/components/tabs/Dados";

export interface DashboardData {
  player: Player;
  clubs: Club[];
  matches: Match[];
  stats: PlayerMatchStats[];
  seasonStats: PlayerSeasonStats[];
  marketValue: MarketValueEntry[];
  news: NewsItem[];
  fixtures: UpcomingFixture[];
  focusAreas: DevelopmentFocusArea[];
  criteria: DecisionCriterion[];
  scenarios: CareerScenario[];
  collectorRuns: CollectorRun[];
  notes: UserNote[];
  staff: PlayerStaffMember[];
}

const TABS: [string, string][] = [
  ["dossie", "Dossiê"],
  ["desempenho", "Desempenho"],
  ["plano", "Plano de desenvolvimento"],
  ["jogos", "Próximos jogos"],
  ["destino", "Decisão de carreira"],
  ["dados", "Fontes e dados"],
];

interface DashboardProps {
  data: DashboardData;
  userId: string;
  role: string | null;
  players: Player[];
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string) => void;
}

export default function Dashboard({ data, userId, role, players, selectedPlayerId, onSelectPlayer }: DashboardProps) {
  const [aba, setAba] = useState("dossie");
  const { player, clubs } = data;

  const clubById = Object.fromEntries(clubs.map((c) => [c.id, c]));
  const currentClub = player.current_club_id ? clubById[player.current_club_id] : null;
  const age = player.birth_date
    ? Math.floor((Date.now() - new Date(player.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="sc-root">
      <header className="hero">
        <div className="wrap">
          <div>
            <div className="eyebrow">DOSSIÊ DE ACOMPANHAMENTO</div>
            <h1 className="hname">{player.known_as ?? player.full_name}</h1>
            <div className="hsub">
              {player.position ?? "—"} {currentClub ? `· ${currentClub.name}` : ""}
              {player.jersey_number ? ` · camisa ${player.jersey_number}` : ""}
              {player.nationality ? ` · ${player.nationality}` : ""}
            </div>
            {players.length > 1 && (
              <select
                value={selectedPlayerId ?? ""}
                onChange={(e) => onSelectPlayer(e.target.value)}
                style={{
                  marginTop: 10,
                  background: "#152437",
                  color: "#fff",
                  border: "1px solid #2A4260",
                  padding: "6px 10px",
                  fontSize: 13,
                }}
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.known_as ?? p.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="idcard">
            <div className="idbox">
              <span>Idade</span>
              <b>{age ?? "—"}</b>
            </div>
            <div className="idbox">
              <span>Altura</span>
              <b>{player.height_cm ?? "—"}</b>
            </div>
            <div className="idbox">
              <span>Contrato</span>
              <b>{player.contract_until ? player.contract_until.slice(0, 4) : "—"}</b>
            </div>
            <div className="idbox">
              <span>Valor</span>
              <b>
                {player.market_value_eur
                  ? `€${(player.market_value_eur / 1_000_000).toFixed(1)}M`
                  : "—"}
              </b>
            </div>
          </div>
        </div>
        <div className="wrap">
          <nav>
            {TABS.map(([id, label]) => (
              <button key={id} data-on={aba === id ? "1" : "0"} onClick={() => setAba(id)}>
                {label}
              </button>
            ))}
            <button onClick={() => supabase.auth.signOut()} style={{ marginLeft: "auto" }}>
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="wrap">
        {aba === "dossie" && <Dossie data={data} isAdmin={role === "admin"} />}
        {aba === "desempenho" && <Desempenho data={data} />}
        {aba === "plano" && <Plano data={data} />}
        {aba === "jogos" && <Jogos data={data} />}
        {aba === "destino" && <Destino data={data} />}
        {aba === "dados" && <Dados data={data} userId={userId} />}
      </main>
    </div>
  );
}
