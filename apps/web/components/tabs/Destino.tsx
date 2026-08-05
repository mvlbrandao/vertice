"use client";

import { useMemo, useState } from "react";
import type { DashboardData } from "@/components/Dashboard";
import type { NewsItem } from "@/lib/types";

const TRANSFER_WORDS = [
  "negocia",
  "interess",
  "sondag",
  "proposta",
  "monitor",
  "empréstimo",
  "emprestim",
  "transfer",
  "loan",
  "exit",
  "deal",
  "signing",
  "lined up",
  "topa negociar",
];
const NATIONAL_TEAM_WORDS = ["seleção", "seleçao", "convocad", "convocaç", "national team"];
const NEGATIVE_WORDS = [
  "suspens",
  "polêmic",
  "polemic",
  "expuls",
  "briga",
  "indisciplin",
  "advertên",
  "investigaç",
  "escândal",
];

// Palavras extras por cenário além do próprio nome — nomes de clube/liga que não aparecem
// literalmente no título do cenário, mas que a gente já sabe que são o assunto real dele.
const EXTRA_KEYWORDS: Record<string, string[]> = {
  "Retorno ao Brasil": ["Brasil", "Palmeiras"],
  "Retorno ao Brasil (clube de Libertadores)": ["Brasil", "Libertadores"],
  "Permanecer no Wolves (Championship)": ["Wolves", "Wolverhampton"],
  "Novo empréstimo no futebol inglês (Championship)": ["Championship"],
  "Empréstimo em outra liga europeia (repetir modelo Porto)": ["Porto"],
  "Permanecer na Inter": ["Inter", "Internazionale", "Milão"],
  "Premier League — meio de tabela": ["Premier League"],
  "Empréstimo na Serie A com protagonismo": ["Serie A"],
  "Süper Lig (Turquia)": ["Süper Lig", "Turquia", "Turkey"],
};

const NEWS_WINDOW_DAYS = 200;

function scenarioKeywords(name: string): string[] {
  const base = name
    .replace(/\(.+?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 3 && w[0] === w[0].toUpperCase());
  return [...new Set([...(EXTRA_KEYWORDS[name] ?? []), ...base])];
}

interface NewsSignal {
  score: number;
  transferHits: NewsItem[];
  nationalHits: NewsItem[];
  negativeHits: NewsItem[];
}

function computeNewsSignal(scenarioName: string, news: NewsItem[]): NewsSignal {
  const keywords = scenarioKeywords(scenarioName).map((k) => k.toLowerCase());
  const now = Date.now();
  const cutoff = now - NEWS_WINDOW_DAYS * 24 * 3600 * 1000;
  const recent = news.filter((n) => n.published_at && new Date(n.published_at).getTime() >= cutoff);

  const transferHits: NewsItem[] = [];
  const nationalHits: NewsItem[] = [];
  const negativeHits: NewsItem[] = [];

  for (const n of recent) {
    const text = `${n.title} ${n.title_original ?? ""}`.toLowerCase();
    const matchesScenario = keywords.some((k) => text.includes(k));
    if (matchesScenario && TRANSFER_WORDS.some((w) => text.includes(w))) transferHits.push(n);
    if (NATIONAL_TEAM_WORDS.some((w) => text.includes(w))) nationalHits.push(n);
    if (NEGATIVE_WORDS.some((w) => text.includes(w))) negativeHits.push(n);
  }

  let score = 5 + Math.min(2, transferHits.length) + Math.min(2, nationalHits.length) - Math.min(3, negativeHits.length * 1.5);
  score = Math.max(0, Math.min(10, score));

  return { score, transferHits, nationalHits, negativeHits };
}

export default function Destino({ data }: { data: DashboardData }) {
  const { criteria, scenarios, news } = data;
  const [pesos, setPesos] = useState<Record<string, number>>(() =>
    Object.fromEntries(criteria.map((c) => [c.slug, c.default_weight])),
  );

  const soma = Object.values(pesos).reduce((a, b) => a + b, 0);

  // Sinal de notícias é recalculado aqui, ao vivo, a cada carregamento — nunca lido de uma
  // nota manual salva. Assim que o coletor traz notícia nova, o próximo carregamento já reflete.
  const newsSignals = useMemo(() => {
    const map: Record<string, NewsSignal> = {};
    for (const s of scenarios) map[s.id] = computeNewsSignal(s.name, news);
    return map;
  }, [scenarios, news]);

  const ranking = useMemo(() => {
    return scenarios
      .map((s) => {
        const bruto = criteria.reduce((acc, c) => {
          const nota = c.slug === "noticias" ? newsSignals[s.id]?.score ?? 5 : s.scores[c.slug] ?? 0;
          return acc + nota * (pesos[c.slug] ?? 0);
        }, 0);
        return { ...s, score: soma ? bruto / soma : 0 };
      })
      .sort((a, b) => b.score - a.score);
  }, [scenarios, criteria, pesos, soma, newsSignals]);

  const max = Math.max(1, ...ranking.map((r) => r.score));

  return (
    <div className="grid2">
      <div className="card">
        <h3>Pesos da decisão</h3>
        <p className="lede">
          Ajuste o que importa para este atleta neste momento da carreira. Soma atual: <b className="mono">{soma}</b>.
        </p>
        {criteria.map((c) => {
          const isNews = c.slug === "noticias";
          return (
            <div className="slider" key={c.id}>
              <label htmlFor={`w-${c.slug}`}>
                {c.name}
                {isNews && (
                  <span className="pill p-media" style={{ marginLeft: 6 }}>
                    Auto
                  </span>
                )}
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
          );
        })}
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
        {ranking.map((s, i) => {
          const sig = newsSignals[s.id];
          return (
            <div className="dest" key={s.id} data-top={i === 0 ? "1" : "0"}>
              <div className="rankn mono">{i + 1}</div>
              <div>
                <div className="dname">{s.name}</div>
                <div className="dtag">{s.tag}</div>
                <div className="dnote">{s.note}</div>
                {sig && (sig.transferHits.length > 0 || sig.nationalHits.length > 0 || sig.negativeHits.length > 0) && (
                  <div className="foot" style={{ marginTop: 6 }}>
                    Sinal de notícias (nota {sig.score.toFixed(1)}/10, últimos {NEWS_WINDOW_DAYS}d):{" "}
                    {sig.transferHits.length > 0 && `${sig.transferHits.length} de transferência `}
                    {sig.nationalHits.length > 0 && `· ${sig.nationalHits.length} de seleção `}
                    {sig.negativeHits.length > 0 && `· ${sig.negativeHits.length} negativa(s) `}
                  </div>
                )}
                <div className="bar">
                  <i style={{ width: `${(s.score / max) * 100}%` }} />
                </div>
              </div>
              <div className="dscore">
                {s.score.toFixed(1)}
                <small>score</small>
              </div>
            </div>
          );
        })}
        {ranking.length === 0 && <p className="foot">Nenhum cenário cadastrado ainda.</p>}
        <div className="foot" style={{ marginTop: 12 }}>
          As notas por critério são julgamento de scouting a partir do contexto público de cada cenário, não dado
          medido — exceto "Sinal de notícias", que é calculado automaticamente das notícias reais coletadas (aba
          Dados) e recalcula sozinho a cada nova notícia. Ferramenta de apoio à discussão — não decide sozinha.
        </div>
      </div>
    </div>
  );
}
