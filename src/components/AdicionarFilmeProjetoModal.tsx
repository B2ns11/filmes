"use client";

import { useEffect, useState } from "react";
import type { Filme } from "@/lib/types";

interface AdicionarFilmeProjetoModalProps {
  projetoId: string;
  aberto: boolean;
  filmeEditando?: Filme | null;
  onFechar: () => void;
  onAdicionado: () => void;
}

export default function AdicionarFilmeProjetoModal({
  projetoId,
  aberto,
  filmeEditando,
  onFechar,
  onAdicionado,
}: AdicionarFilmeProjetoModalProps) {
  useEffect(() => {
    if (filmeEditando) {
      setTitulo(filmeEditando.titulo);
      setGenero(filmeEditando.genero || "");
      setAno(filmeEditando.ano?.toString() || "");
      setSinopse(filmeEditando.sinopse || "");
      setPlataforma(filmeEditando.plataforma || "");
      setLinkStreaming(filmeEditando.link_streaming || "");
      setBannerPreview(filmeEditando.banner_url || "");
    } else if (!aberto) {
      resetForm();
    }
  }, [filmeEditando, aberto]);
  const [titulo, setTitulo] = useState("");
  const [genero, setGenero] = useState("");
  const [ano, setAno] = useState("");
  const [sinopse, setSinopse] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [linkStreaming, setLinkStreaming] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
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
      setPlataforma(dados.plataforma || "");
      setLinkStreaming(dados.link_streaming || "");
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
      const dados = {
        titulo: titulo.trim(),
        genero: genero.trim(),
        ano: ano ? parseInt(ano) : null,
        sinopse: sinopse.trim(),
        plataforma: plataforma.trim(),
        link_streaming: linkStreaming.trim(),
        banner_url: bannerPreview,
      };

      if (filmeEditando) {
        // Atualizar filme existente
        const res = await fetch(`/api/filmes/${filmeEditando.id}`, {
          method: "PATCH",
          body: JSON.stringify(dados),
        });
        if (!res.ok) throw new Error("Erro ao atualizar");
      } else {
        // Criar novo filme
        const res = await fetch("/api/filmes", {
          method: "POST",
          body: JSON.stringify({
            ...dados,
            status: "para_assistir",
            projeto_id: projetoId,
          }),
        });
        if (!res.ok) throw new Error("Erro ao adicionar");
      }

      resetForm();
      onFechar();
      onAdicionado();
    } catch (e) {
      alert("Erro ao salvar filme");
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
    setLinkStreaming("");
    setBannerFile(null);
    setBannerPreview("");
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setBannerPreview(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="mb-5 text-2xl font-bold">
          {filmeEditando ? "✏️ Editar Filme" : "🎬 Adicionar Filme"}
        </h2>

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
          placeholder="Plataforma (Netflix, Prime, Disney+, etc)"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />

        <input
          value={linkStreaming}
          onChange={(e) => setLinkStreaming(e.target.value)}
          placeholder="Link de streaming (ex: https://...)"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />

        <textarea
          value={sinopse}
          onChange={(e) => setSinopse(e.target.value)}
          placeholder="Sinopse"
          className="mb-4 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors resize-none"
          rows={3}
        />

        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold text-muted">Banner/Poster (opcional)</label>
          {bannerPreview && (
            <img
              src={bannerPreview}
              alt="Preview"
              className="mb-2 max-h-32 w-full rounded-lg object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

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
            {salvando ? "Salvando..." : filmeEditando ? "Atualizar" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
