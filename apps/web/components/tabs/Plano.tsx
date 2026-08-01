import type { DashboardData } from "@/components/Dashboard";
import type { PlayerMatchStats } from "@/lib/types";

const CLASS_BY_PRIORITY: Record<string, string> = {
  "Crítica": "p-crit",
  Alta: "p-alta",
  Média: "p-media",
};

const MIN_SAMPLE_MINUTES = 900; // convenção comum em scouting: abaixo disso, taxas /90 ainda são instáveis

const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

interface Totals {
  minutes: number;
  matches: number;
  goals: number;
  assists: number;
  shots: number;
  keyPasses: number;
  duelsWon: number;
  duelsTotal: number;
}

function computeTotals(stats: PlayerMatchStats[]): Totals {
  return stats.reduce(
    (acc, s) => ({
      minutes: acc.minutes + (s.minutes_played ?? 0),
      matches: acc.matches + (s.minutes_played ? 1 : 0),
      goals: acc.goals + (s.goals ?? 0),
      assists: acc.assists + (s.assists ?? 0),
      shots: acc.shots + (s.shots ?? 0),
      keyPasses: acc.keyPasses + (s.key_passes ?? 0),
      duelsWon: acc.duelsWon + (s.duels_won ?? 0),
      duelsTotal: acc.duelsTotal + (s.duels_total ?? 0),
    }),
    { minutes: 0, matches: 0, goals: 0, assists: 0, shots: 0, keyPasses: 0, duelsWon: 0, duelsTotal: 0 },
  );
}

const per90 = (n: number, minutes: number) => (minutes > 0 ? (n / minutes) * 90 : null);

type KpiResult =
  | { kind: "computed"; value: string; coverage: string; benchmark?: string }
  | { kind: "missing"; needs: string }
  | { kind: "process" };

function resolveKpi(label: string, t: Totals): KpiResult {
  switch (label) {
    case "Gols + assistências / 90": {
      const v = per90(t.goals + t.assists, t.minutes);
      if (v == null) return { kind: "missing", needs: "minutos em campo registrados" };
      return {
        kind: "computed",
        value: `${fmt(v)} G+A/90min`,
        coverage: `${fmt(t.minutes)} min em ${t.matches} jogos com dados`,
        benchmark: "Referência de mercado para pontas: ~0,15–0,29 é média, 0,30–0,54 acima da média, 0,55+ é elite (não é dado deste atleta).",
      };
    }
    case "Finalizações / 90": {
      const v = per90(t.shots, t.minutes);
      if (v == null) return { kind: "missing", needs: "minutos em campo registrados" };
      return { kind: "computed", value: `${fmt(v)} finalizações/90min`, coverage: `${fmt(t.minutes)} min em ${t.matches} jogos com dados` };
    }
    case "Duelos defensivos ganhos": {
      if (t.duelsTotal === 0) return { kind: "missing", needs: "estatística de duelos por partida (Sofascore)" };
      const pct = (t.duelsWon / t.duelsTotal) * 100;
      return {
        kind: "computed",
        value: `${fmt(pct)}% de duelos ganhos`,
        coverage: `${t.duelsWon}/${t.duelsTotal} duelos, todas as posições em campo (não isola só duelo defensivo ainda)`,
      };
    }
    case "Passes decisivos / 90": {
      const v = per90(t.keyPasses, t.minutes);
      if (v == null) return { kind: "missing", needs: "minutos em campo registrados" };
      return {
        kind: "computed",
        value: `${fmt(v)} passes-chave/90min`,
        coverage: `Proxy usando passes-chave do Sofascore — ${fmt(t.minutes)} min em ${t.matches} jogos`,
      };
    }
    case "Sessões de acompanhamento / mês":
      return { kind: "process" };
    default:
      return { kind: "missing", needs: "" };
  }
}

const MISSING_HINTS: Record<string, string> = {
  "xG por finalização": "precisa de dado de xG por chute (fonte paga: Opta/StatsBomb/API-Football)",
  "Erros que levam a finalização": "precisa de marcação manual em vídeo (Fase 3)",
  "Jogos disponíveis na temporada": "cobertura de partidas ainda parcial no banco — cresce a cada coleta",
  "Dias perdidos por lesão": "tabela de lesões ainda não populada pelo coletor",
  "Cruzamentos certos": "coletor ainda não grava dados de cruzamento por partida",
  "Nota nos 15 min finais vs. média do jogo": "precisa de rating por trecho do jogo, não disponível na fonte atual",
};

export default function Plano({ data }: { data: DashboardData }) {
  const { focusAreas, stats } = data;
  const totals = computeTotals(stats);
  const smallSample = totals.minutes > 0 && totals.minutes < MIN_SAMPLE_MINUTES;

  return (
    <>
      <div className="card">
        <h3>Como ler os números abaixo</h3>
        <p className="lede">
          "/90" significa "por 90 minutos em campo" — é o jeito padrão de comparar jogadores com minutagens
          diferentes. "Meta" é o alvo de referência da comissão técnica, não um dado medido. Quando não há dado
          suficiente para calcular algo de verdade, mostramos isso explicitamente em vez de inventar um número.
        </p>
        {smallSample && (
          <p className="foot">
            ⚠️ Amostra ainda pequena ({fmt(totals.minutes)} min processados). Abaixo de ~900 minutos, taxas por 90
            costumam variar bastante partida a partida — trate os números computados como direção, não conclusão.
          </p>
        )}
      </div>

      <div className="card">
        <h3>Plano de desenvolvimento</h3>
        <p className="lede">
          Cada frente tem o diagnóstico que a justifica, ações concretas e indicadores de acompanhamento.
        </p>
        {focusAreas.map((f) => (
          <div className="frente" key={f.id}>
            <h4>
              {f.title}
              <span className={`pill ${CLASS_BY_PRIORITY[f.priority] ?? "p-media"}`}>{f.priority}</span>
            </h4>
            <p>{f.diagnosis}</p>
            {f.actions && (
              <ul>
                {f.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
            {f.kpis && (
              <div className="kpitab">
                {f.kpis.map((k, i) => {
                  const resolved = resolveKpi(k.k, totals);
                  return (
                    <div key={i} style={{ flexDirection: "column", alignItems: "stretch", gap: 3 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{k.k}</span>
                        <span className="mono">
                          meta: <b>{k.meta}</b>
                        </span>
                      </div>
                      {resolved.kind === "computed" && (
                        <div style={{ fontSize: 11.5, color: "#12855A" }}>
                          atual: <b>{resolved.value}</b>{" "}
                          <span style={{ color: "var(--mute)" }}>({resolved.coverage})</span>
                          {resolved.benchmark && (
                            <div style={{ color: "var(--mute)", marginTop: 2 }}>{resolved.benchmark}</div>
                          )}
                        </div>
                      )}
                      {resolved.kind === "missing" && (
                        <div style={{ fontSize: 11.5, color: "var(--mute)" }}>
                          sem dado ainda — {MISSING_HINTS[k.k] ?? (resolved.needs || "aguardando mais coleta")}
                        </div>
                      )}
                      {resolved.kind === "process" && (
                        <div style={{ fontSize: 11.5, color: "var(--mute)" }}>
                          métrica de processo — preenchida manualmente pela comissão técnica, não vem de estatística
                          de jogo
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {focusAreas.length === 0 && <p className="foot">Nenhuma frente cadastrada ainda.</p>}
      </div>
    </>
  );
}
