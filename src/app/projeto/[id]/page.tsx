"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import AdicionarFilmeProjetoModal from "@/components/AdicionarFilmeProjetoModal";
import type { Projeto, Filme } from "@/lib/types";
import { media } from "@/lib/types";

const TEMAS: Record<string, { cor: string; bg: string }> = {
  mcu: { cor: "#E23636", bg: "linear-gradient(135deg, rgba(226,54,54,0.08) 0%, rgba(226,54,54,0.02) 100%)" },
  hp: { cor: "#7B2CBF", bg: "linear-gradient(135deg, rgba(123,44,191,0.08) 0%, rgba(123,44,191,0.02) 100%)" },
  sw: { cor: "#FFE81F", bg: "linear-gradient(135deg, rgba(255,232,31,0.08) 0%, rgba(255,232,31,0.02) 100%)" },
  lotr: { cor: "#C9A227", bg: "linear-gradient(135deg, rgba(201,162,39,0.08) 0%, rgba(201,162,39,0.02) 100%)" },
};

export default function ProjetoPage() {
  const { id } = useParams();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<"assistidos" | "para_assistir">("assistidos");
  const [modalAberto, setModalAberto] = useState(false);

  const temaCfg = projeto?.tema ? TEMAS[projeto.tema] : null;

  useEffect(() => {
    carregar();
  }, [id]);

  async function carregar() {
    setCarregando(true);
    try {
      const [projRes, filmesRes] = await Promise.all([
        fetch(`/api/projetos/${id}`),
        fetch(`/api/filmes?projetoId=${id}`),
      ]);
      const projData = await projRes.json();
      const filmesData = await filmesRes.json();
      setProjeto(projData.projeto);
      setFilmes(filmesData.filmes);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }

  const stats = useMemo(() => {
    const assistidos = filmes.filter((f) => f.status === "assistido");
    const paraAssistir = filmes.filter((f) => f.status === "para_assistir");
    const notas = assistidos
      .map((f) => media(f))
      .filter((n): n is number => n !== null);

    return {
      assistidos: assistidos.length,
      paraAssistir: paraAssistir.length,
      total: filmes.length,
      media: notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : "—",
      percentual: filmes.length > 0 ? Math.round((assistidos.length / filmes.length) * 100) : 0,
    };
  }, [filmes]);

  const filmesDaAba = useMemo(() => {
    return filmes.filter((f) => f.status === aba);
  }, [filmes, aba]);

  if (carregando || !projeto) {
    return (
      <AppShell>
        <main className="min-h-dvh bg-surface">
          <div className="px-4 py-6">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-[var(--accent)]" />
              Carregando...
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="min-h-dvh bg-surface">
      {/* Cabeçalho com fundo temático */}
      <div style={{ background: temaCfg?.bg }} className="border-b border-border/50">
        <div className="px-4 py-8">
          <Link href="/projetos" className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors">
            ← Voltar aos Projetos
          </Link>

          <div className="flex items-start gap-5">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl text-5xl flex-shrink-0 shadow-lg"
              style={{ background: `${temaCfg?.cor}20`, border: `2px solid ${temaCfg?.cor}30` }}
            >
              {projeto.emoji}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold">{projeto.nome}</h1>
              {projeto.descricao && <p className="mt-2 text-base text-muted">{projeto.descricao}</p>}
              {projeto.tema && temaCfg && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: `${temaCfg.cor}15` }}>
                  <span className="text-xs font-semibold" style={{ color: temaCfg.cor }}>
                    🎬 {projeto.tema.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Assistidos", value: stats.assistidos, icon: "👁️" },
              { label: "Na Fila", value: stats.paraAssistir, icon: "📋" },
              { label: "Média", value: stats.media, icon: "⭐" },
              { label: "Concluído", value: `${stats.percentual}%`, icon: "✅" },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm hover:border-border transition-colors"
                style={{ borderColor: temaCfg ? `${temaCfg.cor}20` : undefined }}
              >
                <p className="text-xs text-muted mb-1">{stat.icon} {stat.label}</p>
                <p className="text-3xl font-bold" style={{ color: temaCfg?.cor }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 py-8">
        {/* Cabeçalho com Abas e Botão */}
        <div className="mb-8 flex items-center justify-between gap-4">
          {/* Abas estilizadas */}
          <div className="flex gap-3 border-b border-border/50">
          {(["assistidos", "para_assistir"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAba(tab)}
              className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all ${
                aba === tab
                  ? "text-ink"
                  : "text-muted hover:text-ink"
              }`}
              style={
                aba === tab
                  ? {
                      background: `${temaCfg?.cor}15`,
                      borderBottom: `3px solid ${temaCfg?.cor}`,
                      color: temaCfg?.cor
                    }
                  : {}
              }
            >
              {tab === "assistidos" ? "👁️ Assistidos" : "📋 Para Assistir"}
            </button>
          ))}
          </div>

          {/* Botão Adicionar Filme */}
          {aba === "para_assistir" && (
            <button
              onClick={() => setModalAberto(true)}
              className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: "var(--accent)" }}
            >
              + Adicionar
            </button>
          )}
        </div>

        {/* Lista de filmes */}
        {filmesDaAba.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border/50 p-12 text-center">
            <p className="text-2xl mb-2">🎬</p>
            <p className="text-sm text-muted">Nenhum filme nesta seção</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filmesDaAba.map((f) => (
              <div
                key={f.id}
                className="group rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm hover:border-border hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-base line-clamp-2 flex-1 group-hover:text-[var(--accent)] transition-colors">
                    {f.titulo}
                  </h3>
                </div>

                <div className="space-y-2 text-xs text-muted mb-4">
                  {f.genero && <p>🎭 {f.genero}</p>}
                  {f.ano && <p>📅 {f.ano}</p>}
                  {f.plataforma && <p>📺 {f.plataforma}</p>}
                </div>

                {/* Notas */}
                {(f.nota_brunno !== null || f.nota_paloma !== null) ? (
                  <div className="space-y-2 border-t border-border/30 pt-3">
                    {f.nota_brunno !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted">Brunno</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold">{f.nota_brunno.toFixed(1)}</span>
                          <span className="text-xs">⭐</span>
                        </div>
                      </div>
                    )}
                    {f.nota_paloma !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted">Paloma</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold">{f.nota_paloma.toFixed(1)}</span>
                          <span className="text-xs">⭐</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted italic text-center py-3">Sem avaliações</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Adicionar Filme */}
      {typeof id === "string" && (
        <AdicionarFilmeProjetoModal
          projetoId={id}
          aberto={modalAberto}
          onFechar={() => setModalAberto(false)}
          onAdicionado={carregar}
        />
      )}
      </main>
    </AppShell>
  );
}
