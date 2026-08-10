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
  id?: number;
  media_type?: string;
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

export interface DadosTMDB {
  /** URL do pôster, ou null se não achou. */
  poster: string | null;
  /** Página "onde assistir" no Brasil. Existe quando o título está em catálogo. */
  link: string | null;
  /** Serviços onde está disponível no Brasil, por assinatura. */
  plataformas: string[];
}

const VAZIO: DadosTMDB = { poster: null, link: null, plataformas: [] };

interface ProvedoresBR {
  link?: string;
  flatrate?: { provider_name?: string }[];
}

/**
 * Onde assistir no Brasil, direto do catálogo do TMDB/JustWatch.
 *
 * Isso existe porque pedir a URL para a IA não funciona bem: ela só devolve
 * link quando lembra a URL exata, e o prompt (com razão) proíbe inventar. Aqui
 * o link é dado real — a contrapartida é que ele leva para a página "onde
 * assistir" e não para o deep link dentro da Max/Netflix.
 */
async function buscarProvedores(
  chave: string,
  tipo: string,
  id: number
): Promise<{ link: string | null; plataformas: string[] }> {
  try {
    const { url, init } = montarRequisicao(
      chave,
      `/${tipo}/${id}/watch/providers`,
      new URLSearchParams()
    );
    const res = await fetch(url, init);
    if (!res.ok) return { link: null, plataformas: [] };

    const { results } = (await res.json()) as { results?: Record<string, ProvedoresBR> };
    const br = results?.BR;
    if (!br) return { link: null, plataformas: [] };

    return {
      link: br.link || null,
      plataformas: (br.flatrate ?? [])
        .map((p) => p.provider_name)
        .filter((n): n is string => typeof n === "string" && n.length > 0),
    };
  } catch {
    return { link: null, plataformas: [] };
  }
}

/** Pôster, link de "onde assistir" e plataformas do título no Brasil. */
export async function buscarDadosTMDB(
  titulo: string,
  ano?: number | null
): Promise<DadosTMDB> {
  const chave = process.env.TMDB_API_KEY;
  if (!chave || !titulo.trim()) return VAZIO;

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
      return VAZIO;
    }

    const { results } = (await res.json()) as { results?: ResultadoTMDB[] };
    if (!Array.isArray(results) || results.length === 0) return VAZIO;

    const escolhido = melhorResultado(results, titulo, ano);
    if (!escolhido) return VAZIO;

    const poster = escolhido.poster_path ? `${IMAGEM}${escolhido.poster_path}` : null;

    // watch/providers só existe para filme e série, não para pessoa.
    const tipo = escolhido.media_type === "tv" ? "tv" : "movie";
    if (!escolhido.id || (escolhido.media_type && escolhido.media_type === "person")) {
      return { poster, link: null, plataformas: [] };
    }

    const { link, plataformas } = await buscarProvedores(chave, tipo, escolhido.id);
    return { poster, link, plataformas };
  } catch (e) {
    console.error(`Erro ao buscar "${titulo}" no TMDB:`, e);
    return VAZIO;
  }
}

/** Versão em lote. O TMDB aguenta bem chamadas em paralelo. */
export function buscarVariosTMDB(
  filmes: { titulo: string; ano?: number | null }[]
): Promise<DadosTMDB[]> {
  return Promise.all(filmes.map((f) => buscarDadosTMDB(f.titulo, f.ano)));
}

/** Só o pôster. Usado pelo script de backfill (`npm run posters`). */
export async function buscarPoster(
  titulo: string,
  ano?: number | null
): Promise<string | null> {
  return (await buscarDadosTMDB(titulo, ano)).poster;
}
