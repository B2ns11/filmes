-- Sistema de farol: marca a importância de cada filme dentro de um projeto.
--   obrigatorio = 🔴  |  recomendado = 🟡  |  pular = 🟢
--
-- Preenchido automaticamente quando o print importado em lote tem a bolinha
-- colorida antes do título, e editável à mão no modal do filme.

alter table filmes
  add column if not exists prioridade text
  check (prioridade in ('obrigatorio', 'recomendado', 'pular'));

create index if not exists idx_filmes_prioridade on filmes (prioridade);
