-- Views: run with querying user's privileges/RLS, not creator's
alter view player_season_stats set (security_invoker = true);
alter view player_rating_trend set (security_invoker = true);

-- Functions: pin search_path
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = '';

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'admin');
  return new;
end;
$$ language plpgsql security definer set search_path = 'public';

-- Trigger-only function: not meant to be callable directly via RPC
revoke execute on function handle_new_user() from anon, authenticated, public;
