import { GENEROS_SUGERIDOS } from "@/lib/types";

interface FiltrosGeneroProps {
  generosEscolhidos: string[];
  onChange: (generos: string[]) => void;
}

export default function FiltrosGenero({
  generosEscolhidos,
  onChange,
}: FiltrosGeneroProps) {
  const toggle = (genero: string) => {
    if (generosEscolhidos.includes(genero)) {
      onChange(generosEscolhidos.filter((g) => g !== genero));
    } else {
      onChange([...generosEscolhidos, genero]);
    }
  };

  const limpar = () => onChange([]);

  return (
    <div className="rounded-app border border-border bg-surface-alt p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">Filtrar por gênero</p>
        {generosEscolhidos.length > 0 && (
          <button
            onClick={limpar}
            className="text-xs text-muted hover:text-[var(--accent)]"
          >
            Limpar ({generosEscolhidos.length})
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {GENEROS_SUGERIDOS.map((genero) => (
          <button
            key={genero}
            onClick={() => toggle(genero)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              generosEscolhidos.includes(genero)
                ? "text-white"
                : "border border-border text-muted hover:border-[var(--accent)] hover:text-[var(--accent)]"
            }`}
            style={
              generosEscolhidos.includes(genero)
                ? { background: "var(--accent)" }
                : {}
            }
          >
            {genero}
          </button>
        ))}
      </div>
    </div>
  );
}
