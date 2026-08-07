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
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Cabeçalho */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">📁 Projetos</h1>
            <p className="text-sm text-muted">Organize seus filmes em coleções temáticas</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setModalCriar(true);
            }}
            className="rounded-app px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105 active:scale-95"
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
          <div className="rounded-app border border-dashed border-border p-10 text-center">
            <p className="mb-3 text-4xl">📂</p>
            <p className="text-sm text-muted">Nenhum projeto. Crie o primeiro!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projetos.map((p) => {
              const temaCfg = p.tema ? TEMAS[p.tema] : null;
              return (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-app border transition-all hover:shadow-lg"
                  style={{
                    borderColor: temaCfg ? `${temaCfg.cor}40` : "var(--border)",
                    background: temaCfg ? temaCfg.bg : "transparent",
                  }}
                >
                  <Link href={`/projeto/${p.id}`} className="block p-4">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-2xl" style={temaCfg ? { background: `${temaCfg.cor}15` } : {}}>
                      {p.emoji}
                    </div>
                    <h3 className="font-semibold">{p.nome}</h3>
                    {p.descricao && <p className="mt-1 text-xs text-muted">{p.descricao}</p>}
                    {p.tema && temaCfg && (
                      <span className="mt-2 inline-block rounded px-2 py-1 text-xs font-medium" style={{ color: temaCfg.cor, background: `${temaCfg.cor}15` }}>
                        {p.tema.toUpperCase()}
                      </span>
                    )}
                  </Link>
                  <div className="border-t border-border px-4 py-2 flex gap-2">
                    <button
                      onClick={() => abrirEdicao(p)}
                      className="flex-1 rounded px-2 py-1 text-xs hover:bg-surface-alt"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => deletar(p.id)}
                      disabled={deletando === p.id}
                      className="flex-1 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-50"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && fecharModal()}
        >
          <div className="w-full max-w-md rounded-app border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {modalEditar ? "Editar Projeto" : "Novo Projeto"}
            </h2>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome"
              className="mb-3 w-full rounded-app border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />

            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição (opcional)"
              className="mb-3 w-full rounded-app border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />

            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="Emoji"
              maxLength={2}
              className="mb-3 w-full rounded-app border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />

            <select
              value={tema}
              onChange={(e) => setTema(e.target.value as any)}
              className="mb-4 w-full rounded-app border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="">Sem tema</option>
              <option value="mcu">🦸 Marvel (MCU)</option>
              <option value="hp">🧙 Harry Potter</option>
              <option value="sw">⚔️ Star Wars</option>
              <option value="lotr">💍 Senhor dos Anéis</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={fecharModal}
                className="flex-1 rounded-app border border-border px-4 py-2 text-sm hover:bg-surface-alt"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !nome.trim()}
                className="flex-1 rounded-app px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
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
