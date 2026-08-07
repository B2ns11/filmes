import { preencherDadosFilme } from "@/lib/gemini";

export async function POST(req: Request) {
  const { titulo } = await req.json();

  if (!titulo?.trim()) {
    return Response.json({ error: "Título obrigatório" }, { status: 400 });
  }

  try {
    const dados = await preencherDadosFilme(titulo);
    return Response.json({ dados }, { status: 200 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Erro ao preencher dados com IA" },
      { status: 500 }
    );
  }
}
