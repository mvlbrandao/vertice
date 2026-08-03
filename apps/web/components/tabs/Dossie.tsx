"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DashboardData } from "@/components/Dashboard";
import type { PlayerStaffMember, StaffRole } from "@/lib/types";

const ROLE_LABELS: Record<StaffRole, string> = {
  preparador_fisico: "Preparador físico",
  analista_tatico: "Analista tático",
  empresario: "Empresário",
  medico: "Médico",
  outro: "Outro",
};

export default function Dossie({ data, isAdmin }: { data: DashboardData; isAdmin: boolean }) {
  const { stats, focusAreas, marketValue } = data;
  const [staff, setStaff] = useState<PlayerStaffMember[]>(data.staff);
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState<StaffRole>("preparador_fisico");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jogos = stats.length;
  // was_starter ainda não é preenchido pelo coletor — usamos 60+ min como proxy honesto
  // de "jogo relevante" em vez de inventar uma contagem de titularidade que não temos.
  const jogosComMinutos = stats.filter((s) => (s.minutes_played ?? 0) >= 60).length;
  const gols = stats.reduce((acc, s) => acc + (s.goals ?? 0), 0);
  const assist = stats.reduce((acc, s) => acc + (s.assists ?? 0), 0);
  const notas = stats.map((s) => s.rating).filter((r): r is number => r != null);
  const notaMedia = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
  const valorAtual = marketValue.length ? marketValue[marketValue.length - 1] : null;

  const criticas = focusAreas.filter((f) => f.priority === "Crítica" || f.priority === "Alta");

  async function addStaff() {
    if (!fullName.trim()) return;
    setSaving(true);
    setError(null);
    const { data: inserted, error } = await supabase
      .from("player_staff")
      .insert({
        player_id: data.player.id,
        role,
        full_name: fullName.trim(),
        email: email.trim() || null,
      })
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (inserted) {
      setStaff([...staff, inserted]);
      setFullName("");
      setEmail("");
      setShowForm(false);
    }
  }

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
            <em>{jogosComMinutos} com 60+ min em campo</em>
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
        <h3>Equipe técnica</h3>
        <p className="lede">
          Quem acompanha este atleta. Se o e-mail cadastrado aqui criar login, o acesso a este atleta é liberado
          automaticamente.
        </p>
        {staff.map((s) => (
          <div className="match" key={s.id} style={{ gridTemplateColumns: "160px 1fr" }}>
            <div className="mdate">{ROLE_LABELS[s.role] ?? s.role}</div>
            <div>
              <div className="mtitle" style={{ fontSize: 14, textTransform: "none" }}>
                {s.full_name}
              </div>
              <div className="mobs">
                {s.email ?? "sem e-mail cadastrado"}
                {s.linked_user_id ? " · login ativo" : " · ainda sem login"}
              </div>
            </div>
          </div>
        ))}
        {staff.length === 0 && <p className="foot">Nenhum membro de equipe cadastrado ainda.</p>}

        {isAdmin && (
          <div style={{ marginTop: 16 }}>
            {!showForm ? (
              <button className="btn" onClick={() => setShowForm(true)}>
                Adicionar membro da equipe
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
                {error && <div className="error">{error}</div>}
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  style={{ padding: 8, border: "1px solid #C9D4DD" }}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ padding: 8, border: "1px solid #C9D4DD" }}
                />
                <input
                  placeholder="E-mail (opcional — habilita login futuro)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ padding: 8, border: "1px solid #C9D4DD" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={addStaff} disabled={saving || !fullName.trim()}>
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    className="btn"
                    style={{ background: "#5F7387" }}
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
