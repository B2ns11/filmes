"use client";

import { useState } from "react";
import Modal from "./Modal";
import { api } from "@/lib/api";
import { type Filme, media, avaliacaoBadge } from "@/lib/types";

interface FilmeDetailModalProps {
  filme: Filme | null;
  aberto: boolean;
  onClose: () => void;
  onAtualizado: () => void;
}

export default function FilmeDetailModal({
  filme,
  aberto,
  onClose,
  onAtualizado,
}: FilmeDetailModalProps) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(filme?.titulo || "");
  const [genero, setGenero] = useState(filme?.genero || "");
  const [plataforma, setPlataforma] = useState(filme?.plataforma || "");
  const [categoria, setCategoria] = useState(filme?.categoria || "");
  const [notaBrunno, setNotaBrunno] = useState(
    filme?.nota_brunno?.toString() || ""
  );
  const [notaPaloma, setNotaPaloma] = useState(
    filme?.nota_paloma?.toString() || ""
  );
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(false);

  if (!filme || !aberto) return null;

  const badge = avaliacaoBadge(media(filme));

  async function salvarEdicoes() {
    setSalvando(true);
    try {
      await api.atualizarFilme(filme.id, {
        titulo,
        genero,
        plataforma,
        categoria,
        nota_brunno: notaBrunno ? Number(notaBrunno) : null,
        nota_paloma: notaPaloma ? Number(notaPaloma) : null,
      });
      onAtualizado();
      setEditando(false);
      onClose();
    } finally {
      setSalvando(false);
    }
  }

  async function deletar() {
    if (!confirm("Tem certeza que quer deletar?")) return;
    setDeletando(true);
    try {
      await api.removerFilme(filme.id);
      onAtualizado();
      onClose();
    } finally {
      setDeletando(false);
    }
  }

  return (
    <Modal aberto={aberto} onClose={onClose} titulo={titulo}>
      <div className="flex flex-col gap-4">
        {!editando ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted">Categoria</p>
                <p className="text-sm font-medium">{filme.categoria}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Avaliação média</p>
                <p className="text-sm font-semibold">{badge.emoji} {media(filme) ?? "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted">Gênero</p>
                <p className="text-sm font-medium">{filme.genero}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Plataforma</p>
                <p className="text-sm font-medium">{filme.plataforma}</p>
              </div>
            </div>

            {(filme.nota_brunno !== null || filme.nota_paloma !== null) && (
              <div className="grid grid-cols-2 gap-4">
                {filme.nota_brunno !== null && (
                  <div>
                    <p className="text-xs text-muted">Nota Brunno</p>
                    <p className="text-sm font-medium">{filme.nota_brunno}</p>
                  </div>
                )}
                {filme.nota_paloma !== null && (
                  <div>
                    <p className="text-xs text-muted">Nota Paloma</p>
                    <p className="text-sm font-medium">{filme.nota_paloma}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setEditando(true);
                  setTitulo(filme.titulo);
                  setGenero(filme.genero);
                  setPlataforma(filme.plataforma);
                  setCategoria(filme.categoria);
                  setNotaBrunno(filme.nota_brunno?.toString() || "");
                  setNotaPaloma(filme.nota_paloma?.toString() || "");
                }}
                className="flex-1 rounded-app px-3 py-2 text-sm font-medium text-white"
                style={{ background: "var(--accent)" }}
              >
                Editar
              </button>
              <button
                onClick={deletar}
                disabled={deletando}
                className="flex-1 rounded-app border border-red-500 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-60"
              >
                {deletando ? "Deletando..." : "Deletar"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-muted">Título</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="mt-1 w-full rounded-app border border-border bg-surface-alt px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="text-xs text-muted">Categoria</label>
                <input
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="mt-1 w-full rounded-app border border-border bg-surface-alt px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="text-xs text-muted">Gênero</label>
                <input
                  type="text"
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  className="mt-1 w-full rounded-app border border-border bg-surface-alt px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="text-xs text-muted">Plataforma</label>
                <input
                  type="text"
                  value={plataforma}
                  onChange={(e) => setPlataforma(e.target.value)}
                  className="mt-1 w-full rounded-app border border-border bg-surface-alt px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted">Nota Brunno</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={notaBrunno}
                    onChange={(e) => setNotaBrunno(e.target.value)}
                    className="mt-1 w-full rounded-app border border-border bg-surface-alt px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Nota Paloma</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={notaPaloma}
                    onChange={(e) => setNotaPaloma(e.target.value)}
                    className="mt-1 w-full rounded-app border border-border bg-surface-alt px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={salvarEdicoes}
                disabled={salvando}
                className="flex-1 rounded-app px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                style={{ background: "var(--accent)" }}
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
              <button
                onClick={() => setEditando(false)}
                className="flex-1 rounded-app border border-border px-3 py-2 text-sm font-medium hover:bg-surface-alt"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
