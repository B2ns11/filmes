"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Projeto, Filme } from "@/lib/types";
import { media } from "@/lib/types";

const TEMAS: Record<string, { cor: string; bg: string; glow: string }> = {
  mcu: {
    cor: "#E23636",
    bg: "linear-gradient(135deg, rgba(226,54,54,0.1) 0%, rgba(226,54,54,0.05) 100%)",
    glow: "rgba(226, 54, 54, 0.15)",
  },
  hp: {
    cor: "#7B2CBF",
    bg: "linear-gradient(135deg, rgba(123,44,191,0.1) 0%, rgba(123,44,191,0.05) 100%)",
    glow: "rgba(123, 44, 191, 0.15)",
  },
  sw: {
    cor: "#FFE81F",
    bg: "linear-gradient(135deg, rgba(255,232,31,0.1) 0%, rgba(255,232,31,0.05) 100%)",
    glow: "rgba(255, 232, 31, 0.15)",
  },
  lotr: {
    cor: "#C9A227",
    bg: "linear-gradient(135deg, rgba(201,162,39,0.1) 0%, rgba(201,162,39,0.05) 100%)",
    glow: "rgba(201, 162, 39, 0.15)",
  },
};

export default function ProjetoPage() {
  const { id } = useParams();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<"assistidos" | "para_assistir">("assistidos");

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
      <main className="min-h-dvh bg-surface">
        <div className="px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-[var(--accent)]" />
            Carregando...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-surface">
      {/* Cabeçalho temático */}
      <div style={temaCfg ? { background: temaCfg.bg } : {}} className="border-b border-border">
        <div className="px-4 py-6">
          <Link href="/projetos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            ← Voltar aos Projetos
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl text-4xl" style={temaCfg ? { background: `${temaCfg.cor}20` } : {}}>
              {projeto.emoji}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{projeto.nome}</h1>
              <p className="mt-1 text-sm text-muted">{projeto.descricao}</p>
              {projeto.tema && temaCfg && (
                <span className="mt-2 inline-block rounded px-2 py-1 text-xs font-medium" style={{ color: temaCfg.cor, background: `${temaCfg.cor}15` }}>
                  Tema: {projeto.tema.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-4 gap-3">
            <div className="rounded-app border border-border bg-card p-3 text-center">
              <p className="text-2xl font-bold">{stats.assistidos}</p>
              <p className="text-xs text-muted">Assistidos</p>
            </div>
            <div className="rounded-app border border-border bg-card p-3 text-center">
              <p className="text-2xl font-bold">{stats.paraAssistir}</p>
              <p className="text-xs text-muted">Na Fila</p>
            </div>
            <div className="rounded-app border border-border bg-card p-3 text-center">
              <p className="text-2xl font-bold">{stats.media}</p>
              <p className="text-xs text-muted">Média Geral</p>
            </div>
            <div className="rounded-app border border-border bg-card p-3 text-center">
              <p className="text-2xl font-bold">{stats.percentual}%</p>
              <p className="text-xs text-muted">Concluído</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 py-6">
        {/* Abas */}
        <div className="mb-6 flex gap-2 border-b border-border">
          {(["assistidos", "para_assistir"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAba(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                aba === tab
                  ? "border-b-2 text-ink"
                  : "text-muted hover:text-ink"
              }`}
              style={
                aba === tab ? { borderColor: temaCfg?.cor || "var(--accent)" } : {}
              }
            >
              {tab === "assistidos" ? "👁️ Assistidos" : "📋 Para Assistir"}
            </button>
          ))}
        </div>

        {/* Lista de filmes */}
        {filmesDaAba.length === 0 ? (
          <div className="rounded-app border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted">Nenhum filme nesta seção</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filmesDaAba.map((f) => (
              <div key={f.id} className="rounded-app border border-border bg-card p-4">
                <h3 className="font-semibold">{f.titulo}</h3>
                <p className="mt-1 text-xs text-muted">
                  {f.genero} • {f.ano || "—"} • {f.plataforma}
                </p>
                {f.nota_brunno !== null || f.nota_paloma !== null ? (
                  <div className="mt-2 flex gap-4 text-xs">
                    {f.nota_brunno !== null && (
                      <span>
                        Brunno: <strong>{f.nota_brunno.toFixed(1)}</strong>
                      </span>
                    )}
                    {f.nota_paloma !== null && (
                      <span>
                        Paloma: <strong>{f.nota_paloma.toFixed(1)}</strong>
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
