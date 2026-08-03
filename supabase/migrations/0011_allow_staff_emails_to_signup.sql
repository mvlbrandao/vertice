create or replace function reject_unapproved_signup()
returns trigger as $$
begin
  if not exists (
    select 1 from public.allowed_emails where lower(email) = lower(new.email)
  ) and not exists (
    select 1 from public.player_staff where lower(email) = lower(new.email)
  ) then
    raise exception 'Cadastro não autorizado para este e-mail. Peça para o administrador liberar seu acesso.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = 'public';
