"use client";

import { useRef, useState } from "react";

function redimensionar(file: File, tamanho = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não deu pra ler a imagem."));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const escala = Math.min(1, tamanho / Math.max(img.width, img.height));
        canvas.width = img.width * escala;
        canvas.height = img.height * escala;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas indisponível."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = leitor.result as string;
    };
    leitor.readAsDataURL(file);
  });
}

export default function PhotoUpload({
  valor,
  onChange,
}: {
  valor: string | null;
  onChange: (base64: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function lidarComArquivo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem.");
      return;
    }
    setErro(null);
    setCarregando(true);
    try {
      const base64 = await redimensionar(file);
      onChange(base64);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao processar a imagem.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-app border border-border text-3xl"
        style={{ background: "var(--accent-soft)" }}
      >
        {valor ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={valor} alt="Foto de perfil" className="h-full w-full object-cover" />
        ) : (
          "🙂"
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-app border border-border px-3 py-1.5 text-sm hover:border-[var(--accent)]"
            disabled={carregando}
          >
            {carregando ? "Carregando..." : "Trocar foto"}
          </button>
          {valor && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-app px-3 py-1.5 text-sm text-muted hover:text-ink"
            >
              Remover
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => lidarComArquivo(e.target.files?.[0])}
        />
        {erro && <p className="text-xs text-red-500">{erro}</p>}
      </div>
    </div>
  );
}
