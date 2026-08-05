-- Resolve os pontos levantados pelos advisors do Supabase (security + performance).

-- 1) has_player_access(): a role "anon" ainda conseguia chamar via RPC porque o
--    revoke da migração 0009 não tocou no grant implícito de PUBLIC.
revoke execute on function has_player_access(uuid) from public;
revoke execute on function has_player_access(uuid) from anon;
grant execute on function has_player_access(uuid) to authenticated;

-- 2) player_season_stats: "read_own_players" (select) é redundante com
--    "write_own_players" (for all, que já cobre select) — duas policies
--    permissivas pro mesmo select/role reavaliam a condição em dobro.
drop policy if exists read_own_players on public.player_season_stats;

-- 3) auth_rls_initplan: troca auth.<fn>() por (select auth.<fn>()) nas policies
--    abaixo pra Postgres avaliar uma vez por query, não uma vez por linha.
drop policy if exists read_own_access on public.player_access;
create policy read_own_access on public.player_access
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists update_own_profile on public.profiles;
create policy update_own_profile on public.profiles
  for update to authenticated using ((select auth.uid()) = id);

drop policy if exists insert_own_profile on public.profiles;
create policy insert_own_profile on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists delete_own_notes on public.user_notes;
create policy delete_own_notes on public.user_notes
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists update_own_notes on public.user_notes;
create policy update_own_notes on public.user_notes
  for update to authenticated using ((select auth.uid()) = user_id);

drop policy if exists write_own_notes on public.user_notes;
create policy write_own_notes on public.user_notes
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists admin_write on public.player_staff;
create policy admin_write on public.player_staff
  for insert to authenticated
  with check (exists (select 1 from profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'));

drop policy if exists admin_update on public.player_staff;
create policy admin_update on public.player_staff
  for update to authenticated
  using (exists (select 1 from profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'));

drop policy if exists admin_delete on public.player_staff;
create policy admin_delete on public.player_staff
  for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = (select auth.uid()) and profiles.role = 'admin'));

-- 4) unindexed_foreign_keys: índice em toda FK sinalizada pelo advisor.
create index if not exists idx_injuries_player_id on public.injuries (player_id);
create index if not exists idx_matches_away_club_id on public.matches (away_club_id);
create index if not exists idx_matches_home_club_id on public.matches (home_club_id);
create index if not exists idx_news_items_player_id on public.news_items (player_id);
create index if not exists idx_player_access_player_id on public.player_access (player_id);
create index if not exists idx_player_match_stats_match_id on public.player_match_stats (match_id);
create index if not exists idx_player_season_stats_club_id on public.player_season_stats (club_id);
create index if not exists idx_player_staff_linked_user_id on public.player_staff (linked_user_id);
create index if not exists idx_player_staff_player_id on public.player_staff (player_id);
create index if not exists idx_players_current_club_id on public.players (current_club_id);
create index if not exists idx_tactical_reports_match_id on public.tactical_reports (match_id);
create index if not exists idx_tactical_reports_player_id on public.tactical_reports (player_id);
create index if not exists idx_transfer_history_from_club_id on public.transfer_history (from_club_id);
create index if not exists idx_transfer_history_to_club_id on public.transfer_history (to_club_id);
create index if not exists idx_transfer_history_player_id on public.transfer_history (player_id);
create index if not exists idx_upcoming_fixtures_match_id on public.upcoming_fixtures (match_id);
create index if not exists idx_upcoming_fixtures_opponent_club_id on public.upcoming_fixtures (opponent_club_id);
create index if not exists idx_user_notes_player_id on public.user_notes (player_id);
create index if not exists idx_user_notes_user_id on public.user_notes (user_id);
create index if not exists idx_video_clips_match_id on public.video_clips (match_id);
create index if not exists idx_video_clips_player_id on public.video_clips (player_id);
create index if not exists idx_video_events_tagged_by on public.video_events (tagged_by);
create index if not exists idx_video_events_video_clip_id on public.video_events (video_clip_id);
