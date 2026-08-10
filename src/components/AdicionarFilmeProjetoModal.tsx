"use client";

import { useEffect, useState } from "react";
import type { Filme, Prioridade } from "@/lib/types";
import { PRIORIDADES } from "@/lib/types";

interface FilmeDoPrint {
  titulo: string;
  prioridade: Prioridade | null;
}

/** Precisa bater com MAX_POR_BLOCO em /api/filmes/lote. */
const TAMANHO_BLOCO = 5;

interface AdicionarFilmeProjetoModalProps {
  projetoId: string;
  aberto: boolean;
  filmeEditando?: Filme | null;
  onFechar: () => void;
  onAdicionado: () => void;
}

export default function AdicionarFilmeProjetoModal({
  projetoId,
  aberto,
  filmeEditando,
  onFechar,
  onAdicionado,
}: AdicionarFilmeProjetoModalProps) {
  useEffect(() => {
    if (filmeEditando) {
      setTitulo(filmeEditando.titulo);
      setGenero(filmeEditando.genero || "");
      setAno(filmeEditando.ano?.toString() || "");
      setSinopse(filmeEditando.sinopse || "");
      setFase(filmeEditando.fase || "");
      setPrioridade(filmeEditando.prioridade || "");
      setPlataforma(filmeEditando.plataforma || "");
      setLinkStreaming(filmeEditando.link_streaming || "");
      setBannerPreview(filmeEditando.banner_url || "");
    } else if (!aberto) {
      resetForm();
    }
  }, [filmeEditando, aberto]);
  const [titulo, setTitulo] = useState("");
  const [genero, setGenero] = useState("");
  const [ano, setAno] = useState("");
  const [sinopse, setSinopse] = useState("");
  const [fase, setFase] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade | "">("");
  const [plataforma, setPlataforma] = useState("");
  const [linkStreaming, setLinkStreaming] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [preenchendo, setPreenchendo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [printLote, setPrintLote] = useState("");
  const [processandoLote, setProcessandoLote] = useState(false);
  const [progressoLote, setProgressoLote] = useState<string | null>(null);
  const [resumoLote, setResumoLote] = useState<string | null>(null);
  const [erroLote, setErroLote] = useState<string | null>(null);

  async function preencherComIA() {
    if (!titulo.trim()) return;
    setPreenchendo(true);
    try {
      const res = await fetch("/api/filmes/preencher-dados", {
        method: "POST",
        body: JSON.stringify({ titulo }),
      });
      const { dados, error } = await res.json();
      if (error) throw new Error(error);

      setGenero(dados.genero);
      setAno(dados.ano?.toString() || "");
      setSinopse(dados.sinopse);
      setFase(dados.fase || "");
      setPlataforma(dados.plataforma || "");
      setLinkStreaming(dados.link_streaming || "");
      // Pôster oficial do TMDB. Só preenche se ainda não escolheram um à mão.
      if (dados.banner_url && !bannerFile) setBannerPreview(dados.banner_url);
    } catch (e) {
      alert("Erro ao preencher dados com IA. Verifique e preencha manualmente.");
      console.error(e);
    } finally {
      setPreenchendo(false);
    }
  }

  async function salvar() {
    if (!titulo.trim()) return;
    setSalvando(true);
    try {
      const dados = {
        titulo: titulo.trim(),
        genero: genero.trim(),
        ano: ano ? parseInt(ano) : null,
        sinopse: sinopse.trim(),
        fase: fase.trim() || null,
        prioridade: prioridade || null,
        plataforma: plataforma.trim(),
        link_streaming: linkStreaming.trim(),
        banner_url: bannerPreview,
      };

      if (filmeEditando) {
        // Atualizar filme existente
        const res = await fetch(`/api/filmes/${filmeEditando.id}`, {
          method: "PATCH",
          body: JSON.stringify(dados),
        });
        if (!res.ok) throw new Error("Erro ao atualizar");
      } else {
        // Criar novo filme
        const res = await fetch("/api/filmes", {
          method: "POST",
          body: JSON.stringify({
            ...dados,
            status: "para_assistir",
            projeto_id: projetoId,
          }),
        });
        if (!res.ok) throw new Error("Erro ao adicionar");
      }

      resetForm();
      onFechar();
      onAdicionado();
    } catch (e) {
      alert("Erro ao salvar filme");
      console.error(e);
    } finally {
      setSalvando(false);
    }
  }

  function resetForm() {
    setTitulo("");
    setGenero("");
    setAno("");
    setSinopse("");
    setFase("");
    setPrioridade("");
    setPlataforma("");
    setLinkStreaming("");
    setBannerFile(null);
    setBannerPreview("");
    setPrintLote("");
    setProgressoLote(null);
    setResumoLote(null);
    setErroLote(null);
  }

  function handlePrintLoteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumoLote(null);
    setErroLote(null);
    const reader = new FileReader();
    reader.onload = (evt) => setPrintLote(evt.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function adicionarEmLote() {
    if (!printLote) return;
    setProcessandoLote(true);
    setResumoLote(null);
    setErroLote(null);
    setProgressoLote("Lendo o print...");

    try {
      // 1) A IA lê o print e devolve os títulos que ainda não estão no projeto.
      const resTitulos = await fetch("/api/filmes/lote/titulos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagem: printLote, projetoId }),
      });
      const { filmes, repetidos, error } = (await resTitulos.json()) as {
        filmes: FilmeDoPrint[];
        repetidos?: string[];
        error?: string;
      };
      if (!resTitulos.ok) throw new Error(error || "Erro ao ler o print");

      if (filmes.length === 0) {
        setProgressoLote(null);
        setResumoLote(
          repetidos?.length
            ? `Nada novo: ${repetidos.length} filme(s) do print já estão no projeto.`
            : "Nenhum filme novo encontrado no print."
        );
        return;
      }

      const comFarol = filmes.filter((f) => f.prioridade).length;

      // 2) Os filmes vão em blocos pequenos — cada bloco é uma chamada só à
      //    IA, o que evita estourar o limite por minuto no meio do lote.
      const blocos: FilmeDoPrint[][] = [];
      for (let i = 0; i < filmes.length; i += TAMANHO_BLOCO) {
        blocos.push(filmes.slice(i, i + TAMANHO_BLOCO));
      }

      let adicionados = 0;
      let semDados = 0;
      let semPoster = 0;
      const blocosComErro: string[] = [];

      for (const [i, bloco] of blocos.entries()) {
        setProgressoLote(
          `Adicionando ${adicionados + bloco.length} de ${filmes.length} (bloco ${
            i + 1
          }/${blocos.length})...`
        );

        try {
          const res = await fetch("/api/filmes/lote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filmes: bloco, projetoId }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Erro no bloco");

          adicionados += data.filmes.length;
          semDados += data.semDados?.length ?? 0;
          semPoster += data.semPoster?.length ?? 0;
          onAdicionado();
        } catch (e) {
          // Um bloco que falha não derruba os outros.
          console.error(`Falha no bloco ${i + 1}:`, e);
          blocosComErro.push(...bloco.map((f) => f.titulo));
        }
      }

      const partes = [`${adicionados} filme(s) adicionado(s)`];
      if (comFarol) partes.push(`${comFarol} com farol reconhecido`);
      if (repetidos?.length) partes.push(`${repetidos.length} já estava(m) no projeto`);
      if (semDados) partes.push(`${semDados} sem os dados da IA`);
      if (semPoster) partes.push(`${semPoster} sem pôster`);
      if (blocosComErro.length) partes.push(`${blocosComErro.length} falhou(falharam)`);

      setProgressoLote(null);
      setResumoLote(`${partes.join(" · ")}.`);
      setPrintLote("");
    } catch (e) {
      setProgressoLote(null);
      setErroLote(e instanceof Error ? e.message : "Erro ao adicionar em lote");
      console.error(e);
    } finally {
      setProcessandoLote(false);
    }
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setBannerPreview(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="mb-5 text-2xl font-bold">
          {filmeEditando ? "✏️ Editar Filme" : "🎬 Adicionar Filme"}
        </h2>

        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Nome do filme"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />

        <button
          onClick={preencherComIA}
          disabled={!titulo.trim() || preenchendo}
          className="mb-4 w-full rounded-xl bg-[var(--accent)]/20 px-4 py-2.5 text-sm font-semibold text-[var(--accent)] transition-all hover:bg-[var(--accent)]/30 disabled:opacity-50"
        >
          {preenchendo ? "Preenchendo com IA..." : "🤖 Preencher com IA"}
        </button>

        <input
          value={genero}
          onChange={(e) => setGenero(e.target.value)}
          placeholder="Gênero"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />

        <input
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          placeholder="Ano"
          type="number"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />

        <input
          value={fase}
          onChange={(e) => setFase(e.target.value)}
          placeholder="Fase / saga (ex: Fase 5)"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />

        <div className="mb-3">
          <label className="mb-2 block text-xs font-semibold text-muted">
            Farol de importância
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPrioridade("")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                prioridade === ""
                  ? "bg-[var(--accent)] text-white"
                  : "border border-border text-muted hover:text-ink"
              }`}
            >
              Sem farol
            </button>
            {(Object.keys(PRIORIDADES) as Prioridade[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrioridade(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  prioridade === p
                    ? "text-white"
                    : "border border-border text-muted hover:text-ink"
                }`}
                style={prioridade === p ? { background: PRIORIDADES[p].cor } : {}}
              >
                {PRIORIDADES[p].emoji} {PRIORIDADES[p].label}
              </button>
            ))}
          </div>
        </div>

        <input
          value={plataforma}
          onChange={(e) => setPlataforma(e.target.value)}
          placeholder="Plataforma (Netflix, Prime, Disney+, etc)"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />

        <input
          value={linkStreaming}
          onChange={(e) => setLinkStreaming(e.target.value)}
          placeholder="Link de streaming (ex: https://...)"
          className="mb-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
        />

        <textarea
          value={sinopse}
          onChange={(e) => setSinopse(e.target.value)}
          placeholder="Sinopse"
          className="mb-4 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors resize-none"
          rows={3}
        />

        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold text-muted">
            Banner/Poster (opcional)
          </label>
          {bannerPreview && (
            <div className="relative mb-2">
              <img
                src={bannerPreview}
                alt="Preview"
                className="max-h-40 w-full rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setBannerFile(null);
                  setBannerPreview("");
                }}
                className="absolute right-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-xs text-white hover:bg-black/90"
              >
                ✕ Remover
              </button>
            </div>
          )}
          <p className="mb-2 text-xs text-muted">
            O &quot;Preencher com IA&quot; já busca o pôster oficial. Suba um arquivo só
            se quiser trocar.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {!filmeEditando && (
          <div className="mb-4 rounded-xl border border-dashed border-border p-4">
            <p className="text-sm font-semibold">📸 Adicionar em lote</p>
            <p className="mt-1 text-xs text-muted">
              Manda um print com a lista de filmes que a IA identifica todos e adiciona
              já preenchidos, em blocos de {TAMANHO_BLOCO}.
            </p>

            {printLote && (
              <img
                src={printLote}
                alt="Print da lista"
                className="mt-3 max-h-40 w-full rounded-lg object-contain"
              />
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handlePrintLoteChange}
              disabled={processandoLote}
              className="mt-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
            />

            <button
              onClick={adicionarEmLote}
              disabled={!printLote || processandoLote}
              className="mt-3 w-full rounded-xl bg-[var(--accent)]/20 px-4 py-2.5 text-sm font-semibold text-[var(--accent)] transition-all hover:bg-[var(--accent)]/30 disabled:opacity-50"
            >
              {processandoLote ? "Processando..." : "🤖 Adicionar filmes do print"}
            </button>

            {progressoLote && (
              <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-border border-t-[var(--accent)]" />
                {progressoLote}
              </p>
            )}
            {resumoLote && (
              <p className="mt-2 text-xs font-medium" style={{ color: "var(--accent)" }}>
                ✓ {resumoLote}
              </p>
            )}
            {erroLote && <p className="mt-2 text-xs text-red-500">{erroLote}</p>}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onFechar}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-alt"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando || !titulo.trim()}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {salvando ? "Salvando..." : filmeEditando ? "Atualizar" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
