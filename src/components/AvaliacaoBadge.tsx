import { avaliacaoBadge } from "@/lib/types";

const CORES: Record<string, { bg: string; fg: string }> = {
  boa: { bg: "#dcfce7", fg: "#166534" },
  ok: { bg: "#fef3c7", fg: "#92400e" },
  ruim: { bg: "#fee2e2", fg: "#991b1b" },
  "sem-nota": { bg: "var(--surface)", fg: "var(--muted)" },
};

export default function AvaliacaoBadge({ media: m }: { media: number | null }) {
  const b = avaliacaoBadge(m);
  const cor = CORES[b.tone];
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: cor.bg, color: cor.fg }}
    >
      <span>{b.emoji}</span>
      {b.label}
      {m !== null && <span className="opacity-70">· {m.toFixed(1)}</span>}
    </span>
  );
}
