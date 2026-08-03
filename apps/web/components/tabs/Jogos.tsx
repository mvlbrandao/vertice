import type { DashboardData } from "@/components/Dashboard";

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

  return (
    <>
      {next && (
        <div className="card">
          <h3>Análise do próximo jogo</h3>
          <p className="lede">
            {nextOpponent?.name ?? "Adversário a definir"} · {next.competition ?? matchById[next.match_id]?.competition ?? "—"}
            {daysToNext != null && ` · em ${daysToNext} dia${daysToNext === 1 ? "" : "s"}`}
            {next.match_date &&
              ` · ${new Date(next.match_date).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`}
          </p>
          {next.notes ? (
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "#33465A", margin: 0 }}>{next.notes}</p>
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
          <p className="foot">Só o próximo jogo está coletado por enquanto — o resto do calendário aparece aqui conforme o coletor roda.</p>
        )}
      </div>
    </>
  );
}
