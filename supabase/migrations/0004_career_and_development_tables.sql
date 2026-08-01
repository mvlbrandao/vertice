create table development_focus_areas (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  slug text not null,
  title text not null,
  priority text not null, -- Crítica | Alta | Média
  diagnosis text,
  actions jsonb, -- string[]
  kpis jsonb, -- [{k, base, meta, est}]
  sort_order int default 0,
  author text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(player_id, slug)
);

create table career_scenarios (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  slug text not null,
  name text not null,
  tag text,
  note text,
  scores jsonb not null, -- {criterion_id: 0-10}
  sort_order int default 0,
  author text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(player_id, slug)
);

create table decision_criteria (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  slug text not null,
  name text not null,
  default_weight int not null,
  description text,
  sort_order int default 0,
  unique(player_id, slug)
);

create trigger trg_focus_updated before update on development_focus_areas for each row execute function set_updated_at();
create trigger trg_scenarios_updated before update on career_scenarios for each row execute function set_updated_at();

alter table development_focus_areas enable row level security;
alter table career_scenarios enable row level security;
alter table decision_criteria enable row level security;

create policy "read_authenticated" on development_focus_areas for select to authenticated using (true);
create policy "read_authenticated" on career_scenarios for select to authenticated using (true);
create policy "read_authenticated" on decision_criteria for select to authenticated using (true);

create policy "write_authenticated" on development_focus_areas for insert to authenticated with check (true);
create policy "update_authenticated" on development_focus_areas for update to authenticated using (true);
create policy "write_authenticated" on career_scenarios for insert to authenticated with check (true);
create policy "update_authenticated" on career_scenarios for update to authenticated using (true);
