import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from("projetos")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ projeto: data });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("projetos")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ projeto: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from("projetos")
    .delete()
    .eq("id", params.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
