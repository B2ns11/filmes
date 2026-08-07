"use client";

import { useState } from "react";

interface AdicionarFilmeProjetoModalProps {
  projetoId: string;
  aberto: boolean;
  onFechar: () => void;
  onAdicionado: () => void;
}

export default function AdicionarFilmeProjetoModal({
  projetoId,
  aberto,
  onFechar,
  onAdicionado,
}: AdicionarFilmeProjetoModalProps) {
  const [titulo, setTitulo] = useState("");
  const [genero, setGenero] = useState("");
  const [ano, setAno] = useState("");
  const [sinopse, setSinopse] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [preenchendo, setPreenchendo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function preencherComIA() {
    if (!titulo.trim()) return;
    setPreenchendo(true);
    try {
      const res = await fetch("/api/filmes/preencher-dados", {
        method: "POST",
        body: JSON.stringify({ titulo }),
      });
      const { dados, error } = await res.json();
      if (error) throw new Error(error);

      setGenero(dados.genero);
      setAno(dados.ano?.toString() || "");
      setSinopse(dados.sinopse);
    } catch (e) {
      alert("Erro ao preencher dados com IA. Verifique e preencha manualmente.");
      console.error(e);
    } finally {
      setPreenchendo(false);
    }
  }

  async function salvar() {
    if (!titulo.trim()) return;
    setSalvando(true);
    try {
      const res = await fetch("/api/filmes", {
        method: "POST",
        body: JSON.stringify({
          titulo: titulo.trim(),
          genero: genero.trim(),
          ano: ano ? parseInt(ano) : null,
          sinopse: sinopse.trim(),
          plataforma: plataforma.trim(),
          status: "para_assistir",
          projeto_id: projetoId,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");

      resetForm();
      onFechar();
      onAdicionado();
    } catch (e) {
      alert("Erro ao adicionar filme");
      console.error(e);
    } finally {
      setSalvando(false);
    }
  }

  function resetForm() {
    setTitulo("");
    setGenero("");
    setAno("");
    setSinopse("");
    setPlataforma("");
  }

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="mb-5 text-2xl font-bold">🎬 Adicionar Filme</h2>

        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Nome do filme"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />

        <button
          onClick={preencherComIA}
          disabled={!titulo.trim() || preenchendo}
          className="mb-4 w-full rounded-xl bg-[var(--accent)]/20 px-4 py-2.5 text-sm font-semibold text-[var(--accent)] transition-all hover:bg-[var(--accent)]/30 disabled:opacity-50"
        >
          {preenchendo ? "Preenchendo com IA..." : "🤖 Preencher com IA"}
        </button>

        <input
          value={genero}
          onChange={(e) => setGenero(e.target.value)}
          placeholder="Gênero"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />

        <input
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          placeholder="Ano"
          type="number"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />

        <input
          value={plataforma}
          onChange={(e) => setPlataforma(e.target.value)}
          placeholder="Plataforma (Netflix, Prime, etc)"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />

        <textarea
          value={sinopse}
          onChange={(e) => setSinopse(e.target.value)}
          placeholder="Sinopse"
          className="mb-4 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors resize-none"
          rows={3}
        />

        <div className="flex gap-3">
          <button
            onClick={onFechar}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-alt"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando || !titulo.trim()}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {salvando ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
