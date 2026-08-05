"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DashboardData } from "@/components/Dashboard";
import type { UserNote } from "@/lib/types";

export default function Dados({ data, userId }: { data: DashboardData; userId: string }) {
  const { news, collectorRuns } = data;
  const [notes, setNotes] = useState<UserNote[]>(data.notes);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote() {
    if (!draft.trim()) return;
    setSaving(true);
    const { data: inserted, error } = await supabase
      .from("user_notes")
      .insert({ user_id: userId, player_id: data.player.id, content: draft.trim() })
      .select("*")
      .single();
    setSaving(false);
    if (!error && inserted) {
      setNotes([inserted, ...notes]);
      setDraft("");
    }
  }

  return (
    <>
      <div className="card">
        <h3>Seu histórico de notas</h3>
        <p className="lede">Anotações pessoais salvas na sua conta — só você vê as suas edições, mas a equipe toda lê.</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Registrar observação..."
          rows={3}
          style={{ width: "100%", border: "1px solid #C9D4DD", padding: 10, fontFamily: "inherit", fontSize: 13.5, marginBottom: 10 }}
        />
        <button className="btn" onClick={addNote} disabled={saving || !draft.trim()}>
          {saving ? "Salvando..." : "Salvar nota"}
        </button>
        <div style={{ marginTop: 16 }}>
          {notes.map((n) => (
            <div key={n.id} className="match" style={{ gridTemplateColumns: "140px 1fr" }}>
              <div className="mdate">{new Date(n.created_at).toLocaleString("pt-BR")}</div>
              <div className="mobs">{n.content}</div>
            </div>
          ))}
          {notes.length === 0 && <p className="foot">Nenhuma nota salva ainda.</p>}
        </div>
      </div>

      <div className="card">
        <h3>Notícias recentes</h3>
        {news.map((n) => (
          <div key={n.id} className="match" style={{ gridTemplateColumns: "140px 1fr" }}>
            <div className="mdate">
              {n.published_at ? new Date(n.published_at).toLocaleDateString("pt-BR") : "—"}
              <b style={{ fontSize: 11 }}>{n.source}</b>
            </div>
            <div>
              <div className="mtitle" style={{ fontSize: 15, textTransform: "none" }}>
                {n.url ? (
                  <a href={n.url} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
                    {n.title}
                  </a>
                ) : (
                  n.title
                )}
                {n.title_original && (
                  <div style={{ fontSize: 11, color: "var(--mute)", textTransform: "none", marginTop: 2 }}>
                    traduzido do {n.language_original === "it" ? "italiano" : n.language_original === "en" ? "inglês" : "original"} — título original: {n.title_original}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {news.length === 0 && <p className="foot">Nenhuma notícia coletada ainda.</p>}
      </div>

      <div className="card">
        <h3>Status do coletor</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fonte</th>
                <th>Início</th>
                <th>Status</th>
                <th>Registros</th>
              </tr>
            </thead>
            <tbody>
              {collectorRuns.map((r) => (
                <tr key={r.id}>
                  <td>{r.source}</td>
                  <td>{new Date(r.started_at).toLocaleString("pt-BR")}</td>
                  <td className="mono">{r.status}</td>
                  <td className="mono">{r.records_upserted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="foot" style={{ marginTop: 12 }}>
          O Sofascore bloqueia requisições vindas da infraestrutura do Supabase (HTTP 403) — Transfermarkt e
          imprensa rodam automaticamente todo dia; dados ricos do Sofascore (heatmap, stats detalhadas) precisam de
          atualização manual periódica até plugarmos uma fonte paga (Opta/Wyscout/API-Football).
        </p>
      </div>
    </>
  );
}
