import type { DashboardData } from "@/components/Dashboard";
import type { PlayerMatchStats, PlayerSeasonStats, PositionBenchmarkEntry } from "@/lib/types";
import { Heatmap } from "@/components/Heatmap";

function BenchmarkTable({ entries, showLeague }: { entries: PositionBenchmarkEntry[]; showLeague?: boolean }) {
  if (entries.length === 0) return <p className="foot">Sem dado ainda pra esse ranking.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Jogador</th>
            {showLeague && <th>Liga</th>}
            <th>Nota</th>
            <th>G</th>
            <th>A</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i}>
              <td>
                <div>{e.name}</div>
                <div className="foot" style={{ marginTop: 1 }}>
                  {e.team}
                  {e.note ? ` — ${e.note}` : ""}
                </div>
              </td>
              {showLeague && <td>{e.league ?? "—"}</td>}
              <td className="mono">{e.rating ?? "—"}</td>
              <td className="mono">{e.goals}</td>
              <td className="mono">{e.assists}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

// Cruzamento não existe em player_match_stats (só jogo-a-jogo do Sofascore não traz esse campo),
// então usa o agregado de temporada que já coletamos (player_season_stats). Soma todas as
// competições da temporada mais recente (empréstimo + clube-mãe contam juntos).
function computeCrossing(seasonStats: PlayerSeasonStats[]): { completed: number; total: number } {
  if (seasonStats.length === 0) return { completed: 0, total: 0 };
  const latestSeason = seasonStats.reduce((max, s) => (s.season > max ? s.season : max), seasonStats[0].season);
  return seasonStats
    .filter((s) => s.season === latestSeason)
    .reduce(
      (acc, s) => ({
        completed: acc.completed + (s.crosses_completed ?? 0),
        total: acc.total + (s.crosses_total ?? 0),
      }),
      { completed: 0, total: 0 },
    );
}

type KpiResult =
  | { kind: "computed"; value: string; coverage: string; benchmark?: string }
  | { kind: "missing"; needs: string }
  | { kind: "process" };

function resolveKpi(label: string, t: Totals, data: DashboardData): KpiResult {
  switch (label) {
    case "Gols + assistências / 90": {
      const v = per90(t.goals + t.assists, t.minutes);
      if (v == null) return { kind: "missing", needs: "minutos em campo registrados" };
      return {
        kind: "computed",
        value: `${fmt(v)} G+A/90min`,
        coverage: `${fmt(t.minutes)} min em ${t.matches} jogos com dados`,
        benchmark:
          "Referência de mercado para pontas: ~0,15–0,29 é média, 0,30–0,54 acima da média, 0,55+ é elite (não é dado deste atleta).",
      };
    }
    case "Finalizações / 90": {
      const v = per90(t.shots, t.minutes);
      if (v == null) return { kind: "missing", needs: "minutos em campo registrados" };
      return {
        kind: "computed",
        value: `${fmt(v)} finalizações/90min`,
        coverage: `${fmt(t.minutes)} min em ${t.matches} jogos com dados`,
      };
    }
    case "Cruzamentos certos %": {
      const { completed, total } = computeCrossing(data.seasonStats);
      if (total === 0) return { kind: "missing", needs: "estatística de cruzamentos por temporada (Sofascore)" };
      const pct = (completed / total) * 100;
      return {
        kind: "computed",
        value: `${fmt(pct)}% de cruzamentos certos`,
        coverage: `${completed}/${total} cruzamentos, agregado da temporada mais recente (todas as competições)`,
      };
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
    case "Dias até o próximo jogo": {
      const next = data.fixtures
        .filter((f) => f.match_date)
        .sort((a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime())[0];
      if (!next?.match_date) return { kind: "missing", needs: "próximo jogo ainda não coletado" };
      const days = Math.ceil((new Date(next.match_date).getTime() - Date.now()) / (24 * 3600 * 1000));
      return {
        kind: "computed",
        value: days <= 0 ? "é hoje/já passou" : `${days} dia${days === 1 ? "" : "s"}`,
        coverage: "usado pelo preparador físico para decidir volume x intensidade da semana",
      };
    }
    case "Sprints e velocidade máxima (base física)": {
      const withPhysical = data.stats.filter((s) => s.top_speed_kmh != null);
      if (withPhysical.length === 0)
        return { kind: "missing", needs: "dado físico (GPS) ainda não disponível em nenhum jogo processado" };
      const last = withPhysical
        .map((s) => ({ s, m: data.matches.find((m) => m.id === s.match_id) }))
        .filter((x) => x.m?.match_date)
        .sort((a, b) => new Date(b.m!.match_date!).getTime() - new Date(a.m!.match_date!).getTime())[0];
      if (!last) return { kind: "missing", needs: "dado físico sem partida associada" };
      return {
        kind: "computed",
        value: `${fmt(last.s.top_speed_kmh!)} km/h máx · ${last.s.sprints_count ?? "—"} sprints · ${fmt(last.s.distance_km ?? 0)} km`,
        coverage: `último jogo com dado de GPS (${withPhysical.length} de ${data.stats.length} jogos têm esse dado) — referência para montar a carga de pré-temporada, não tendência recente (hiato entre temporadas)`,
      };
    }
    default:
      return { kind: "missing", needs: "aguardando mais coleta" };
  }
}

export default function Plano({ data }: { data: DashboardData }) {
  const { focusAreas, stats } = data;
  const totals = computeTotals(stats);
  const smallSample = totals.minutes > 0 && totals.minutes < MIN_SAMPLE_MINUTES;

  const heatmapMatch = stats
    .filter((s) => s.heatmap_data?.heatmap?.length)
    .map((s) => ({ s, m: data.matches.find((m) => m.id === s.match_id) }))
    .filter((x) => x.m?.match_date)
    .sort((a, b) => new Date(b.m!.match_date!).getTime() - new Date(a.m!.match_date!).getTime())[0];

  return (
    <>
      <div className="card">
        <h3>Como ler os números abaixo</h3>
        <p className="lede">
          Só ficam aqui indicadores que levam a uma decisão real de treino ou de escalação — cortamos o que era só
          estatística bonita sem ação associada. "/90" significa "por 90 minutos em campo". "Meta" é o alvo de
          referência da comissão técnica, não um dado medido.
        </p>
        {smallSample && (
          <p className="foot">
            ⚠️ Amostra ainda pequena ({fmt(totals.minutes)} min processados). Abaixo de ~900 minutos, taxas por 90
            costumam variar bastante partida a partida — trate os números computados como direção, não conclusão.
          </p>
        )}
      </div>

      {heatmapMatch && (
        <div className="card">
          <h3>Mapa de posicionamento</h3>
          <p className="lede">
            Último jogo com dado de heatmap disponível ({heatmapMatch.m!.match_date ? new Date(heatmapMatch.m!.match_date).toLocaleDateString("pt-BR") : ""}
            ). Decisão que isso apoia: se a concentração de toques está muito presa à linha de fundo ou já mostra
            entradas na área — insumo direto para o treino de "chegadas na área" da frente de finalização.
          </p>
          <Heatmap points={heatmapMatch.s.heatmap_data!.heatmap} />
        </div>
      )}

      <div className="card">
        <h3>Plano de desenvolvimento</h3>
        <p className="lede">
          Cada frente tem o diagnóstico que a justifica, ações concretas e só os indicadores que orientam uma
          decisão de treino.
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
            {f.kpis && f.kpis.length > 0 && (
              <div className="kpitab">
                {f.kpis.map((k, i) => {
                  const resolved = resolveKpi(k.k, totals, data);
                  return (
                    <div key={i} style={{ flexDirection: "column", alignItems: "stretch", gap: 3 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{k.k}</span>
                        <span className="mono">
                          meta: <b>{k.meta}</b>
                        </span>
                      </div>
                      {resolved.kind === "computed" && (
                        <div style={{ display: "block", fontSize: 11.5, color: "#12855A" }}>
                          atual: <b>{resolved.value}</b>{" "}
                          <span style={{ color: "var(--mute)" }}>({resolved.coverage})</span>
                          {resolved.benchmark && (
                            <div style={{ display: "block", color: "var(--mute)", marginTop: 2 }}>
                              {resolved.benchmark}
                            </div>
                          )}
                          {k.peers && k.peers.length > 0 && (
                            <div style={{ display: "block", marginTop: 4, borderTop: "1px dotted var(--line)", paddingTop: 4 }}>
                              {k.peers.map((p, pi) => (
                                <div
                                  key={pi}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    padding: "2px 0",
                                    borderTop: "none",
                                    color: "var(--mute)",
                                  }}
                                >
                                  <span>{p.name}</span>
                                  <span className="mono" style={{ whiteSpace: "nowrap" }}>
                                    {p.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {resolved.kind === "missing" && (
                        <div style={{ fontSize: 11.5, color: "var(--mute)" }}>sem dado ainda — {resolved.needs}</div>
                      )}
                      {resolved.kind === "process" && (
                        <div style={{ fontSize: 11.5, color: "var(--mute)" }}>
                          métrica de processo — preenchida manualmente pela comissão técnica
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

      {data.positionBenchmark ? (
        <>
          <div className="card">
            <h3>Onde você está</h3>
            <p className="lede">
              Nota própria comparada com jogadores da posição "{data.positionBenchmark.position_label}" — categoria
              ampla do Sofascore, não a sub-posição exata (o filtro deles não segmenta lateral/zagueiro/ala
              separadamente, por exemplo).
            </p>
            <div className="kpis">
              <div className="kpi">
                <span>Sua nota</span>
                <b>{data.positionBenchmark.own_rating ?? "—"}</b>
                <em>{data.positionBenchmark.own_rating_source ?? ""}</em>
              </div>
              <div className="kpi">
                <span>{data.positionBenchmark.own_league_name ?? "Sua liga"}</span>
                <b>
                  {data.positionBenchmark.own_league_rank ? `#${data.positionBenchmark.own_league_rank}` : "fora do top 100"}
                </b>
                <em>{data.positionBenchmark.own_league_pool_note ?? ""}</em>
              </div>
              <div className="kpi">
                <span>5 principais ligas</span>
                <b>
                  {data.positionBenchmark.top_leagues_rank ? `#${data.positionBenchmark.top_leagues_rank}` : "fora do top 100"}
                </b>
                <em>{data.positionBenchmark.top_leagues_pool_note ?? ""}</em>
              </div>
            </div>
            {data.positionBenchmark.data_notes && (
              <p className="foot" style={{ marginTop: 10 }}>
                {data.positionBenchmark.data_notes}
              </p>
            )}
          </div>

          <div className="card">
            <h3>Top 5 da posição — {data.positionBenchmark.own_league_name ?? "sua liga"}</h3>
            <p className="lede">
              {data.positionBenchmark.own_league_season ? `Temporada ${data.positionBenchmark.own_league_season}. ` : ""}
              Referência de nível — os 5 melhores avaliados na categoria "{data.positionBenchmark.position_label}"
              dessa liga.
            </p>
            <BenchmarkTable entries={data.positionBenchmark.same_league_top5} />
          </div>

          <div className="card">
            <h3>Top 5 da posição — principais ligas</h3>
            <p className="lede">
              Melhores avaliados na categoria "{data.positionBenchmark.position_label}" entre Premier League, LaLiga,
              Serie A, Bundesliga e Ligue 1 combinadas.
            </p>
            <BenchmarkTable entries={data.positionBenchmark.top_leagues_top5} showLeague />
          </div>
        </>
      ) : (
        <div className="card">
          <h3>Onde você está</h3>
          <p className="foot">Benchmark de posição ainda não coletado.</p>
        </div>
      )}
    </>
  );
}
