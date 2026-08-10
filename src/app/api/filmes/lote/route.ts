import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { preencherDadosVariosFilmes, CotaDiariaEsgotada } from "@/lib/gemini";
import { buscarVariosTMDB } from "@/lib/tmdb";
import type { Prioridade } from "@/lib/types";

function ehPrioridade(v: unknown): v is Prioridade {
  return v === "obrigatorio" || v === "recomendado" || v === "pular";
}

export const maxDuration = 60;

/** Teto por requisição: o cliente manda o print em blocos deste tamanho. */
export const MAX_POR_BLOCO = 5;

/**
 * Segunda etapa do lote: recebe um bloco de títulos, preenche todos numa
 * ÚNICA chamada à IA e insere.
 *
 * Uma chamada por bloco (em vez de uma ou duas por filme) é o que mantém o
 * total abaixo do limite por minuto do Gemini — era isso que fazia os últimos
 * filmes de um print grande entrarem sem dado nenhum.
 */
export async function POST(req: NextRequest) {
  try {
    const { filmes, projetoId } = await req.json();

    if (!Array.isArray(filmes) || filmes.length === 0) {
      return NextResponse.json({ error: "Nenhum filme recebido." }, { status: 400 });
    }
    if (filmes.length > MAX_POR_BLOCO) {
      return NextResponse.json(
        { error: `Envie no máximo ${MAX_POR_BLOCO} filmes por vez.` },
        { status: 400 }
      );
    }

    const limpos = filmes
      .filter(
        (f: unknown): f is { titulo: string; prioridade?: unknown } =>
          typeof f === "object" &&
          f !== null &&
          typeof (f as { titulo?: unknown }).titulo === "string" &&
          (f as { titulo: string }).titulo.trim().length > 0
      )
      .map((f) => ({
        titulo: f.titulo.trim(),
        prioridade: ehPrioridade(f.prioridade) ? f.prioridade : null,
      }));

    if (limpos.length === 0) {
      return NextResponse.json({ error: "Nenhum título válido." }, { status: 400 });
    }

    // Se a IA falhar no bloco, os filmes ainda entram só com o título em vez de
    // sumirem do lote — MENOS quando a cota do dia acabou: aí nenhum bloco
    // seguinte teria dados, e insistir só encheria o projeto de filme vazio.
    let dados: Awaited<ReturnType<typeof preencherDadosVariosFilmes>>;
    try {
      dados = await preencherDadosVariosFilmes(limpos.map((f) => f.titulo));
    } catch (e) {
      if (e instanceof CotaDiariaEsgotada) {
        return NextResponse.json(
          { error: e.message, cotaEsgotada: true },
          { status: 429 }
        );
      }
      console.error("Falha ao preencher bloco:", e);
      dados = limpos.map(() => null);
    }

    // Pôster e link vêm do TMDB (não da IA) e são buscados todos em paralelo.
    const tmdb = await buscarVariosTMDB(
      limpos.map((f, i) => ({ titulo: f.titulo, ano: dados[i]?.ano ?? null }))
    );

    const linhas = limpos.map((f, i) => ({
      titulo: f.titulo,
      categoria: "Filme",
      genero: dados[i]?.genero || "",
      plataforma: dados[i]?.plataforma || tmdb[i].plataformas[0] || "",
      status: "para_assistir",
      origem: "ia",
      projeto_id: projetoId || null,
      sinopse: dados[i]?.sinopse || null,
      ano: dados[i]?.ano ?? null,
      fase: dados[i]?.fase || null,
      // Link direto da IA quando ela tem; senão a página "onde assistir" do
      // TMDB, que é dado real e sempre existe se o título está em catálogo.
      link_streaming: dados[i]?.link_streaming || tmdb[i].link,
      banner_url: tmdb[i].poster,
      prioridade: f.prioridade,
    }));

    const { data, error } = await supabaseAdmin().from("filmes").insert(linhas).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      filmes: data,
      semDados: limpos.filter((_, i) => !dados[i]).map((f) => f.titulo),
      semPoster: limpos.filter((_, i) => !tmdb[i].poster).map((f) => f.titulo),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
