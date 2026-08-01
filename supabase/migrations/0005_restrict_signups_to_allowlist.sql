create table allowed_emails (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

insert into allowed_emails (email, note) values
  ('mvlbrandao.br@gmail.com', 'dono do projeto');

create or replace function reject_unapproved_signup()
returns trigger as $$
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(new.email)
  ) then
    raise exception 'Cadastro não autorizado para este e-mail. Peça para o administrador liberar seu acesso.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = 'public';

create trigger trg_reject_unapproved_signup
  before insert on auth.users
  for each row execute function reject_unapproved_signup();

alter table allowed_emails enable row level security;
create policy "read_authenticated" on allowed_emails for select to authenticated using (true);
