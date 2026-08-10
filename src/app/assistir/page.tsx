"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import FilmeCard from "@/components/FilmeCard";
import FilmeFormModal from "@/components/FilmeFormModal";
import FilmeDetailModal from "@/components/FilmeDetailModal";
import MarcarAssistidoForm from "@/components/MarcarAssistidoForm";
import FiltrosGenero from "@/components/FiltrosGenero";
import FiltroPlataforma from "@/components/FiltroPlataforma";
import { api } from "@/lib/api";
import type { Filme } from "@/lib/types";

export default function AssistirPage() {
  const [paraAssistir, setParaAssistir] = useState<Filme[]>([]);
  const [sugestoes, setSugestoes] = useState<Filme[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoIA, setAvisoIA] = useState<string | null>(null);
  const [generosEscolhidos, setGenerosEscolhidos] = useState<string[]>([]);
  const [plataformasEscolhidas, setPlataformasEscolhidas] = useState<string[]>([]);
  const [filmeDetail, setFilmeDetail] = useState<Filme | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      const [a, b] = await Promise.all([
        api.listarFilmes("para_assistir"),
        api.listarFilmes("sugestao_ia"),
      ]);
      setParaAssistir(a.filmes);
      setSugestoes(b.filmes);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const plataformas = useMemo(() => {
    const set = new Set<string>();
    paraAssistir.forEach((f) => {
      if (f.plataforma) set.add(f.plataforma);
    });
    return Array.from(set).sort();
  }, [paraAssistir]);

  const paraAssistirFiltrados = useMemo(() => {
    return paraAssistir.filter((f) => {
      // Filtro por gênero
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

      // Filtro por plataforma
      if (plataformasEscolhidas.length > 0) {
        if (!plataformasEscolhidas.includes(f.plataforma)) {
          return false;
        }
      }

      return true;
    });
  }, [paraAssistir, generosEscolhidos, plataformasEscolhidas]);

  async function gerarSugestoes() {
    setGerando(true);
    setAvisoIA(null);
    try {
      const { sugestoes: novas } = await api.gerarSugestoes();
      setSugestoes((s) => [...novas, ...s]);
      setAvisoIA(`${novas.length} sugestão(ões) nova(s) da IA! Dá uma olhada abaixo.`);
    } catch (e) {
      setAvisoIA(e instanceof Error ? e.message : "Erro ao gerar sugestões.");
    } finally {
      setGerando(false);
    }
  }

  async function aprovar(id: string) {
    await api.atualizarFilme(id, { status: "para_assistir" });
    setSugestoes((s) => s.filter((f) => f.id !== id));
    carregar();
  }

  async function rejeitar(id: string) {
    await api.removerFilme(id);
    setSugestoes((s) => s.filter((f) => f.id !== id));
  }

  async function remover(id: string) {
    if (!confirm("Remover este título da lista?")) return;
    await api.removerFilme(id);
    setParaAssistir((f) => f.filter((x) => x.id !== id));
  }

  return (
    <AppShell>
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              ✨ Sugestões da IA
            </h2>
            <p className="text-sm text-muted">
              Cruza as notas e os perfis de vocês dois para sugerir o próximo título.
            </p>
          </div>
          <button
            onClick={gerarSugestoes}
            disabled={gerando}
            className="rounded-app px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {gerando ? "Pensando..." : "Gerar sugestões"}
          </button>
        </div>

        {avisoIA && <p className="mb-3 text-sm text-muted">{avisoIA}</p>}

        {sugestoes.length === 0 ? (
          <p className="rounded-app border border-dashed border-border p-6 text-center text-sm text-muted">
            Nenhuma sugestão pendente. Clique em &quot;Gerar sugestões&quot;.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {sugestoes.map((f) => (
              <FilmeCard
                key={f.id}
                filme={f}
                rodape={
                  <div className="flex gap-2">
                    <button
                      onClick={() => aprovar(f.id)}
                      className="flex-1 rounded-app py-1.5 text-xs font-medium text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => rejeitar(f.id)}
                      className="flex-1 rounded-app border border-border py-1.5 text-xs text-muted hover:text-red-500"
                    >
                      Rejeitar
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Para assistir</h2>
            <p className="text-sm text-muted">{paraAssistir.length} títulos na fila</p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="rounded-app border border-border px-4 py-2 text-sm font-medium hover:border-[var(--accent)]"
          >
            + Adicionar
          </button>
        </div>

        <div className="mb-5 flex flex-col gap-3">
          <FiltroPlataforma
            plataformas={plataformas}
            selecionadas={plataformasEscolhidas}
            onChange={setPlataformasEscolhidas}
          />
          <FiltrosGenero
            generosEscolhidos={generosEscolhidos}
            onChange={setGenerosEscolhidos}
          />
        </div>

        {erro && <p className="mb-4 text-sm text-red-500">{erro}</p>}
        {carregando && <p className="text-sm text-muted">Carregando...</p>}

        {!carregando && paraAssistir.length === 0 && (
          <p className="rounded-app border border-dashed border-border p-8 text-center text-sm text-muted">
            Nada na fila ainda.
          </p>
        )}

        {!carregando && paraAssistir.length > 0 && paraAssistirFiltrados.length === 0 && (
          <p className="rounded-app border border-dashed border-border p-8 text-center text-sm text-muted">
            Nenhum título corresponde ao filtro de gênero selecionado.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {paraAssistirFiltrados.map((f) => (
            <div
              key={f.id}
              onClick={() => setFilmeDetail(f)}
              className="cursor-pointer"
            >
              <FilmeCard
                filme={f}
                rodape={
                  <div className="flex items-center justify-between gap-2">
                    <MarcarAssistidoForm
                      filmeId={f.id}
                      onConcluido={carregar}
                      plataformaAtual={f.plataforma}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remover(f.id);
                      }}
                      className="-m-2 p-2 text-xs text-muted active:text-red-500"
                    >
                      Remover
                    </button>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </section>

      <FilmeFormModal
        aberto={modalAberto}
        onClose={() => setModalAberto(false)}
        onCriado={carregar}
        status="para_assistir"
      />

      <FilmeDetailModal
        filme={filmeDetail}
        aberto={!!filmeDetail}
        onClose={() => setFilmeDetail(null)}
        onAtualizado={carregar}
      />
    </AppShell>
  );
}
