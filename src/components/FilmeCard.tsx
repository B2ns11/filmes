import type { Filme } from "@/lib/types";
import { media, PRIORIDADES } from "@/lib/types";
import AvaliacaoBadge from "./AvaliacaoBadge";
import BotaoAssistir from "./BotaoAssistir";
import PosterFilme from "./PosterFilme";

export default function FilmeCard({
  filme,
  rodape,
}: {
  filme: Filme;
  rodape?: React.ReactNode;
}) {
  const m = filme.status === "assistido" ? media(filme) : null;

  return (
    <div className="flex items-stretch overflow-hidden rounded-app border border-border bg-card shadow-sm">
      <PosterFilme url={filme.banner_url} titulo={filme.titulo} ano={filme.ano} />

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold leading-snug">{filme.titulo}</h3>
            <p className="text-xs text-muted">
              {filme.categoria}
              {filme.genero ? ` · ${filme.genero}` : ""}
              {filme.plataforma ? ` · ${filme.plataforma}` : ""}
            </p>
          </div>
          {filme.status === "assistido" && <AvaliacaoBadge media={m} />}
        </div>

        {filme.prioridade && (
          <span
            className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: `${PRIORIDADES[filme.prioridade].cor}22`,
              color: PRIORIDADES[filme.prioridade].cor,
            }}
          >
            {PRIORIDADES[filme.prioridade].emoji}{" "}
            {PRIORIDADES[filme.prioridade].label}
          </span>
        )}

        {filme.status === "assistido" && (
          <div className="flex gap-4 text-sm">
            <span>
              Brunno:{" "}
              <strong>
                {filme.nota_brunno !== null ? filme.nota_brunno.toFixed(1) : "—"}
              </strong>
            </span>
            <span>
              Paloma:{" "}
              <strong>
                {filme.nota_paloma !== null ? filme.nota_paloma.toFixed(1) : "—"}
              </strong>
            </span>
          </div>
        )}

        {filme.indicado_por && (
          <p className="text-xs text-muted">
            Indicação de{" "}
            <strong>{filme.indicado_por === "brunno" ? "Brunno" : "Paloma"}</strong>
          </p>
        )}

        {/* Por que a IA sugeriu. É o melhor do app — não sumir com isso. */}
        {filme.origem === "ia" && filme.motivo_ia && (
          <p
            className="rounded-app px-3 py-2 text-xs leading-relaxed"
            style={{ background: "var(--accent-soft)", color: "var(--ia-text-color)" }}
          >
            ✨ {filme.motivo_ia}
          </p>
        )}

        {filme.sinopse && !filme.motivo_ia && (
          <p className="line-clamp-2 text-xs text-muted">{filme.sinopse}</p>
        )}

        {filme.link_streaming && (
          <BotaoAssistir linkStreaming={filme.link_streaming} tamanho="pequeno" />
        )}

        {rodape && <div className="mt-auto pt-1">{rodape}</div>}
      </div>
    </div>
  );
}
