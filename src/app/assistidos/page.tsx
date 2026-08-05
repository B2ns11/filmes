"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import FilmeCard from "@/components/FilmeCard";
import FilmeFormModal from "@/components/FilmeFormModal";
import FiltrosGenero from "@/components/FiltrosGenero";
import FiltroNota from "@/components/FiltroNota";
import { api } from "@/lib/api";
import { media, type Filme } from "@/lib/types";

export default function AssistidosPage() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [generosEscolhidos, setGenerosEscolhidos] = useState<string[]>([]);
  const [notaMinima, setNotaMinima] = useState<number | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      const { filmes } = await api.listarFilmes("assistido");
      setFilmes(filmes);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = filmes.filter((f) => {
      // Filtro de busca por texto
      if (
        termo &&
        !f.titulo.toLowerCase().includes(termo) &&
        !f.genero.toLowerCase().includes(termo) &&
        !f.plataforma.toLowerCase().includes(termo)
      ) {
        return false;
      }

      // Filtro por gênero (múltiplos)
      if (generosEscolhidos.length > 0) {
        const generos = f.genero
          .split(",")
          .map((g) => g.trim())
          .map((g) => g.toLowerCase());
        const temGenero = generosEscolhidos.some((g) =>
          generos.includes(g.toLowerCase())
        );
        if (!temGenero) return false;
      }

      // Filtro por nota mínima
      if (notaMinima !== null) {
        const notaFilme = media(f);
        if (notaFilme === null || notaFilme < notaMinima) {
          return false;
        }
      }

      return true;
    });

    return [...lista].sort((a, b) => (media(b) ?? -1) - (media(a) ?? -1));
  }, [filmes, busca, generosEscolhidos, notaMinima]);

  async function remover(id: string) {
    if (!confirm("Remover este título da lista?")) return;
    await api.removerFilme(id);
    setFilmes((f) => f.filter((x) => x.id !== id));
  }

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Já assistimos</h1>
          <p className="text-sm text-muted">{filmes.length} títulos avaliados</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="rounded-app px-4 py-2 text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          + Adicionar assistido
        </button>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por título, gênero ou plataforma..."
        className="mb-5 w-full rounded-app border border-border bg-surface-alt px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
      />

      <div className="mb-5 flex flex-col gap-3">
        <FiltrosGenero
          generosEscolhidos={generosEscolhidos}
          onChange={setGenerosEscolhidos}
        />
        <FiltroNota notaMinima={notaMinima} onChange={setNotaMinima} />
      </div>

      {erro && <p className="mb-4 text-sm text-red-500">{erro}</p>}
      {carregando && <p className="text-sm text-muted">Carregando...</p>}

      {!carregando && filtrados.length === 0 && (
        <p className="rounded-app border border-dashed border-border p-8 text-center text-sm text-muted">
          Nada por aqui ainda. Adicione o primeiro título assistido!
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((f) => (
          <FilmeCard
            key={f.id}
            filme={f}
            rodape={
              <button
                onClick={() => remover(f.id)}
                className="-m-2 self-start p-2 text-xs text-muted active:text-red-500"
              >
                Remover
              </button>
            }
          />
        ))}
      </div>

      <FilmeFormModal
        aberto={modalAberto}
        onClose={() => setModalAberto(false)}
        onCriado={carregar}
        status="assistido"
      />
    </AppShell>
  );
}
