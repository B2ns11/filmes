import { type CriterioAvaliacao, media, type Filme } from "@/lib/types";

interface FiltroClasseProps {
  criterios: CriterioAvaliacao[];
  classesEscolhidas: string[];
  onChange: (classes: string[]) => void;
}

export default function FiltroClasse({
  criterios,
  classesEscolhidas,
  onChange,
}: FiltroClasseProps) {
  const toggle = (label: string) => {
    if (classesEscolhidas.includes(label)) {
      onChange(classesEscolhidas.filter((c) => c !== label));
    } else {
      onChange([...classesEscolhidas, label]);
    }
  };

  const limpar = () => onChange([]);

  if (criterios.length === 0) return null;

  return (
    <div className="rounded-app border border-border bg-surface-alt p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">Filtrar por classe</p>
        {classesEscolhidas.length > 0 && (
          <button
            onClick={limpar}
            className="text-xs text-muted hover:text-[var(--accent)]"
          >
            Limpar ({classesEscolhidas.length})
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {criterios.map((criterio) => (
          <button
            key={criterio.label}
            onClick={() => toggle(criterio.label)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              classesEscolhidas.includes(criterio.label)
                ? "text-white"
                : "border border-border text-muted hover:border-[var(--accent)] hover:text-[var(--accent)]"
            }`}
            style={
              classesEscolhidas.includes(criterio.label)
                ? { background: "var(--accent)" }
                : {}
            }
          >
            {criterio.emoji} {criterio.label}
          </button>
        ))}
      </div>
    </div>
  );
}
