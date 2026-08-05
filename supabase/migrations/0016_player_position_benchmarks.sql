-- Benchmark de posição: onde o atleta está (nota + ranking) comparado com o
-- top 5 da própria liga e com o top 5 das 5 principais ligas europeias.
create table public.player_position_benchmarks (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  position_code text not null,
  position_label text not null,
  own_rating numeric,
  own_rating_source text,
  own_league_name text,
  own_league_season text,
  own_league_rank int,
  own_league_pool_note text,
  same_league_top5 jsonb not null default '[]'::jsonb,
  top_leagues_rank int,
  top_leagues_pool_note text,
  top_leagues_top5 jsonb not null default '[]'::jsonb,
  data_notes text,
  updated_at timestamptz not null default now(),
  unique (player_id)
);

alter table public.player_position_benchmarks enable row level security;

-- Uma policy só (for all já cobre select) — duas policies permissivas pro
-- mesmo select foi o erro que corrigimos em player_season_stats na 0014.
create policy read_write_own_players on public.player_position_benchmarks
  for all using (has_player_access(player_id)) with check (has_player_access(player_id));

create index idx_player_position_benchmarks_player_id on public.player_position_benchmarks (player_id);
