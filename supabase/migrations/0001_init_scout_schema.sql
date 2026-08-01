-- Helper: keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============ CORE ENTITIES ============

create table clubs (
  id uuid primary key default gen_random_uuid(),
  sofascore_id bigint unique,
  name text not null,
  country text,
  league text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  sofascore_id bigint unique,
  transfermarkt_id text,
  fotmob_id text,
  full_name text not null,
  known_as text,
  birth_date date,
  height_cm int,
  preferred_foot text,
  nationality text,
  position text,
  photo_url text,
  current_club_id uuid references clubs(id),
  jersey_number int,
  market_value_eur numeric,
  contract_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  sofascore_id bigint unique,
  competition text,
  season text,
  round text,
  match_date timestamptz,
  home_club_id uuid references clubs(id),
  away_club_id uuid references clubs(id),
  home_score int,
  away_score int,
  venue text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table player_match_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  minutes_played int,
  rating numeric,
  goals int default 0,
  assists int default 0,
  shots int default 0,
  shots_on_target int default 0,
  key_passes int default 0,
  passes_completed int,
  passes_attempted int,
  dribbles_completed int,
  dribbles_attempted int,
  duels_won int,
  duels_total int,
  tackles int,
  interceptions int,
  touches int,
  fouls_committed int,
  fouls_suffered int,
  yellow_card boolean default false,
  red_card boolean default false,
  position_played text,
  was_starter boolean,
  heatmap_data jsonb,
  source text not null default 'sofascore',
  raw_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(player_id, match_id)
);

create table transfer_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  from_club_id uuid references clubs(id),
  to_club_id uuid references clubs(id),
  transfer_date date,
  fee_eur numeric,
  transfer_type text, -- loan | permanent | free | end_of_loan
  source text,
  created_at timestamptz not null default now()
);

create table market_value_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  as_of_date date not null,
  value_eur numeric not null,
  source text not null default 'transfermarkt',
  created_at timestamptz not null default now(),
  unique(player_id, as_of_date, source)
);

create table injuries (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  injury_type text,
  start_date date,
  expected_return_date date,
  actual_return_date date,
  status text, -- active | recovered
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table news_items (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  source text not null,
  title text not null,
  url text unique,
  published_at timestamptz,
  summary text,
  category text, -- transfer | injury | performance | tatico | geral
  raw_snippet text,
  created_at timestamptz not null default now()
);

create table upcoming_fixtures (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  match_id uuid references matches(id) on delete cascade,
  opponent_club_id uuid references clubs(id),
  competition text,
  match_date timestamptz,
  is_probable_starter boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(player_id, match_id)
);

-- ============ TACTICAL / VIDEO (fase 3) ============

create table tactical_reports (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  match_id uuid references matches(id),
  title text not null,
  content text, -- markdown
  strengths jsonb,
  weaknesses jsonb,
  recommendations text,
  author text not null default 'system', -- system | user email/id
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table video_clips (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  match_id uuid references matches(id),
  title text not null,
  url text not null,
  source text, -- youtube | outro
  duration_seconds int,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

create table video_events (
  id uuid primary key default gen_random_uuid(),
  video_clip_id uuid not null references video_clips(id) on delete cascade,
  timestamp_seconds numeric not null,
  event_type text not null, -- drible_certo | erro_posicional | passe_chave | acao_defensiva | finalizacao | outro
  description text,
  tagged_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ============ OPS / USERS ============

create table collector_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running', -- running | success | error
  records_upserted int default 0,
  error_message text
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'analyst', -- admin | analyst | viewer
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  note_type text default 'geral',
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ TRIGGERS ============

create trigger trg_clubs_updated before update on clubs for each row execute function set_updated_at();
create trigger trg_players_updated before update on players for each row execute function set_updated_at();
create trigger trg_matches_updated before update on matches for each row execute function set_updated_at();
create trigger trg_pms_updated before update on player_match_stats for each row execute function set_updated_at();
create trigger trg_injuries_updated before update on injuries for each row execute function set_updated_at();
create trigger trg_fixtures_updated before update on upcoming_fixtures for each row execute function set_updated_at();
create trigger trg_reports_updated before update on tactical_reports for each row execute function set_updated_at();
create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
create trigger trg_notes_updated before update on user_notes for each row execute function set_updated_at();

-- ============ VIEWS ============

create view player_season_stats as
select
  pms.player_id,
  m.competition,
  m.season,
  count(*) as matches_played,
  sum(case when pms.was_starter then 1 else 0 end) as matches_started,
  sum(pms.minutes_played) as total_minutes,
  sum(pms.goals) as goals,
  sum(pms.assists) as assists,
  avg(pms.rating) as avg_rating,
  sum(pms.shots) as shots,
  sum(pms.key_passes) as key_passes
from player_match_stats pms
join matches m on m.id = pms.match_id
group by pms.player_id, m.competition, m.season;

create view player_rating_trend as
select
  pms.player_id,
  m.match_date,
  m.competition,
  pms.rating
from player_match_stats pms
join matches m on m.id = pms.match_id
where pms.rating is not null
order by m.match_date;

-- ============ RLS ============

alter table clubs enable row level security;
alter table players enable row level security;
alter table matches enable row level security;
alter table player_match_stats enable row level security;
alter table transfer_history enable row level security;
alter table market_value_history enable row level security;
alter table injuries enable row level security;
alter table news_items enable row level security;
alter table upcoming_fixtures enable row level security;
alter table tactical_reports enable row level security;
alter table video_clips enable row level security;
alter table video_events enable row level security;
alter table collector_runs enable row level security;
alter table profiles enable row level security;
alter table user_notes enable row level security;

-- Ferramenta interna: qualquer usuário autenticado (convidado) pode ler tudo.
create policy "read_authenticated" on clubs for select to authenticated using (true);
create policy "read_authenticated" on players for select to authenticated using (true);
create policy "read_authenticated" on matches for select to authenticated using (true);
create policy "read_authenticated" on player_match_stats for select to authenticated using (true);
create policy "read_authenticated" on transfer_history for select to authenticated using (true);
create policy "read_authenticated" on market_value_history for select to authenticated using (true);
create policy "read_authenticated" on injuries for select to authenticated using (true);
create policy "read_authenticated" on news_items for select to authenticated using (true);
create policy "read_authenticated" on upcoming_fixtures for select to authenticated using (true);
create policy "read_authenticated" on tactical_reports for select to authenticated using (true);
create policy "read_authenticated" on video_clips for select to authenticated using (true);
create policy "read_authenticated" on video_events for select to authenticated using (true);
create policy "read_authenticated" on collector_runs for select to authenticated using (true);
create policy "read_authenticated" on profiles for select to authenticated using (true);
create policy "read_authenticated" on user_notes for select to authenticated using (true);

-- Escrita: usuários autenticados podem criar/editar conteúdo tático e vídeo (equipe pequena e confiável).
create policy "write_authenticated" on tactical_reports for insert to authenticated with check (true);
create policy "update_authenticated" on tactical_reports for update to authenticated using (true);
create policy "write_authenticated" on video_clips for insert to authenticated with check (true);
create policy "write_authenticated" on video_events for insert to authenticated with check (true);

-- Notas: qualquer autenticado insere; só o dono edita/remove.
create policy "write_own_notes" on user_notes for insert to authenticated with check (auth.uid() = user_id);
create policy "update_own_notes" on user_notes for update to authenticated using (auth.uid() = user_id);
create policy "delete_own_notes" on user_notes for delete to authenticated using (auth.uid() = user_id);

-- Perfil: cada usuário edita apenas o próprio.
create policy "update_own_profile" on profiles for update to authenticated using (auth.uid() = id);
create policy "insert_own_profile" on profiles for insert to authenticated with check (auth.uid() = id);

-- auto-cria profile ao registrar usuário (convite)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'admin');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
