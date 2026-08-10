/**
 * Busca de pôsteres no TMDB (themoviedb.org).
 *
 * A imagem NÃO vem da IA de propósito: modelo de linguagem inventa URL, e um
 * link inventado vira card quebrado. O TMDB devolve o pôster oficial da obra.
 *
 * Sem TMDB_API_KEY configurada tudo aqui devolve null e o resto do app segue
 * funcionando normalmente — o pôster só deixa de ser preenchido sozinho.
 */

const BASE = "https://api.themoviedb.org/3";
const IMAGEM = "https://image.tmdb.org/t/p/w500";

interface ResultadoTMDB {
  poster_path: string | null;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
}

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

function anoDoResultado(r: ResultadoTMDB): number | null {
  const data = r.release_date || r.first_air_date;
  if (!data) return null;
  const ano = Number(data.slice(0, 4));
  return Number.isFinite(ano) ? ano : null;
}

/**
 * A API aceita a chave v3 na query string ou o token v4 no header. Aceitamos as
 * duas porque é fácil pegar a errada no painel do TMDB.
 */
function montarRequisicao(chave: string, caminho: string, params: URLSearchParams) {
  const ehTokenV4 = chave.startsWith("eyJ");
  if (!ehTokenV4) params.set("api_key", chave);

  return {
    url: `${BASE}${caminho}?${params.toString()}`,
    init: ehTokenV4
      ? { headers: { Authorization: `Bearer ${chave}` } }
      : undefined,
  };
}

/** Escolhe o resultado que melhor casa com o título e o ano informados. */
function melhorResultado(
  resultados: ResultadoTMDB[],
  titulo: string,
  ano?: number | null
): ResultadoTMDB | null {
  const comPoster = resultados.filter((r) => r.poster_path);
  if (comPoster.length === 0) return null;

  const alvo = normalizar(titulo);

  const pontuar = (r: ResultadoTMDB) => {
    const nome = normalizar(r.title || r.name || "");
    let pontos = 0;

    if (nome === alvo) pontos += 100;
    else if (nome.includes(alvo) || alvo.includes(nome)) pontos += 50;

    if (ano) {
      const anoResultado = anoDoResultado(r);
      if (anoResultado === ano) pontos += 40;
      else if (anoResultado && Math.abs(anoResultado - ano) === 1) pontos += 15;
    }

    // Desempate: o TMDB já ordena por relevância, popularidade só refina.
    pontos += Math.min(r.popularity ?? 0, 100) / 100;
    return pontos;
  };

  return comPoster.reduce((a, b) => (pontuar(b) > pontuar(a) ? b : a));
}

/** URL do pôster do título, ou null se não configurado / não encontrado. */
export async function buscarPoster(
  titulo: string,
  ano?: number | null
): Promise<string | null> {
  const chave = process.env.TMDB_API_KEY;
  if (!chave || !titulo.trim()) return null;

  try {
    const params = new URLSearchParams({
      query: titulo,
      language: "pt-BR",
      include_adult: "false",
    });
    const { url, init } = montarRequisicao(chave, "/search/multi", params);

    const res = await fetch(url, init);
    if (!res.ok) {
      console.error(`TMDB respondeu ${res.status} para "${titulo}"`);
      return null;
    }

    const { results } = (await res.json()) as { results?: ResultadoTMDB[] };
    if (!Array.isArray(results) || results.length === 0) return null;

    const escolhido = melhorResultado(results, titulo, ano);
    return escolhido?.poster_path ? `${IMAGEM}${escolhido.poster_path}` : null;
  } catch (e) {
    console.error(`Erro ao buscar pôster de "${titulo}":`, e);
    return null;
  }
}

/**
 * Busca vários pôsteres de uma vez. O TMDB aguenta bem chamadas em paralelo,
 * então aqui não tem o problema de limite que existe com a IA.
 */
export function buscarPosters(
  filmes: { titulo: string; ano?: number | null }[]
): Promise<(string | null)[]> {
  return Promise.all(filmes.map((f) => buscarPoster(f.titulo, f.ano)));
}
