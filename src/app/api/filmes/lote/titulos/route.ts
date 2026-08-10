import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extrairTitulosDaImagem } from "@/lib/gemini";

export const maxDuration = 60;

/**
 * Primeira etapa do lote: lê o print e devolve os títulos encontrados.
 *
 * Fica separado da inserção para o cliente conseguir mandar os filmes em
 * blocos pequenos e mostrar o progresso, em vez de segurar tudo numa
 * requisição só.
 */
export async function POST(req: NextRequest) {
  try {
    const { imagem, projetoId } = await req.json();

    if (!imagem || typeof imagem !== "string") {
      return NextResponse.json({ error: "Envie o print da lista." }, { status: 400 });
    }

    const titulos = await extrairTitulosDaImagem(imagem);
    if (titulos.length === 0) {
      return NextResponse.json(
        {
          error:
            "A IA não encontrou nenhum filme nesse print. Tenta uma imagem mais nítida.",
        },
        { status: 422 }
      );
    }

    // Não repetir o que já está no projeto (ou na lista geral, se não for de projeto).
    const consulta = supabaseAdmin().from("filmes").select("titulo");
    const { data: existentes } = projetoId
      ? await consulta.eq("projeto_id", projetoId)
      : await consulta.is("projeto_id", null);

    const jaTem = new Set(
      (existentes ?? []).map((f: { titulo: string }) => f.titulo.trim().toLowerCase())
    );

    return NextResponse.json({
      titulos: titulos.filter((t) => !jaTem.has(t.toLowerCase())),
      repetidos: titulos.filter((t) => jaTem.has(t.toLowerCase())),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
