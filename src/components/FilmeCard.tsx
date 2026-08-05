import type { Filme } from "@/lib/types";
import { media } from "@/lib/types";
import AvaliacaoBadge from "./AvaliacaoBadge";
import BotaoAssistir from "./BotaoAssistir";

export default function FilmeCard({
  filme,
  rodape,
}: {
  filme: Filme;
  rodape?: React.ReactNode;
}) {
  const m = filme.status === "assistido" ? media(filme) : null;

  return (
    <div className="flex flex-col gap-3 rounded-app border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold leading-snug">{filme.titulo}</h3>
          <p className="text-xs text-muted">
            {filme.categoria}
            {filme.genero ? ` · ${filme.genero}` : ""}
            {filme.plataforma ? ` · ${filme.plataforma}` : ""}
          </p>
        </div>
        {filme.status === "assistido" && <AvaliacaoBadge media={m} />}
      </div>

      {filme.status === "assistido" && (
        <div className="flex gap-4 text-sm">
          <span>
            Brunno:{" "}
            <strong>{filme.nota_brunno !== null ? filme.nota_brunno.toFixed(1) : "—"}</strong>
          </span>
          <span>
            Paloma:{" "}
            <strong>{filme.nota_paloma !== null ? filme.nota_paloma.toFixed(1) : "—"}</strong>
          </span>
        </div>
      )}

      {filme.indicado_por && (
        <p className="text-xs text-muted">
          Indicação de <strong>{filme.indicado_por === "brunno" ? "Brunno" : "Paloma"}</strong>
        </p>
      )}

      {filme.origem === "ia" && filme.motivo_ia && (
        <p
          className="rounded-app px-3 py-2 text-xs leading-relaxed"
          style={{ background: "var(--accent-soft)", color: "var(--accent-2)" }}
        >
          ✨ {filme.motivo_ia}
        </p>
      )}

      {filme.link_streaming && (
        <BotaoAssistir linkStreaming={filme.link_streaming} tamanho="pequeno" />
      )}

      {rodape}
    </div>
  );
}
