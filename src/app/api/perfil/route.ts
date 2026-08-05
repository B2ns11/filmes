import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Usuario } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const usuario = req.nextUrl.searchParams.get("usuario") as Usuario | null;
    const db = supabaseAdmin();

    if (usuario) {
      const { data, error } = await db
        .from("perfis")
        .select("*")
        .eq("usuario", usuario)
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ perfil: data });
    }

    const { data, error } = await db.from("perfis").select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ perfis: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const usuario = body.usuario as Usuario | undefined;

    if (usuario !== "brunno" && usuario !== "paloma") {
      return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
    }

    const db = supabaseAdmin();
    const update: Record<string, unknown> = { atualizado_em: new Date().toISOString() };

    if (typeof body.nome === "string") update.nome = body.nome;
    if (typeof body.foto_base64 === "string" || body.foto_base64 === null)
      update.foto_base64 = body.foto_base64;
    if (Array.isArray(body.generos_favoritos)) update.generos_favoritos = body.generos_favoritos;
    if (Array.isArray(body.generos_evitar)) update.generos_evitar = body.generos_evitar;
    if (typeof body.preferencias_extra === "string")
      update.preferencias_extra = body.preferencias_extra;

    const { data, error } = await db
      .from("perfis")
      .upsert({ usuario, ...update }, { onConflict: "usuario" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ perfil: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
