"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Conta criada. Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sc-root login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>Vertice Scout</h1>
        <p>Acesso restrito à equipe de acompanhamento do atleta.</p>
        {error && <div className="error">{error}</div>}
        {info && <div className="foot" style={{ marginBottom: 10 }}>{info}</div>}
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta"}
        </button>
        <div className="login-toggle">
          {mode === "in" ? (
            <>
              Ainda não tem conta? <button type="button" onClick={() => setMode("up")}>Criar acesso</button>
            </>
          ) : (
            <>
              Já tem conta? <button type="button" onClick={() => setMode("in")}>Entrar</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
