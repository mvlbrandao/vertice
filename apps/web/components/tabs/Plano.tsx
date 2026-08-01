import type { DashboardData } from "@/components/Dashboard";

const CLASS_BY_PRIORITY: Record<string, string> = {
  "Crítica": "p-crit",
  Alta: "p-alta",
  Média: "p-media",
};

export default function Plano({ data }: { data: DashboardData }) {
  const { focusAreas } = data;
  return (
    <div className="card">
      <h3>Plano de desenvolvimento</h3>
      <p className="lede">
        Cada frente tem o diagnóstico que a justifica, ações concretas e indicadores de acompanhamento. Conteúdo
        editável pela equipe técnica — evolui com o tempo, não é estático.
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
              {f.kpis.map((k, i) => (
                <div key={i}>
                  <span>
                    {k.k}
                    {k.est && <span className="est">estimar</span>}
                  </span>
                  <span className="mono">
                    {k.base} → <b>{k.meta}</b>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {focusAreas.length === 0 && <p className="foot">Nenhuma frente cadastrada ainda.</p>}
    </div>
  );
}
