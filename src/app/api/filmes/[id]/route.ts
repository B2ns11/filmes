import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const CAMPOS_PERMITIDOS = [
  "titulo",
  "categoria",
  "genero",
  "plataforma",
  "status",
  "indicado_por",
  "motivo_ia",
  "nota_brunno",
  "nota_paloma",
  "sinopse",
  "ano",
  "link_streaming",
  "banner_url",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = supabaseAdmin();

    const update: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
    for (const campo of CAMPOS_PERMITIDOS) {
      if (campo in body) update[campo] = body[campo];
    }

    const { data, error } = await db
      .from("filmes")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ filme: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = supabaseAdmin();
    const { error } = await db.from("filmes").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
