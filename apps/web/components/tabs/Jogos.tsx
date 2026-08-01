import type { DashboardData } from "@/components/Dashboard";

export default function Jogos({ data }: { data: DashboardData }) {
  const { fixtures, clubs, matches } = data;
  const clubById = Object.fromEntries(clubs.map((c) => [c.id, c]));
  const matchById = Object.fromEntries(matches.map((m) => [m.id, m]));
  const now = Date.now();

  const upcoming = fixtures
    .filter((f) => f.match_date && new Date(f.match_date).getTime() >= now - 24 * 3600 * 1000)
    .sort((a, b) => new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime());

  return (
    <div className="card">
      <h3>Calendário</h3>
      <p className="lede">Próximos jogos do clube com o atleta no radar — dados coletados automaticamente.</p>
      {upcoming.map((f, i) => {
        const opponent = f.opponent_club_id ? clubById[f.opponent_club_id] : null;
        const match = matchById[f.match_id];
        const isNext = i === 0;
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
              <div className="mtitle">
                {opponent?.name ?? "A definir"}
                {isNext && <span className="tagc tag-prox">próximo</span>}
              </div>
              <div className="mobs">
                {f.competition ?? match?.competition ?? "—"}
                {f.notes ? ` — ${f.notes}` : ""}
              </div>
            </div>
          </div>
        );
      })}
      {upcoming.length === 0 && <p className="foot">Nenhum jogo futuro coletado ainda.</p>}
    </div>
  );
}
