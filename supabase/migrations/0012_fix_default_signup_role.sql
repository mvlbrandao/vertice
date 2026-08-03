create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case when lower(new.email) = 'mvlbrandao.br@gmail.com' then 'admin' else 'viewer' end
  );
  return new;
end;
$$ language plpgsql security definer set search_path = 'public';
