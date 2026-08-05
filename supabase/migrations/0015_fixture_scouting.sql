-- Estrutura o que hoje é um texto livre em upcoming_fixtures.notes: contexto do
-- jogo, adversários de risco (com dado real por trás) e pontos de atenção do
-- nosso atleta pra essa partida especifica, com severidade.
alter table public.upcoming_fixtures add column if not exists scouting jsonb;
