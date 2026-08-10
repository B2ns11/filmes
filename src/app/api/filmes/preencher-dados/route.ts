import { preencherDadosFilme } from "@/lib/gemini";
import { buscarDadosTMDB } from "@/lib/tmdb";

export async function POST(req: Request) {
  const { titulo } = await req.json();

  if (!titulo?.trim()) {
    return Response.json({ error: "Título obrigatório" }, { status: 400 });
  }

  try {
    const dados = await preencherDadosFilme(titulo);
    // Pôster e "onde assistir" vêm do TMDB. A IA só devolve link quando lembra
    // a URL exata, então sem isso o campo ficava vazio na maioria das vezes.
    const tmdb = await buscarDadosTMDB(titulo, dados.ano);

    return Response.json(
      {
        dados: {
          ...dados,
          // Link direto da IA quando existe; senão a página do TMDB.
          link_streaming: dados.link_streaming || tmdb.link || "",
          plataforma: dados.plataforma || tmdb.plataformas[0] || "",
          banner_url: tmdb.poster,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Erro ao preencher dados com IA" },
      { status: 500 }
    );
  }
}
