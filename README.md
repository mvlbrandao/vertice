# Vertice Scout

Plataforma de scouting profissional multi-atleta. Acompanha atualmente:

- **Luís Henrique Tomaz de Lima** — Inter de Milão, ex-Botafogo/Marseille ([Sofascore #977679](https://www.sofascore.com/pt/football/player/luis-henrique/977679))
- **Pedro Henrique Cardoso de Lima** — Wolverhampton, emprestado à Liga Portugal 2 ([Sofascore #1597270](https://www.sofascore.com/pt/football/player/pedro-lima/1597270))

Cada usuário só enxerga os atletas aos quais tem acesso liberado (`player_access`/`player_staff`); o dashboard tem um seletor de atleta para quem acompanha mais de um.

## Arquitetura

```
apps/web/                     Next.js 15 (App Router) — dashboard, login, PWA instalável
supabase/
  migrations/                 SQL versionado do schema
  functions/collector/        Edge Function agendada (Deno) — coletor de dados
packages/shared/               Tipos TypeScript compartilhados
```

- **Banco**: Supabase Postgres (projeto `vertice-scout`, `sa-east-1`).
- **Coletor**: roda como Supabase Edge Function agendada via `pg_cron`, uma vez por atleta (lista de alvos em `supabase/functions/collector/config.ts`). Fonte primária: Sofascore (endpoints internos — atualmente bloqueada com HTTP 403 pra requisições vindas da infra do Supabase). Fallback/enriquecimento: Transfermarkt e feeds de imprensa (Google News, por atleta, com tradução automática pra PT). Agregados de temporada (`player_season_stats`) e cobertura partida-a-partida (`player_match_stats`) de fontes bloqueadas são inseridos manualmente quando coletados fora da infra do Supabase.
- **App**: Next.js (ainda sem deploy no Vercel — roda localmente via `npm run dev`), Supabase Auth (login por convite/allowlist — ferramenta interna, sem cadastro público).

## Fases

1. **Fundação** — coletor + Postgres + schema (concluído).
2. **App multi-atleta** — dashboard com login, seletor de atleta, controle de acesso por atleta e equipe técnica dinâmica (concluído).
3. **Tático/vídeo** — relatórios táticos + catálogo de vídeos-chave + marcação manual de eventos (schema pronto, UI e conteúdo ainda não iniciados).

## Desenvolvimento

Requer Node 20+, Supabase CLI (`supabase link --project-ref <ref>`) para rodar migrações localmente.
