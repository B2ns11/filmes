"use client";

import { useState } from "react";
import type { Filme } from "@/lib/types";

interface MarcarAssistidoModalProps {
  filme: Filme | null;
  aberto: boolean;
  onFechar: () => void;
  onSalvar: () => void;
}

export default function MarcarAssistidoModal({
  filme,
  aberto,
  onFechar,
  onSalvar,
}: MarcarAssistidoModalProps) {
  const [notaBrunno, setNotaBrunno] = useState(filme?.nota_brunno?.toString() || "");
  const [notaPaloma, setNotaPaloma] = useState(filme?.nota_paloma?.toString() || "");
  const [salvando, setSalvando] = useState(false);

  if (!filme || !aberto) return null;

  async function salvar() {
    if (!notaBrunno && !notaPaloma) {
      alert("Coloque pelo menos uma nota!");
      return;
    }

    const brunno = notaBrunno ? parseFloat(notaBrunno) : null;
    const paloma = notaPaloma ? parseFloat(notaPaloma) : null;

    if ((brunno && (brunno < 0 || brunno > 10)) || (paloma && (paloma < 0 || paloma > 10))) {
      alert("As notas devem estar entre 0 e 10!");
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch(`/api/filmes/${filme.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "assistido",
          nota_brunno: brunno,
          nota_paloma: paloma,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar");

      onSalvar();
      onFechar();
    } catch (e) {
      alert("Erro ao marcar como assistido");
      console.error(e);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="mb-5 text-2xl font-bold">👁️ Marcar como Assistido</h2>

        <div className="mb-4 p-4 bg-card/50 rounded-xl border border-border/50">
          <h3 className="font-semibold">{filme.titulo}</h3>
          <p className="text-xs text-muted mt-1">{filme.plataforma}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Nota Brunno (0-10)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={notaBrunno}
                onChange={(e) => setNotaBrunno(e.target.value)}
                placeholder="Ex: 8.5"
                className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
              />
              {notaBrunno && (
                <div className="text-2xl">
                  {parseFloat(notaBrunno) >= 8 ? "😍" : parseFloat(notaBrunno) >= 5 ? "🙂" : "😕"}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Nota Paloma (0-10)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={notaPaloma}
                onChange={(e) => setNotaPaloma(e.target.value)}
                placeholder="Ex: 9.0"
                className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
              />
              {notaPaloma && (
                <div className="text-2xl">
                  {parseFloat(notaPaloma) >= 8 ? "😍" : parseFloat(notaPaloma) >= 5 ? "🙂" : "😕"}
                </div>
              )}
            </div>
          </div>

          {notaBrunno && notaPaloma && (
            <div className="p-3 bg-[var(--accent)]/10 rounded-xl text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Média: {((parseFloat(notaBrunno) + parseFloat(notaPaloma)) / 2).toFixed(1)} ⭐
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onFechar}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-alt"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando || (!notaBrunno && !notaPaloma)}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {salvando ? "Salvando..." : "✓ Marcar Assistido"}
          </button>
        </div>
      </div>
    </div>
  );
}
