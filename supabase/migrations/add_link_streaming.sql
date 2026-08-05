-- Migration: Adicionar coluna link_streaming em filmes e criterios_avaliacao em perfis
-- Data: 2025-08-05

-- Adicionar coluna link_streaming na tabela filmes se não existir
alter table if exists filmes
add column if not exists link_streaming text;

-- Adicionar coluna criterios_avaliacao na tabela perfis se não existir
alter table if exists perfis
add column if not exists criterios_avaliacao jsonb;
