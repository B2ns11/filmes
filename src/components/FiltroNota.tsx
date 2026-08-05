interface FiltroNotaProps {
  notaMinima: number | null;
  onChange: (nota: number | null) => void;
}

export default function FiltroNota({ notaMinima, onChange }: FiltroNotaProps) {
  const opcoes = [
    { label: "Todas", valor: null },
    { label: "≥ 5.0", valor: 5 },
    { label: "≥ 6.0", valor: 6 },
    { label: "≥ 7.0", valor: 7 },
    { label: "≥ 8.0", valor: 8 },
    { label: "≥ 9.0", valor: 9 },
  ];

  return (
    <div className="rounded-app border border-border bg-surface-alt p-4">
      <p className="mb-3 text-sm font-medium">Filtrar por nota mínima</p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => (
          <button
            key={opcao.label}
            onClick={() => onChange(opcao.valor)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              notaMinima === opcao.valor
                ? "text-white"
                : "border border-border text-muted hover:border-[var(--accent)] hover:text-[var(--accent)]"
            }`}
            style={
              notaMinima === opcao.valor
                ? { background: "var(--accent)" }
                : {}
            }
          >
            {opcao.label}
          </button>
        ))}
      </div>
    </div>
  );
}
