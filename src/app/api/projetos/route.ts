import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("projetos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ projetos: data || [] });
}

export async function POST(req: Request) {
  const { nome, descricao, emoji, tema } = await req.json();

  if (!nome?.trim()) {
    return Response.json({ error: "Nome obrigatório" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projetos")
    .insert({
      nome,
      descricao: descricao || null,
      emoji: emoji || "🎬",
      tema: tema || null,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ projeto: data }, { status: 201 });
}
