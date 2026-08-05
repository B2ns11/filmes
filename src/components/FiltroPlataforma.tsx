interface FiltroPlataformaProps {
  plataformas: string[];
  selecionadas: string[];
  onChange: (plataformas: string[]) => void;
}

export default function FiltroPlataforma({
  plataformas,
  selecionadas,
  onChange,
}: FiltroPlataformaProps) {
  const toggle = (plataforma: string) => {
    if (selecionadas.includes(plataforma)) {
      onChange(selecionadas.filter((p) => p !== plataforma));
    } else {
      onChange([...selecionadas, plataforma]);
    }
  };

  const limpar = () => onChange([]);

  if (plataformas.length === 0) return null;

  return (
    <div className="rounded-app border border-border bg-surface-alt p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">Filtrar por plataforma</p>
        {selecionadas.length > 0 && (
          <button
            onClick={limpar}
            className="text-xs text-muted hover:text-[var(--accent)]"
          >
            Limpar ({selecionadas.length})
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {plataformas.map((plataforma) => (
          <button
            key={plataforma}
            onClick={() => toggle(plataforma)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selecionadas.includes(plataforma)
                ? "text-white"
                : "border border-border text-muted hover:border-[var(--accent)] hover:text-[var(--accent)]"
            }`}
            style={
              selecionadas.includes(plataforma)
                ? { background: "var(--accent)" }
                : {}
            }
          >
            {plataforma}
          </button>
        ))}
      </div>
    </div>
  );
}
