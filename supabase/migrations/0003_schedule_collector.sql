create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Chama a Edge Function "collector" todo dia às 06:17 UTC.
-- A chave usada aqui é a "anon" (publishable) key do projeto, feita para ser exposta;
-- a função troca por service role internamente (ver supabase/functions/collector/db.ts).
select cron.schedule(
  'collector-daily',
  '17 6 * * *',
  $$
  select net.http_post(
    url := 'https://mkkostcvghoahzkxgpij.supabase.co/functions/v1/collector',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ra29zdGN2Z2hvYWh6a3hncGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MzU3MDEsImV4cCI6MjEwMTExMTcwMX0.4yverN9IYSkHemcnc0CuxSYZaDlS6hyQnb1uI62DtNE'
    ),
    body := '{}'::jsonb
  );
  $$
);
