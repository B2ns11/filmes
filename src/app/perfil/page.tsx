"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PhotoUpload from "@/components/PhotoUpload";
import ChipsInput from "@/components/ChipsInput";
import { useUsuario } from "@/lib/useUsuario";
import { api } from "@/lib/api";
import { GENEROS_SUGERIDOS, type Perfil } from "@/lib/types";

export default function PerfilPage() {
  const { usuario } = useUsuario();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    api
      .buscarPerfil(usuario)
      .then(({ perfil }) => setPerfil(perfil))
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar perfil."))
      .finally(() => setCarregando(false));
  }, [usuario]);

  async function salvar() {
    if (!perfil || !usuario) return;
    setSalvando(true);
    setSalvo(false);
    try {
      const { perfil: atualizado } = await api.salvarPerfil({
        usuario,
        nome: perfil.nome,
        foto_base64: perfil.foto_base64,
        generos_favoritos: perfil.generos_favoritos,
        generos_evitar: perfil.generos_evitar,
        preferencias_extra: perfil.preferencias_extra,
      });
      setPerfil(atualizado);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AppShell>
      <h1 className="mb-1 text-xl font-semibold">Meu perfil</h1>
      <p className="mb-6 text-sm text-muted">
        Isso ajuda a IA a entender melhor o que sugerir pra vocês dois.
      </p>

      {erro && <p className="mb-4 text-sm text-red-500">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : !perfil ? null : (
        <div className="flex max-w-xl flex-col gap-6">
          <PhotoUpload
            valor={perfil.foto_base64}
            onChange={(v) => setPerfil({ ...perfil, foto_base64: v })}
          />

          <label className="flex flex-col gap-1 text-sm">
            Nome
            <input
              value={perfil.nome}
              onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
              className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Gêneros favoritos</span>
            <ChipsInput
              valores={perfil.generos_favoritos}
              onChange={(v) => setPerfil({ ...perfil, generos_favoritos: v })}
              sugestoes={GENEROS_SUGERIDOS}
              placeholder="Digite e aperte Enter, ou clique nas sugestões"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Gêneros que eu evito</span>
            <ChipsInput
              valores={perfil.generos_evitar}
              onChange={(v) => setPerfil({ ...perfil, generos_evitar: v })}
              sugestoes={GENEROS_SUGERIDOS}
              placeholder="Digite e aperte Enter, ou clique nas sugestões"
            />
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Outras preferências (atores, diretores, temas, o que quiser)
            <textarea
              value={perfil.preferencias_extra}
              onChange={(e) => setPerfil({ ...perfil, preferencias_extra: e.target.value })}
              rows={4}
              className="rounded-app border border-border bg-surface-alt px-3 py-2 outline-none focus:border-[var(--accent)]"
              placeholder="Ex: gosto de filmes com final surpreendente, prefiro coisas mais leves em época de trabalho puxado..."
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={salvar}
              disabled={salvando}
              className="rounded-app px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
            {salvo && <span className="text-sm text-green-600">Salvo!</span>}
          </div>
        </div>
      )}
    </AppShell>
  );
}
