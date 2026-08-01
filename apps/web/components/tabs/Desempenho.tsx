"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import type { DashboardData } from "@/components/Dashboard";

export default function Desempenho({ data }: { data: DashboardData }) {
  const { stats, matches } = data;
  const matchById = Object.fromEntries(matches.map((m) => [m.id, m]));

  const timeline = stats
    .map((s) => {
      const m = matchById[s.match_id];
      return {
        date: m?.match_date ? new Date(m.match_date) : null,
        label: m?.match_date
          ? new Date(m.match_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
          : "—",
        rating: s.rating,
        competition: m?.competition ?? "—",
      };
    })
    .filter((t) => t.rating != null && t.date)
    .sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime());

  const avg = timeline.length
    ? timeline.reduce((acc, t) => acc + (t.rating ?? 0), 0) / timeline.length
    : null;

  const byCompetition = new Map<string, { j: number; somaNota: number; comNota: number }>();
  for (const s of stats) {
    const m = matchById[s.match_id];
    const comp = m?.competition ?? "Outros";
    const entry = byCompetition.get(comp) ?? { j: 0, somaNota: 0, comNota: 0 };
    entry.j += 1;
    if (s.rating != null) {
      entry.somaNota += s.rating;
      entry.comNota += 1;
    }
    byCompetition.set(comp, entry);
  }
  const splitData = Array.from(byCompetition.entries()).map(([c, v]) => ({
    c,
    j: v.j,
    nota: v.comNota ? v.somaNota / v.comNota : 0,
  }));

  return (
    <>
      <div className="card">
        <h3>Nota por partida</h3>
        <p className="lede">
          {avg
            ? `Média das partidas com dados: ${avg.toFixed(2)}. `
            : "Ainda sem partidas com nota registrada. "}
          Linha cresce conforme o coletor processa mais jogos.
        </p>
        {timeline.length > 0 ? (
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#E3EAF0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5F7387" }} axisLine={{ stroke: "#C9D4DD" }} tickLine={false} />
                <YAxis domain={[5.5, 8]} tick={{ fontSize: 12, fill: "#5F7387" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: "1px solid #C9D4DD", borderRadius: 0, fontSize: 13, fontFamily: "IBM Plex Mono" }}
                  formatter={(v: number) => [v, "nota"]}
                />
                <Line type="monotone" dataKey="rating" stroke="#0B63CE" strokeWidth={2.5} dot={{ r: 3.5, fill: "#0B63CE" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="foot">Sem dados suficientes ainda.</p>
        )}
      </div>

      <div className="card">
        <h3>Por competição</h3>
        <p className="lede">Jogos processados e nota média em cada competição.</p>
        {splitData.length > 0 ? (
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={splitData} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#E3EAF0" vertical={false} />
                <XAxis dataKey="c" tick={{ fontSize: 12, fill: "#5F7387" }} axisLine={{ stroke: "#C9D4DD" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#5F7387" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: "1px solid #C9D4DD", borderRadius: 0, fontSize: 13 }} />
                <Bar dataKey="j" fill="#0B63CE">
                  {splitData.map((e, i) => (
                    <Cell key={i} fill={e.nota >= 6.8 ? "#0B63CE" : "#8FAEC9"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="foot">Sem dados suficientes ainda.</p>
        )}
      </div>

      <div className="card">
        <h3>Partidas processadas</h3>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Competição</th>
              <th>Min</th>
              <th>Nota</th>
              <th>G</th>
              <th>A</th>
            </tr>
          </thead>
          <tbody>
            {stats
              .slice()
              .sort((a, b) => {
                const da = matchById[a.match_id]?.match_date ?? "";
                const db = matchById[b.match_id]?.match_date ?? "";
                return db.localeCompare(da);
              })
              .map((s) => {
                const m = matchById[s.match_id];
                return (
                  <tr key={s.id}>
                    <td>{m?.match_date ? new Date(m.match_date).toLocaleDateString("pt-BR") : "—"}</td>
                    <td>{m?.competition ?? "—"}</td>
                    <td className="mono">{s.minutes_played ?? "—"}</td>
                    <td className="mono">{s.rating ?? "—"}</td>
                    <td className="mono">{s.goals}</td>
                    <td className="mono">{s.assists}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </>
  );
}
