-- Esquema do banco "Nosso Cinema"
-- Rode este script no Supabase: Project > SQL Editor > New query > cole e clique em RUN.

create extension if not exists pgcrypto;

create table if not exists perfis (
  usuario text primary key check (usuario in ('brunno', 'paloma')),
  nome text not null,
  foto_base64 text,
  generos_favoritos text[] not null default '{}',
  generos_evitar text[] not null default '{}',
  preferencias_extra text not null default '',
  criterios_avaliacao jsonb,
  atualizado_em timestamptz not null default now()
);

create table if not exists filmes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null default 'Filme',
  genero text not null default '',
  plataforma text not null default '',
  link_streaming text,
  status text not null default 'para_assistir' check (status in ('assistido', 'para_assistir', 'sugestao_ia')),
  origem text not null default 'usuario' check (origem in ('usuario', 'ia', 'planilha')),
  indicado_por text check (indicado_por in ('brunno', 'paloma') or indicado_por is null),
  motivo_ia text not null default '',
  nota_brunno numeric(4, 2),
  nota_paloma numeric(4, 2),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_filmes_status on filmes (status);
create index if not exists idx_filmes_titulo on filmes (lower(titulo));

-- Perfis iniciais (edite nome/preferências pela tela de Perfil do app depois)
insert into perfis (usuario, nome)
values ('brunno', 'Brunno'), ('paloma', 'Paloma')
on conflict (usuario) do nothing;

-- RLS habilitado e sem políticas públicas: o app só acessa o banco pelo backend
-- (rotas /api/* no Vercel), usando a service_role key, que nunca fica exposta ao navegador.
alter table perfis enable row level security;
alter table filmes enable row level security;
