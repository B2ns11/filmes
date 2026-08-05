"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function MarcarAssistidoForm({
  filmeId,
  onConcluido,
}: {
  filmeId: string;
  onConcluido: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [notaBrunno, setNotaBrunno] = useState("");
  const [notaPaloma, setNotaPaloma] = useState("");
  const [salvando, setSalvando] = useState(false);

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="self-start text-xs font-medium"
        style={{ color: "var(--accent)" }}
      >
        ✓ Marcar como assistido
      </button>
    );
  }

  async function confirmar() {
    setSalvando(true);
    try {
      await api.atualizarFilme(filmeId, {
        status: "assistido",
        nota_brunno: notaBrunno !== "" ? Number(notaBrunno) : null,
        nota_paloma: notaPaloma !== "" ? Number(notaPaloma) : null,
      });
      onConcluido();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-app border border-border p-3">
      <p className="text-xs text-muted">Notas de 0 a 10 (pode deixar em branco)</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min={0}
          max={10}
          step={0.5}
          placeholder="Brunno"
          value={notaBrunno}
          onChange={(e) => setNotaBrunno(e.target.value)}
          className="rounded-app border border-border bg-surface-alt px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
        />
        <input
          type="number"
          min={0}
          max={10}
          step={0.5}
          placeholder="Paloma"
          value={notaPaloma}
          onChange={(e) => setNotaPaloma(e.target.value)}
          className="rounded-app border border-border bg-surface-alt px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={confirmar}
          disabled={salvando}
          className="rounded-app px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {salvando ? "Salvando..." : "Confirmar"}
        </button>
        <button onClick={() => setAberto(false)} className="text-xs text-muted">
          Cancelar
        </button>
      </div>
    </div>
  );
}
