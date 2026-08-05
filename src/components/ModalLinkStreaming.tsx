"use client";

import { useState } from "react";
import Modal from "./Modal";

interface ModalLinkStreamingProps {
  aberto: boolean;
  titulo: string;
  onConfirmar: (link: string, plataforma: string) => void;
  onCancelar: () => void;
}

export default function ModalLinkStreaming({
  aberto,
  titulo,
  onConfirmar,
  onCancelar,
}: ModalLinkStreamingProps) {
  const [link, setLink] = useState("");
  const [plataforma, setPlataforma] = useState("");

  function confirmar() {
    onConfirmar(link, plataforma);
    setLink("");
    setPlataforma("");
  }

  function cancelar() {
    onCancelar();
    setLink("");
    setPlataforma("");
  }

  return (
    <Modal
      aberto={aberto}
      onClose={cancelar}
      titulo={`Link para assistir: ${titulo}`}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Onde você pode assistir este título? (opcional)
        </p>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Plataforma</span>
          <input
            type="text"
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
            placeholder="Netflix, Prime Video, Disney+..."
            className="rounded-app border border-border bg-surface-alt px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Link para assistir</span>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://www.netflix.com/title/..."
            className="rounded-app border border-border bg-surface-alt px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        <p className="text-xs text-muted">
          Exemplos:
          <br />
          Netflix: https://www.netflix.com/title/...
          <br />
          Prime Video: https://www.primevideo.com/...
          <br />
          Disney+: https://www.disneyplus.com/...
        </p>

        <div className="flex gap-2">
          <button
            onClick={confirmar}
            className="flex-1 rounded-app px-3 py-2 text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            Confirmar
          </button>
          <button
            onClick={cancelar}
            className="flex-1 rounded-app border border-border px-3 py-2 text-sm font-medium hover:bg-surface-alt"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
