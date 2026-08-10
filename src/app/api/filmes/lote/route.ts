import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extrairTitulosDaImagem, preencherDadosFilme } from "@/lib/gemini";

// A IA é chamada uma vez pra ler o print e uma vez por filme encontrado.
export const maxDuration = 60;

const LIMITE_FILMES = 20;
const CONCORRENCIA = 4;

/** Roda a tarefa em todos os itens, com no máximo `limite` chamadas simultâneas. */
async function emParalelo<T, R>(
  itens: T[],
  limite: number,
  tarefa: (item: T) => Promise<R>
): Promise<R[]> {
  const resultados: R[] = new Array(itens.length);
  let proximo = 0;

  async function worker() {
    while (proximo < itens.length) {
      const indice = proximo++;
      resultados[indice] = await tarefa(itens[indice]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limite, itens.length) }, () => worker())
  );
  return resultados;
}

export async function POST(req: NextRequest) {
  try {
    const { imagem, projetoId } = await req.json();

    if (!imagem || typeof imagem !== "string") {
      return NextResponse.json({ error: "Envie o print da lista." }, { status: 400 });
    }

    const titulos = await extrairTitulosDaImagem(imagem);
    if (titulos.length === 0) {
      return NextResponse.json(
        { error: "A IA não encontrou nenhum filme nesse print. Tenta uma imagem mais nítida." },
        { status: 422 }
      );
    }

    const db = supabaseAdmin();

    // Não repetir o que já está no projeto (ou na lista geral, se não for de projeto).
    const consultaExistentes = db.from("filmes").select("titulo");
    const { data: existentes } = projetoId
      ? await consultaExistentes.eq("projeto_id", projetoId)
      : await consultaExistentes.is("projeto_id", null);

    const jaTem = new Set(
      (existentes ?? []).map((f: { titulo: string }) => f.titulo.trim().toLowerCase())
    );

    const novos = titulos
      .filter((t) => !jaTem.has(t.toLowerCase()))
      .slice(0, LIMITE_FILMES);

    const ignorados = titulos.filter((t) => jaTem.has(t.toLowerCase()));

    if (novos.length === 0) {
      return NextResponse.json({
        filmes: [],
        titulosEncontrados: titulos,
        ignorados,
        falhas: [],
      });
    }

    // Mesmo preenchimento da adição individual, só que para cada título do print.
    const preenchidos = await emParalelo(novos, CONCORRENCIA, async (titulo) => {
      try {
        const dados = await preencherDadosFilme(titulo);
        return { titulo, dados };
      } catch (e) {
        console.error(`Falha ao preencher "${titulo}":`, e);
        return { titulo, dados: null };
      }
    });

    const falhas = preenchidos.filter((p) => p.dados === null).map((p) => p.titulo);

    const linhas = preenchidos.map(({ titulo, dados }) => ({
      titulo,
      categoria: "Filme",
      genero: dados?.genero || "",
      plataforma: dados?.plataforma || "",
      status: "para_assistir",
      origem: "ia",
      projeto_id: projetoId || null,
      sinopse: dados?.sinopse || null,
      ano: dados?.ano ?? null,
      fase: dados?.fase || null,
      link_streaming: dados?.link_streaming || null,
    }));

    const { data, error } = await db.from("filmes").insert(linhas).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      filmes: data,
      titulosEncontrados: titulos,
      ignorados,
      falhas,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
