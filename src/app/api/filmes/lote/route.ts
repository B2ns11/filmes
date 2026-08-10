import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { preencherDadosVariosFilmes } from "@/lib/gemini";
import { buscarPosters } from "@/lib/tmdb";

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
    const { titulos, projetoId } = await req.json();

    if (!Array.isArray(titulos) || titulos.length === 0) {
      return NextResponse.json({ error: "Nenhum título recebido." }, { status: 400 });
    }
    if (titulos.length > MAX_POR_BLOCO) {
      return NextResponse.json(
        { error: `Envie no máximo ${MAX_POR_BLOCO} títulos por vez.` },
        { status: 400 }
      );
    }

    const limpos = titulos
      .filter((t: unknown): t is string => typeof t === "string" && t.trim().length > 0)
      .map((t: string) => t.trim());

    if (limpos.length === 0) {
      return NextResponse.json({ error: "Nenhum título válido." }, { status: 400 });
    }

    // Se a IA falhar no bloco inteiro, os filmes ainda entram só com o título
    // em vez de sumirem do lote.
    let dados: Awaited<ReturnType<typeof preencherDadosVariosFilmes>>;
    try {
      dados = await preencherDadosVariosFilmes(limpos);
    } catch (e) {
      console.error("Falha ao preencher bloco:", e);
      dados = limpos.map(() => null);
    }

    // Pôsteres vêm do TMDB (não da IA) e podem ser buscados todos em paralelo.
    const posters = await buscarPosters(
      limpos.map((titulo, i) => ({ titulo, ano: dados[i]?.ano ?? null }))
    );

    const linhas = limpos.map((titulo, i) => ({
      titulo,
      categoria: "Filme",
      genero: dados[i]?.genero || "",
      plataforma: dados[i]?.plataforma || "",
      status: "para_assistir",
      origem: "ia",
      projeto_id: projetoId || null,
      sinopse: dados[i]?.sinopse || null,
      ano: dados[i]?.ano ?? null,
      fase: dados[i]?.fase || null,
      link_streaming: dados[i]?.link_streaming || null,
      banner_url: posters[i],
    }));

    const { data, error } = await supabaseAdmin().from("filmes").insert(linhas).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      filmes: data,
      semDados: limpos.filter((_, i) => !dados[i]),
      semPoster: limpos.filter((_, i) => !posters[i]),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
