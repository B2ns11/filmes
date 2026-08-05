"use client";

import { useState } from "react";

export default function ChipsInput({
  valores,
  onChange,
  sugestoes = [],
  placeholder,
}: {
  valores: string[];
  onChange: (v: string[]) => void;
  sugestoes?: string[];
  placeholder?: string;
}) {
  const [texto, setTexto] = useState("");

  function adicionar(v: string) {
    const limpo = v.trim();
    if (!limpo || valores.includes(limpo)) return;
    onChange([...valores, limpo]);
    setTexto("");
  }

  function remover(v: string) {
    onChange(valores.filter((x) => x !== v));
  }

  const disponiveis = sugestoes.filter((s) => !valores.includes(s));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {valores.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 rounded-full px-3 py-1 text-sm"
            style={{ background: "var(--accent-soft)", color: "var(--accent-2)" }}
          >
            {v}
            <button
              type="button"
              onClick={() => remover(v)}
              className="opacity-60 hover:opacity-100"
              aria-label={`Remover ${v}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            adicionar(texto);
          }
        }}
        placeholder={placeholder}
        className="rounded-app border border-border bg-surface-alt px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
      />

      {disponiveis.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {disponiveis.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => adicionar(s)}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
