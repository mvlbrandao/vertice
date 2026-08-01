"use client";

import { useMemo, useState } from "react";
import type { DashboardData } from "@/components/Dashboard";

export default function Destino({ data }: { data: DashboardData }) {
  const { criteria, scenarios } = data;
  const [pesos, setPesos] = useState<Record<string, number>>(() =>
    Object.fromEntries(criteria.map((c) => [c.slug, c.default_weight])),
  );

  const soma = Object.values(pesos).reduce((a, b) => a + b, 0);

  const ranking = useMemo(() => {
    return scenarios
      .map((s) => {
        const bruto = criteria.reduce((acc, c) => acc + (s.scores[c.slug] ?? 0) * (pesos[c.slug] ?? 0), 0);
        return { ...s, score: soma ? bruto / soma : 0 };
      })
      .sort((a, b) => b.score - a.score);
  }, [scenarios, criteria, pesos, soma]);

  const max = Math.max(1, ...ranking.map((r) => r.score));

  return (
    <div className="grid2">
      <div className="card">
        <h3>Pesos da decisão</h3>
        <p className="lede">
          Ajuste o que importa para este atleta neste momento da carreira. Soma atual: <b className="mono">{soma}</b>.
        </p>
        {criteria.map((c) => (
          <div className="slider" key={c.id}>
            <label htmlFor={`w-${c.slug}`}>
              {c.name}
              <small>{c.description}</small>
              <input
                id={`w-${c.slug}`}
                type="range"
                min={0}
                max={40}
                value={pesos[c.slug] ?? 0}
                onChange={(e) => setPesos({ ...pesos, [c.slug]: Number(e.target.value) })}
              />
            </label>
            <output className="mono">{pesos[c.slug] ?? 0}</output>
          </div>
        ))}
        <button
          className="btn"
          style={{ marginTop: 14 }}
          onClick={() => setPesos(Object.fromEntries(criteria.map((c) => [c.slug, c.default_weight])))}
        >
          Voltar aos pesos padrão
        </button>
      </div>

      <div className="card">
        <h3>Ranking de cenários</h3>
        <p className="lede">Nota de 0 a 10 por critério, ponderada pelos pesos ao lado.</p>
        {ranking.map((s, i) => (
          <div className="dest" key={s.id} data-top={i === 0 ? "1" : "0"}>
            <div className="rankn mono">{i + 1}</div>
            <div>
              <div className="dname">{s.name}</div>
              <div className="dtag">{s.tag}</div>
              <div className="dnote">{s.note}</div>
              <div className="bar">
                <i style={{ width: `${(s.score / max) * 100}%` }} />
              </div>
            </div>
            <div className="dscore">
              {s.score.toFixed(1)}
              <small>score</small>
            </div>
          </div>
        ))}
        {ranking.length === 0 && <p className="foot">Nenhum cenário cadastrado ainda.</p>}
        <div className="foot" style={{ marginTop: 12 }}>
          As notas por critério são julgamento de scouting a partir do contexto público de cada cenário, não dado
          medido. Ferramenta de apoio à discussão — não decide sozinha.
        </div>
      </div>
    </div>
  );
}
