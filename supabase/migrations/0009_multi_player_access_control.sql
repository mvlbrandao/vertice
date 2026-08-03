create table player_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, player_id)
);

alter table player_access enable row level security;
create policy "read_own_access" on player_access for select to authenticated using (auth.uid() = user_id);

create or replace function has_player_access(target_player uuid)
returns boolean as $$
  select
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or exists (select 1 from player_access where user_id = auth.uid() and player_id = target_player);
$$ language sql stable security definer set search_path = 'public';

revoke execute on function has_player_access(uuid) from anon;

drop policy if exists "read_authenticated" on players;
create policy "read_own_players" on players for select to authenticated using (has_player_access(id));

drop policy if exists "read_authenticated" on player_match_stats;
create policy "read_own_players" on player_match_stats for select to authenticated using (has_player_access(player_id));

drop policy if exists "read_authenticated" on transfer_history;
create policy "read_own_players" on transfer_history for select to authenticated using (has_player_access(player_id));

drop policy if exists "read_authenticated" on market_value_history;
create policy "read_own_players" on market_value_history for select to authenticated using (has_player_access(player_id));

drop policy if exists "read_authenticated" on injuries;
create policy "read_own_players" on injuries for select to authenticated using (has_player_access(player_id));

drop policy if exists "read_authenticated" on news_items;
create policy "read_own_players" on news_items for select to authenticated using (player_id is null or has_player_access(player_id));

drop policy if exists "read_authenticated" on upcoming_fixtures;
create policy "read_own_players" on upcoming_fixtures for select to authenticated using (player_id is null or has_player_access(player_id));

drop policy if exists "read_authenticated" on tactical_reports;
create policy "read_own_players" on tactical_reports for select to authenticated using (has_player_access(player_id));

drop policy if exists "read_authenticated" on video_clips;
create policy "read_own_players" on video_clips for select to authenticated using (player_id is null or has_player_access(player_id));

drop policy if exists "read_authenticated" on development_focus_areas;
create policy "read_own_players" on development_focus_areas for select to authenticated using (has_player_access(player_id));

drop policy if exists "read_authenticated" on career_scenarios;
create policy "read_own_players" on career_scenarios for select to authenticated using (has_player_access(player_id));

drop policy if exists "read_authenticated" on decision_criteria;
create policy "read_own_players" on decision_criteria for select to authenticated using (has_player_access(player_id));

drop policy if exists "read_authenticated" on user_notes;
create policy "read_own_players" on user_notes for select to authenticated using (player_id is null or has_player_access(player_id));
