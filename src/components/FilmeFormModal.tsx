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
  const [notaBrunno, setNotaBrunno] = useState("");
  const [notaPaloma, setNotaPaloma] = useState("");
  const [indicadoPor, setIndicadoPor] = useState<Usuario | "">("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function limpar() {
    setTitulo("");
    setCategoria("Filme");
    setGenero("");
    setPlataforma("");
    setNotaBrunno("");
    setNotaPaloma("");
    setIndicadoPor("");
    setErro(null);
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

        <label className="flex flex-col gap-1 text-sm">
          Plataforma
          <input
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
            className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
            placeholder="Netflix, Cinema, Prime Video..."
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
