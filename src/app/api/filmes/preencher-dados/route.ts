import { preencherDadosFilme } from "@/lib/gemini";
import { buscarPoster } from "@/lib/tmdb";

export async function POST(req: Request) {
  const { titulo } = await req.json();

  if (!titulo?.trim()) {
    return Response.json({ error: "Título obrigatório" }, { status: 400 });
  }

  try {
    const dados = await preencherDadosFilme(titulo);
    // O pôster vem do TMDB, não da IA — modelo de linguagem inventa URL.
    const banner_url = await buscarPoster(titulo, dados.ano);

    return Response.json({ dados: { ...dados, banner_url } }, { status: 200 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Erro ao preencher dados com IA" },
      { status: 500 }
    );
  }
}
