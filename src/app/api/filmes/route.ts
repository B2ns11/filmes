import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const projetoId = req.nextUrl.searchParams.get("projetoId");
    const db = supabaseAdmin();

    let query = db.from("filmes").select("*").order("criado_em", { ascending: false });
    if (status) {
      query = query.eq("status", status);
    }
    if (projetoId) {
      query = query.eq("projeto_id", projetoId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ filmes: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.titulo || typeof body.titulo !== "string") {
      return NextResponse.json({ error: "Título é obrigatório." }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data, error } = await db
      .from("filmes")
      .insert({
        titulo: body.titulo.trim(),
        categoria: body.categoria || "Filme",
        genero: body.genero || "",
        plataforma: body.plataforma || "",
        status: body.status || "para_assistir",
        origem: body.origem || "usuario",
        indicado_por: body.indicado_por || null,
        nota_brunno: body.nota_brunno ?? null,
        nota_paloma: body.nota_paloma ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ filme: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
