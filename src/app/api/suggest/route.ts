import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { gerarSugestoes } from "@/lib/gemini";
import type { Filme, Perfil } from "@/lib/types";

export const maxDuration = 60;

export async function POST() {
  try {
    const db = supabaseAdmin();

    const [
      { data: assistidos, error: e1 },
      { data: todos, error: e2 },
      { data: perfis, error: e3 },
    ] = await Promise.all([
      db.from("filmes").select("*").eq("status", "assistido"),
      db.from("filmes").select("titulo"),
      db.from("perfis").select("*"),
    ]);

    if (e1 || e2 || e3) {
      return NextResponse.json(
        { error: e1?.message || e2?.message || e3?.message },
        { status: 500 }
      );
    }

    if (!assistidos || assistidos.length === 0) {
      return NextResponse.json(
        { error: "Ainda não há filmes/séries assistidos avaliados para a IA usar como base." },
        { status: 400 }
      );
    }

    const jaNaLista = (todos || []).map((f) => (f as { titulo: string }).titulo);
    const sugestoes = await gerarSugestoes(
      assistidos as Filme[],
      jaNaLista,
      (perfis || []) as Perfil[]
    );

    if (sugestoes.length === 0) {
      return NextResponse.json(
        { error: "A IA não retornou nenhuma sugestão nova. Tente novamente em instantes." },
        { status: 502 }
      );
    }

    const rows = sugestoes.map((s) => ({
      titulo: s.titulo,
      categoria: s.categoria,
      genero: s.genero,
      plataforma: "",
      status: "sugestao_ia" as const,
      origem: "ia" as const,
      motivo_ia: s.motivo,
    }));

    const { data: criados, error: insertError } = await db
      .from("filmes")
      .insert(rows)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ sugestoes: criados });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao gerar sugestões.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
