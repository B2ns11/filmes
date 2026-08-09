"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { StatusFilme, Usuario } from "@/lib/types";
import { api } from "@/lib/api";

const CATEGORIAS = ["Filme", "Série", "Minissérie", "Documentário", "Reality"];

export default function FilmeFormModal({
  aberto,
  onClose,
  onCriado,
  status,
}: {
  aberto: boolean;
  onClose: () => void;
  onCriado: () => void;
  status: StatusFilme;
}) {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("Filme");
  const [genero, setGenero] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [linkStreaming, setLinkStreaming] = useState("");
  const [ano, setAno] = useState("");
  const [sinopse, setSinopse] = useState("");
  const [fase, setFase] = useState("");
  const [notaBrunno, setNotaBrunno] = useState("");
  const [notaPaloma, setNotaPaloma] = useState("");
  const [indicadoPor, setIndicadoPor] = useState<Usuario | "">("");
  const [salvando, setSalvando] = useState(false);
  const [preenchendo, setPreenchendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function limpar() {
    setTitulo("");
    setCategoria("Filme");
    setGenero("");
    setPlataforma("");
    setLinkStreaming("");
    setAno("");
    setSinopse("");
    setFase("");
    setNotaBrunno("");
    setNotaPaloma("");
    setIndicadoPor("");
    setErro(null);
  }

  async function preencherComIA() {
    if (!titulo.trim()) {
      setErro("Escreve o título primeiro pra IA buscar.");
      return;
    }
    setPreenchendo(true);
    setErro(null);
    try {
      const res = await fetch("/api/filmes/preencher-dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo }),
      });
      const { dados, error } = await res.json();
      if (error) throw new Error(error);

      if (dados.genero) setGenero(dados.genero);
      if (dados.ano) setAno(String(dados.ano));
      if (dados.sinopse) setSinopse(dados.sinopse);
      if (dados.fase) setFase(dados.fase);
      if (dados.plataforma) setPlataforma(dados.plataforma);
      if (dados.link_streaming) setLinkStreaming(dados.link_streaming);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Erro ao preencher com IA. Preenche na mão."
      );
    } finally {
      setPreenchendo(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      setErro("Dá um título aí.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await api.criarFilme({
        titulo,
        categoria,
        genero,
        plataforma,
        link_streaming: linkStreaming || undefined,
        ano: ano ? Number(ano) : null,
        sinopse: sinopse.trim() || null,
        fase: fase.trim() || null,
        status,
        origem: "usuario",
        indicado_por: status === "para_assistir" ? indicadoPor || null : null,
        nota_brunno:
          status === "assistido" && notaBrunno !== "" ? Number(notaBrunno) : null,
        nota_paloma:
          status === "assistido" && notaPaloma !== "" ? Number(notaPaloma) : null,
      });
      limpar();
      onCriado();
      onClose();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      aberto={aberto}
      onClose={onClose}
      titulo={status === "assistido" ? "Adicionar filme/série assistido" : "Adicionar à lista de assistir"}
    >
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Título
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
            placeholder="Nome do filme ou série"
            autoFocus
          />
        </label>

        <button
          type="button"
          onClick={preencherComIA}
          disabled={!titulo.trim() || preenchendo}
          className="rounded-app bg-[var(--accent)]/15 px-4 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/25 disabled:opacity-50"
        >
          {preenchendo ? "Preenchendo com IA..." : "🤖 Preencher com IA"}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Categoria
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Gênero
            <input
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
              placeholder="Drama, Ação..."
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Plataforma
            <input
              value={plataforma}
              onChange={(e) => setPlataforma(e.target.value)}
              className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
              placeholder="Netflix, Cinema, Prime Video..."
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Link para assistir (URL)
            <input
              type="url"
              value={linkStreaming}
              onChange={(e) => setLinkStreaming(e.target.value)}
              className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Ano
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
              placeholder="2025"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Fase / saga
            <input
              value={fase}
              onChange={(e) => setFase(e.target.value)}
              className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
              placeholder="Fase 5, Saga do Multiverso..."
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Sinopse
          <textarea
            value={sinopse}
            onChange={(e) => setSinopse(e.target.value)}
            rows={3}
            className="resize-none rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
            placeholder="Do que se trata..."
          />
        </label>

        {status === "assistido" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Nota do Brunno (0-10)
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={notaBrunno}
                onChange={(e) => setNotaBrunno(e.target.value)}
                className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Nota da Paloma (0-10)
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={notaPaloma}
                onChange={(e) => setNotaPaloma(e.target.value)}
                className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
              />
            </label>
          </div>
        ) : (
          <label className="flex flex-col gap-1 text-sm">
            Indicação de
            <select
              value={indicadoPor}
              onChange={(e) => setIndicadoPor(e.target.value as Usuario | "")}
              className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
            >
              <option value="">Não informar</option>
              <option value="brunno">Brunno</option>
              <option value="paloma">Paloma</option>
            </select>
          </label>
        )}

        {erro && <p className="text-sm text-red-500">{erro}</p>}

        <button
          type="submit"
          disabled={salvando}
          className="mt-2 rounded-app py-2.5 font-medium text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </Modal>
  );
}
