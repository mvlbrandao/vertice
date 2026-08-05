import type { DashboardData } from "@/components/Dashboard";
import type { OpponentThreat, PlayerWatchPoint } from "@/lib/types";

const RISK_CLASS: Record<OpponentThreat["risk"], string> = {
  alto: "p-crit",
  medio: "p-alta",
  baixo: "p-media",
};
const RISK_LABEL: Record<OpponentThreat["risk"], string> = {
  alto: "Alto risco",
  medio: "Risco médio",
  baixo: "Baixo risco",
};
const SEVERITY_CLASS: Record<PlayerWatchPoint["severity"], string> = {
  atencao: "p-alta",
  ok: "p-ok",
  info: "p-media",
};
const SEVERITY_LABEL: Record<PlayerWatchPoint["severity"], string> = {
  atencao: "Atenção",
  ok: "Ponto forte",
  info: "Info",
};

const subhead: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  textTransform: "uppercase",
  fontSize: 15,
  letterSpacing: "0.04em",
  margin: "0 0 8px",
  color: "var(--slate)",
};

export default function Jogos({ data }: { data: DashboardData }) {
  const { fixtures, clubs, matches } = data;
  const clubById = Object.fromEntries(clubs.map((c) => [c.id, c]));
  const matchById = Object.fromEntries(matches.map((m) => [m.id, m]));
  const now = Date.now();

  const upcoming = fixtures
    .filter((f) => f.match_date && new Date(f.match_date).getTime() >= now - 24 * 3600 * 1000)
    .sort((a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime());

  const next = upcoming[0];
  const rest = upcoming.slice(1);
  const nextOpponent = next?.opponent_club_id ? clubById[next.opponent_club_id] : null;
  const daysToNext = next?.match_date
    ? Math.ceil((new Date(next.match_date).getTime() - now) / (24 * 3600 * 1000))
    : null;
  const scouting = next?.scouting ?? null;

  return (
    <>
      {next && (
        <div className="card">
          <h3>Análise do próximo jogo</h3>
          <p className="lede">
            {nextOpponent?.name ?? "Adversário a definir"} ·{" "}
            {next.competition ?? matchById[next.match_id]?.competition ?? "—"}
            {daysToNext != null && ` · em ${daysToNext} dia${daysToNext === 1 ? "" : "s"}`}
            {next.match_date &&
              ` · ${new Date(next.match_date).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}`}
          </p>

          {scouting ? (
            <>
              <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "#33465A", margin: "0 0 18px" }}>
                {scouting.context}
              </p>

              {scouting.opponent_threats.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <h4 style={subhead}>Adversários a observar</h4>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Jogador</th>
                          <th>Risco</th>
                          <th>Nota</th>
                          <th>G</th>
                          <th>A</th>
                          <th>Min</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scouting.opponent_threats.map((t, i) => (
                          <tr key={i}>
                            <td>
                              <div>{t.name}</div>
                              <div className="foot" style={{ marginTop: 1 }}>
                                {t.position}
                              </div>
                            </td>
                            <td>
                              <span className={`pill ${RISK_CLASS[t.risk]}`}>{RISK_LABEL[t.risk]}</span>
                            </td>
                            <td className="mono">{t.rating ?? "—"}</td>
                            <td className="mono">{t.goals}</td>
                            <td className="mono">{t.assists}</td>
                            <td className="mono">{t.minutes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="foot" style={{ marginTop: 6 }}>
                    Números da temporada atual ({scouting.opponent_threats[0]?.competition}) — não é previsão de
                    escalação, é o elenco disponível.
                  </p>
                </div>
              )}

              {scouting.player_watch_points.length > 0 && (
                <div>
                  <h4 style={subhead}>Pontos de atenção do atleta</h4>
                  {scouting.player_watch_points.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 0",
                        borderBottom:
                          i < scouting.player_watch_points.length - 1 ? "1px dotted var(--line)" : undefined,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                        <span className={`pill ${SEVERITY_CLASS[w.severity]}`}>{SEVERITY_LABEL[w.severity]}</span>
                        <b style={{ fontSize: 13.5 }}>{w.title}</b>
                      </div>
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: "#3c5063", margin: 0 }}>{w.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : next.notes ? (
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "#33465A", margin: 0, whiteSpace: "pre-line" }}>
              {next.notes}
            </p>
          ) : (
            <p className="foot">Sem análise preparada ainda para este jogo.</p>
          )}
        </div>
      )}

      <div className="card">
        <h3>Calendário</h3>
        <p className="lede">Demais jogos do clube com o atleta no radar.</p>
        {rest.map((f) => {
          const opponent = f.opponent_club_id ? clubById[f.opponent_club_id] : null;
          const match = matchById[f.match_id];
          return (
            <div className="match" key={f.id}>
              <div className="mdate">
                <b>
                  {f.match_date
                    ? new Date(f.match_date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })
                    : "—"}
                </b>
                {f.match_date &&
                  new Date(f.match_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div>
                <div className="mtitle">{opponent?.name ?? "A definir"}</div>
                <div className="mobs">
                  {f.competition ?? match?.competition ?? "—"}
                  {f.notes ? ` — ${f.notes}` : ""}
                </div>
              </div>
            </div>
          );
        })}
        {upcoming.length === 0 && <p className="foot">Nenhum jogo futuro coletado ainda.</p>}
        {upcoming.length > 0 && rest.length === 0 && (
          <p className="foot">
            Só o próximo jogo está coletado por enquanto — o resto do calendário aparece aqui conforme o coletor
            roda.
          </p>
        )}
      </div>
    </>
  );
}
