"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { type CriterioAvaliacao, type Perfil } from "@/lib/types";

interface ConfiguracaoPerfilProps {
  perfil: Perfil | null;
  onAtualizado: () => void;
}

const CRITERIOS_PADRAO: CriterioAvaliacao[] = [
  { label: "Vale cada segundo", emoji: "⏳", notaMinima: 8 },
  { label: "Dá pro gasto", emoji: "😐", notaMinima: 5, notaMaxima: 7.99 },
  { label: "Sai dessa!", emoji: "🚫", notaMinima: 0, notaMaxima: 4.99 },
];

export default function ConfiguracaoPerfil({
  perfil,
  onAtualizado,
}: ConfiguracaoPerfilProps) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(perfil?.nome || "");
  const [criterios, setCriterios] = useState<CriterioAvaliacao[]>(
    perfil?.criterios_avaliacao || CRITERIOS_PADRAO
  );
  const [salvando, setSalvando] = useState(false);

  if (!perfil) return null;

  async function salvar() {
    setSalvando(true);
    try {
      await api.atualizarPerfil({
        nome,
        criterios_avaliacao: criterios,
      });
      onAtualizado();
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  }

  function restaurarPadrao() {
    setCriterios(CRITERIOS_PADRAO);
  }

  function adicionarCriterio() {
    setCriterios([
      ...criterios,
      { label: "Novo", emoji: "🎬", notaMinima: 0 },
    ]);
  }

  function atualizarCriterio(
    index: number,
    campo: keyof CriterioAvaliacao,
    valor: string | number
  ) {
    const novo = [...criterios];
    const criterio = { ...novo[index] };

    if (campo === "notaMinima") {
      criterio.notaMinima = Number(valor) || 0;
    } else if (campo === "notaMaxima") {
      criterio.notaMaxima = valor === "" ? undefined : Number(valor);
    } else {
      (criterio[campo] as any) = valor;
    }

    novo[index] = criterio;
    setCriterios(novo);
  }

  function removerCriterio(index: number) {
    setCriterios(criterios.filter((_, i) => i !== index));
  }

  if (!editando) {
    return (
      <div className="rounded-app border border-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Configurações</h2>
          <button
            onClick={() => setEditando(true)}
            className="rounded-app px-3 py-1.5 text-xs font-medium"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Editar
          </button>
        </div>

        <div className="mb-6">
          <p className="text-xs text-muted">Nome</p>
          <p className="text-sm font-medium">{nome}</p>
        </div>

        <div>
          <p className="mb-3 text-xs font-medium text-muted">Critérios de Avaliação</p>
          <div className="flex flex-col gap-2">
            {criterios.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-app border border-border p-2">
                <span>{c.emoji}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium">{c.label}</p>
                  <p className="text-xs text-muted">
                    {c.notaMinima} {c.notaMaxima ? `- ${c.notaMaxima}` : "+"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-app border border-border p-6">
      <h2 className="mb-4 text-lg font-semibold">Editar Configurações</h2>

      <div className="mb-6">
        <label className="text-xs text-muted">Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mt-1 w-full rounded-app border border-border bg-surface-alt px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium text-muted">Critérios de Avaliação</p>
          <button
            onClick={restaurarPadrao}
            className="text-xs text-muted hover:text-[var(--accent)]"
          >
            Restaurar padrão
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {criterios.map((c, i) => (
            <div key={i} className="rounded-app border border-border p-4">
              <div className="mb-3 grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted">Emoji</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={c.emoji}
                    onChange={(e) => atualizarCriterio(i, "emoji", e.target.value)}
                    className="mt-1 w-full rounded-app border border-border bg-surface-alt px-2 py-1 text-center text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted">Label</label>
                  <input
                    type="text"
                    value={c.label}
                    onChange={(e) => atualizarCriterio(i, "label", e.target.value)}
                    className="mt-1 w-full rounded-app border border-border bg-surface-alt px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted">Nota Mínima</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={c.notaMinima}
                    onChange={(e) => atualizarCriterio(i, "notaMinima", e.target.value)}
                    className="mt-1 w-full rounded-app border border-border bg-surface-alt px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Nota Máxima</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={c.notaMaxima ?? ""}
                    onChange={(e) => atualizarCriterio(i, "notaMaxima", e.target.value)}
                    placeholder="(opcional)"
                    className="mt-1 w-full rounded-app border border-border bg-surface-alt px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {criterios.length > 1 && (
                <button
                  onClick={() => removerCriterio(i)}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={adicionarCriterio}
          className="mt-3 w-full rounded-app border border-border px-3 py-2 text-xs font-medium hover:bg-surface-alt"
        >
          + Adicionar critério
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex-1 rounded-app px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button
          onClick={() => {
            setEditando(false);
            setNome(perfil.nome);
            setCriterios(perfil.criterios_avaliacao || CRITERIOS_PADRAO);
          }}
          className="flex-1 rounded-app border border-border px-3 py-2 text-sm font-medium hover:bg-surface-alt"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
