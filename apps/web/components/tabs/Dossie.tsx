import type { DashboardData } from "@/components/Dashboard";

export default function Dossie({ data }: { data: DashboardData }) {
  const { stats, focusAreas, marketValue } = data;

  const jogos = stats.length;
  const titular = stats.filter((s) => s.was_starter).length;
  const gols = stats.reduce((acc, s) => acc + (s.goals ?? 0), 0);
  const assist = stats.reduce((acc, s) => acc + (s.assists ?? 0), 0);
  const notas = stats.map((s) => s.rating).filter((r): r is number => r != null);
  const notaMedia = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
  const valorAtual = marketValue.length ? marketValue[marketValue.length - 1] : null;

  const criticas = focusAreas.filter((f) => f.priority === "Crítica" || f.priority === "Alta");

  return (
    <>
      <div className="card">
        <h3>Leitura da situação</h3>
        <p className="lede">
          Snapshot calculado a partir dos jogos com estatística registrada no banco. Cobertura de dados cresce a
          cada coleta — números abaixo refletem só as partidas já processadas, não a temporada inteira ainda.
        </p>
        <div className="kpis">
          <div className="kpi">
            <span>Jogos com dados</span>
            <b>{jogos}</b>
            <em>{titular} como titular</em>
          </div>
          <div className="kpi">
            <span>Gols</span>
            <b>{gols}</b>
          </div>
          <div className="kpi">
            <span>Assistências</span>
            <b>{assist}</b>
          </div>
          <div className="kpi">
            <span>Nota média</span>
            <b>{notaMedia ? notaMedia.toFixed(1) : "—"}</b>
            <em>Sofascore</em>
          </div>
          <div className="kpi">
            <span>Valor de mercado</span>
            <b>{valorAtual ? `€${(valorAtual.value_eur / 1_000_000).toFixed(1)}M` : "—"}</b>
            <em>{valorAtual?.source ?? ""}</em>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Frentes prioritárias do plano de desenvolvimento</h3>
        <p className="lede">Resumo — detalhamento completo na aba "Plano de desenvolvimento".</p>
        <ul style={{ fontSize: 13.5, lineHeight: 1.7, paddingLeft: 18, margin: 0, color: "#33465A" }}>
          {criticas.map((f) => (
            <li key={f.id}>
              <b>{f.title}</b> ({f.priority}) — {f.diagnosis}
            </li>
          ))}
          {criticas.length === 0 && <li>Nenhuma frente crítica registrada ainda.</li>}
        </ul>
      </div>
    </>
  );
}
