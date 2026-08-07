interface BotaoAssistirProps {
  linkStreaming?: string;
  tamanho?: "pequeno" | "grande";
}

export default function BotaoAssistir({
  linkStreaming,
  tamanho = "grande",
}: BotaoAssistirProps) {
  const temLink = linkStreaming && linkStreaming.trim().length > 0;

  if (tamanho === "pequeno") {
    return (
      <a
        href={linkStreaming || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={`rounded-app px-3 py-1.5 text-xs font-medium text-white transition-opacity ${
          temLink ? "cursor-pointer" : "cursor-not-allowed opacity-50"
        }`}
        style={{ background: temLink ? "var(--accent)" : "#666" }}
        onClick={(e) => !temLink && e.preventDefault()}
      >
        🎬 Assistir
      </a>
    );
  }

  return (
    <a
      href={linkStreaming || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full rounded-app px-4 py-3 text-center font-medium text-white transition-opacity ${
        temLink ? "cursor-pointer" : "cursor-not-allowed opacity-50"
      }`}
      style={{ background: temLink ? "var(--accent)" : "#666" }}
      onClick={(e) => !temLink && e.preventDefault()}
    >
      🎬 Assistir agora
    </a>
  );
}
