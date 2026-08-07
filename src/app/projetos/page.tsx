"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Projeto } from "@/lib/types";

const TEMAS: Record<string, { cor: string; bg: string }> = {
  mcu: { cor: "#E23636", bg: "rgba(226, 54, 54, 0.05)" },
  hp: { cor: "#7B2CBF", bg: "rgba(123, 44, 191, 0.05)" },
  sw: { cor: "#FFE81F", bg: "rgba(255, 232, 31, 0.05)" },
  lotr: { cor: "#C9A227", bg: "rgba(201, 162, 39, 0.05)" },
};

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalCriar, setModalCriar] = useState(false);
  const [modalEditar, setModalEditar] = useState<Projeto | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [emoji, setEmoji] = useState("🎬");
  const [tema, setTema] = useState<"" | "mcu" | "hp" | "sw" | "lotr">("");
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState<string | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch("/api/projetos");
      const { projetos } = await res.json();
      setProjetos(projetos);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }

  async function salvar() {
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      const method = modalEditar ? "PATCH" : "POST";
      const url = modalEditar ? `/api/projetos/${modalEditar.id}` : "/api/projetos";
      const res = await fetch(url, {
        method,
        body: JSON.stringify({ nome, descricao, emoji, tema: tema || null }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      setModalCriar(false);
      setModalEditar(null);
      resetForm();
      carregar();
    } catch (e) {
      alert("Erro ao salvar projeto");
    } finally {
      setSalvando(false);
    }
  }

  async function deletar(id: string) {
    if (!confirm("Tem certeza que quer deletar?")) return;
    setDeletando(id);
    try {
      const res = await fetch(`/api/projetos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar");
      carregar();
    } catch (e) {
      alert("Erro ao deletar projeto");
    } finally {
      setDeletando(null);
    }
  }

  function resetForm() {
    setNome("");
    setDescricao("");
    setEmoji("🎬");
    setTema("");
  }

  function abrirEdicao(p: Projeto) {
    setModalEditar(p);
    setNome(p.nome);
    setDescricao(p.descricao || "");
    setEmoji(p.emoji);
    setTema((p.tema as any) || "");
    setModalCriar(true);
  }

  function fecharModal() {
    setModalCriar(false);
    setModalEditar(null);
    resetForm();
  }

  return (
    <main className="min-h-dvh bg-surface">
      <div className="px-4 py-8">
        {/* Cabeçalho com estilo melhorado */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">📁 Projetos</h1>
            <p className="mt-2 text-base text-muted">Organize seus filmes em coleções temáticas</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setModalCriar(true);
            }}
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            style={{ background: "var(--accent)" }}
          >
            + Novo Projeto
          </button>
        </div>

        {/* Lista de Projetos */}
        {carregando ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-[var(--accent)]" />
            Carregando...
          </div>
        ) : projetos.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border/50 p-12 text-center">
            <p className="mb-3 text-5xl">📂</p>
            <p className="text-base text-muted">Nenhum projeto. Crie o primeiro!</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projetos.map((p) => {
              const temaCfg = p.tema ? TEMAS[p.tema] : null;
              return (
                <div
                  key={p.id}
                  className="group overflow-hidden rounded-xl border border-border/50 transition-all hover:border-border hover:shadow-lg bg-card/50 backdrop-blur-sm"
                >
                  <Link href={`/projeto/${p.id}`} className="block p-5">
                    <div
                      className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-3xl transition-transform group-hover:scale-110"
                      style={{
                        background: temaCfg ? `${temaCfg.cor}20` : "rgba(255,255,255,0.1)",
                        border: temaCfg ? `1px solid ${temaCfg.cor}30` : "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      {p.emoji}
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-[var(--accent)] transition-colors">{p.nome}</h3>
                    {p.descricao && <p className="mt-2 text-sm text-muted line-clamp-2">{p.descricao}</p>}
                    {p.tema && temaCfg && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: `${temaCfg.cor}15` }}>
                        <span className="text-xs font-semibold" style={{ color: temaCfg.cor }}>
                          {p.tema.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="border-t border-border/30 px-5 py-3 flex gap-2 bg-card/25">
                    <button
                      onClick={() => abrirEdicao(p)}
                      className="flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors hover:bg-[var(--accent)]/20 hover:text-[var(--accent)]"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => deletar(p.id)}
                      disabled={deletando === p.id}
                      className="flex-1 rounded-lg px-2 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {deletando === p.id ? "Deletando..." : "🗑️ Deletar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalCriar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && fecharModal()}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <h2 className="mb-6 text-2xl font-bold">
              {modalEditar ? "✏️ Editar Projeto" : "✨ Novo Projeto"}
            </h2>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do projeto"
              className="mb-4 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
            />

            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição (opcional)"
              className="mb-4 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
            />

            <div className="mb-4 flex items-center gap-3">
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🎬"
                maxLength={2}
                className="w-16 rounded-xl border border-border bg-surface px-4 py-3 text-2xl text-center outline-none focus:border-[var(--accent)] transition-colors"
              />
              <select
                value={tema}
                onChange={(e) => setTema(e.target.value as any)}
                className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
              >
                <option value="">Sem tema</option>
                <option value="mcu">🦸 Marvel (MCU)</option>
                <option value="hp">🧙 Harry Potter</option>
                <option value="sw">⚔️ Star Wars</option>
                <option value="lotr">💍 Senhor dos Anéis</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={fecharModal}
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-alt"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !nome.trim()}
                className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
