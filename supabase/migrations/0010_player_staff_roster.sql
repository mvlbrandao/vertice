create table player_staff (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  role text not null, -- preparador_fisico | analista_tatico | empresario | medico | outro
  full_name text not null,
  email text,
  phone text,
  notes text,
  linked_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_staff_updated before update on player_staff for each row execute function set_updated_at();

alter table player_staff enable row level security;

create policy "read_own_players" on player_staff for select to authenticated using (has_player_access(player_id));

create policy "admin_write" on player_staff for insert to authenticated
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "admin_update" on player_staff for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "admin_delete" on player_staff for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Quando o e-mail cadastrado aqui criar conta de verdade, linka automaticamente o user_id
-- e libera acesso ao atleta correspondente (sem precisar mexer em SQL de novo).
create or replace function link_staff_on_signup()
returns trigger as $$
begin
  update public.player_staff
  set linked_user_id = new.id
  where lower(email) = lower(new.email) and linked_user_id is null;

  insert into public.player_access (user_id, player_id)
  select new.id, ps.player_id
  from public.player_staff ps
  where lower(ps.email) = lower(new.email)
  on conflict (user_id, player_id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = 'public';

revoke execute on function link_staff_on_signup() from anon, authenticated, public;

create trigger trg_link_staff_on_signup
  after insert on auth.users
  for each row execute function link_staff_on_signup();
