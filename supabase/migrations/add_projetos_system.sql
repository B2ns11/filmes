-- Adicionar sistema de projetos temáticos

-- Tabela de projetos
create table if not exists projetos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  emoji text default '🎬',
  tema text check (tema in ('mcu', 'hp', 'sw', 'lotr', null)),
  criado_em timestamptz not null default now()
);

-- Adicionar campos na tabela filmes
alter table filmes
  add column if not exists projeto_id uuid references projetos(id) on delete set null,
  add column if not exists banner_url text,
  add column if not exists sinopse text,
  add column if not exists ano integer,
  add column if not exists fase text;

-- Índices
create index if not exists idx_filmes_projeto on filmes (projeto_id);
create index if not exists idx_projetos_tema on projetos (tema);

-- RLS
alter table projetos enable row level security;
