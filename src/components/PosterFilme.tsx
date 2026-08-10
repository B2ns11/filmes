/**
 * Coluna de pôster dos cards de filme.
 *
 * O pôster é 2:3 mas a coluna estica na altura do card, que varia com o texto.
 * Preencher com object-cover cortaria as laterais da arte (era o bug do
 * celular), então uma cópia borrada preenche a sobra e a arte inteira fica por
 * cima. A altura mínima acompanha a largura na proporção 2:3, então card curto
 * fica com o pôster exato, sem faixa nenhuma.
 */
export default function PosterFilme({
  url,
  titulo,
  ano,
}: {
  url: string | null;
  titulo: string;
  ano?: number | null;
}) {
  return (
    <div className="relative w-28 sm:w-32 shrink-0 self-stretch min-h-[168px] sm:min-h-[192px] overflow-hidden bg-surface-alt">
      {url ? (
        <>
          <img
            src={url}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-lg"
          />
          <img
            src={url}
            alt={titulo}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 text-3xl">
          🎬
        </div>
      )}
      {ano && (
        <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {ano}
        </span>
      )}
    </div>
  );
}
