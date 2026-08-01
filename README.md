# Vertice Scout

Plataforma de scouting profissional para acompanhar Luís Henrique (Inter de Milão, ex-Botafogo/Marseille — [Sofascore #977679](https://www.sofascore.com/pt/football/player/luis-henrique/977679)).

## Arquitetura

```
apps/web/                     Next.js 15 (App Router) — dashboard, login, PWA instalável
supabase/
  migrations/                 SQL versionado do schema
  functions/collector/        Edge Function agendada (Deno) — coletor de dados
packages/shared/               Tipos TypeScript compartilhados
```

- **Banco**: Supabase Postgres (projeto `vertice-scout`, `sa-east-1`).
- **Coletor**: roda como Supabase Edge Function agendada via `pg_cron`. Fonte primária: Sofascore (endpoints internos). Fallback/enriquecimento: FBref, Transfermarkt, Soccerway, site oficial da Inter, imprensa italiana (Gazzetta, Sky Sport Italia, Calciomercato, FCInterNews).
- **App**: Next.js no Vercel, Supabase Auth (login por convite — ferramenta interna, sem cadastro público).

## Fases

1. **Fundação** — coletor + Postgres + schema (concluído).
2. **App** — dashboard com login e histórico salvo por usuário.
3. **Tático/vídeo** — relatórios táticos + catálogo de vídeos-chave + marcação manual de eventos.

## Desenvolvimento

Requer Node 20+, Supabase CLI (`supabase link --project-ref <ref>`) para rodar migrações localmente.
