drop view if exists public.player_season_stats;

create table public.player_season_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  club_id uuid references public.clubs(id),
  competition text not null,
  season text not null,
  is_loan boolean not null default false,
  appearances int,
  matches_started int,
  minutes_played int,
  goals int,
  assists int,
  avg_rating numeric,
  yellow_cards int,
  red_cards int,
  pass_accuracy_pct numeric,
  duels_won int,
  duels_total int,
  key_passes int,
  crosses_completed int,
  crosses_total int,
  interceptions int,
  clearances int,
  distance_km numeric,
  top_speed_kmh numeric,
  source text not null default 'sofascore',
  raw_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, competition, season, club_id)
);

alter table public.player_season_stats enable row level security;

create policy read_own_players on public.player_season_stats
  for select using (has_player_access(player_id));

create policy write_own_players on public.player_season_stats
  for all using (has_player_access(player_id)) with check (has_player_access(player_id));
