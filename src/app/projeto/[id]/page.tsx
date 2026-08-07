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
  const [filmeEditando, setFilmeEditando] = useState<Filme | null>(null);
  const [deletando, setDeletando] = useState<string | null>(null);

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

  async function deletarFilme(filmeId: string) {
    if (!confirm("Tem certeza que quer deletar?")) return;
    setDeletando(filmeId);
    try {
      const res = await fetch(`/api/filmes/${filmeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar");
      carregar();
    } catch (e) {
      alert("Erro ao deletar filme");
      console.error(e);
    } finally {
      setDeletando(null);
    }
  }

  function abrirEdicao(filme: Filme) {
    setFilmeEditando(filme);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setFilmeEditando(null);
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
          <div className="space-y-4">
            {filmesDaAba.map((f) => (
              <div
                key={f.id}
                className="flex gap-4 rounded-xl border border-border/50 bg-card/50 overflow-hidden hover:border-border hover:shadow-lg transition-all backdrop-blur-sm"
              >
                {/* Banner do lado esquerdo */}
                {f.banner_url ? (
                  <div className="shrink-0 w-24 h-32 rounded-l-xl overflow-hidden">
                    <img
                      src={f.banner_url}
                      alt={f.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="shrink-0 w-24 h-32 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-l-xl flex items-center justify-center text-2xl">
                    🎬
                  </div>
                )}

                {/* Conteúdo do lado direito */}
                <div className="flex-1 p-4 flex flex-col">
                  <h3 className="font-bold text-base line-clamp-2 hover:text-[var(--accent)] transition-colors">
                    {f.titulo}
                  </h3>

                  {f.sinopse && (
                    <p className="text-xs text-muted mt-1 line-clamp-2">{f.sinopse}</p>
                  )}

                  <div className="space-y-1 text-xs text-muted mt-2 mb-auto">
                    {f.genero && <p>🎭 {f.genero}</p>}
                    {f.ano && <p>📅 {f.ano}</p>}
                    {f.plataforma && <p>📺 {f.plataforma}</p>}
                  </div>

                  {/* Notas */}
                  {(f.nota_brunno !== null || f.nota_paloma !== null) && (
                    <div className="space-y-1 text-xs text-muted mt-2">
                      {f.nota_brunno !== null && (
                        <div className="flex items-center gap-1">
                          <span>Brunno:</span>
                          <span className="font-bold">{f.nota_brunno.toFixed(1)}</span>
                          <span>⭐</span>
                        </div>
                      )}
                      {f.nota_paloma !== null && (
                        <div className="flex items-center gap-1">
                          <span>Paloma:</span>
                          <span className="font-bold">{f.nota_paloma.toFixed(1)}</span>
                          <span>⭐</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botões */}
                  <div className="flex gap-2 mt-3">
                    {f.link_streaming && (
                      <a
                        href={f.link_streaming}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-white text-center transition-all hover:scale-105 active:scale-95"
                        style={{ background: "var(--accent)" }}
                      >
                        ▶️ Reproduzir
                      </a>
                    )}
                    {aba === "para_assistir" && (
                      <>
                        <button
                          onClick={() => abrirEdicao(f)}
                          className="px-3 py-2 text-xs font-medium rounded-lg transition-colors hover:bg-[var(--accent)]/20 hover:text-[var(--accent)]"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => deletarFilme(f.id)}
                          disabled={deletando === f.id}
                          className="px-3 py-2 text-xs font-medium text-red-500 rounded-lg transition-colors hover:bg-red-500/20 disabled:opacity-50"
                        >
                          {deletando === f.id ? "..." : "🗑️"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Adicionar/Editar Filme */}
      {typeof id === "string" && (
        <AdicionarFilmeProjetoModal
          projetoId={id}
          aberto={modalAberto}
          filmeEditando={filmeEditando}
          onFechar={fecharModal}
          onAdicionado={carregar}
        />
      )}
      </main>
    </AppShell>
  );
}
