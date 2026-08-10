import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Filme, Perfil } from "./types";
import { media } from "./types";

export interface SugestaoIA {
  titulo: string;
  categoria: string;
  genero: string;
  motivo: string;
  plataforma?: string;
  link_streaming?: string;
}

function buildPrompt(
  assistidos: Filme[],
  jaNaLista: string[],
  perfis: Perfil[]
): string {
  const historico = assistidos
    .map((f) => {
      const m = media(f);
      return `- "${f.titulo}" (${f.categoria}, gênero: ${f.genero || "?"}) — nota Brunno: ${
        f.nota_brunno ?? "sem nota"
      }, nota Paloma: ${f.nota_paloma ?? "sem nota"}, média: ${m ?? "sem nota"}`;
    })
    .join("\n");

  const perfisTexto = perfis
    .map((p) => {
      return `${p.nome}:
  - Gêneros favoritos: ${p.generos_favoritos.length ? p.generos_favoritos.join(", ") : "não informado"}
  - Gêneros que evita: ${p.generos_evitar.length ? p.generos_evitar.join(", ") : "não informado"}
  - Outras preferências: ${p.preferencias_extra || "não informado"}`;
    })
    .join("\n\n");

  const evitar = jaNaLista.length
    ? `\nNÃO sugira nenhum destes títulos, pois já estão na lista (assistidos, para assistir ou já sugeridos): ${jaNaLista.join(
        ", "
      )}.`
    : "";

  return `Você é um assistente que recomenda filmes e séries para um casal, Brunno e Paloma.

Perfis de preferência de cada um:
${perfisTexto}

Histórico de avaliações (nota de 0 a 10 que cada um deu para títulos que já assistiram):
${historico || "Nenhum histórico ainda."}

Analise os gêneros/categorias em que as notas de AMBOS costumam ser altas (ex: acima de 8), evite sugerir algo parecido com títulos que os dois avaliaram mal (abaixo de 5), e leve em conta o perfil de preferências de cada um.
${evitar}

Sugira de 3 a 5 filmes, séries ou minisséries REAIS (que existem de verdade) que o casal provavelmente vai gostar, com um motivo curto (1 a 2 frases, em português, citando de forma natural a relação com as notas ou preferências deles) explicando o porquê da sugestão.

Para cada sugestão, tente identificar em qual plataforma o título está disponível (Netflix, Prime Video, Disney+, HBO Max, Globoplay, etc.) e, se souber, inclua um link para assistir. Se não souber ao certo, deixe os campos vazios.

Responda APENAS com um JSON válido, no formato exato abaixo, sem nenhum texto antes ou depois:
[
  { "titulo": "string", "categoria": "Filme | Série | Minissérie | Documentário", "genero": "string", "motivo": "string", "plataforma": "string (ex: Netflix, Prime Video, etc) ou vazio", "link_streaming": "string (URL completa) ou vazio" }
]`;
}

export interface DadosFilmeIA {
  genero: string;
  ano: number | null;
  sinopse: string;
  fase?: string;
  plataforma?: string;
  link_streaming?: string;
}

async function buscarLinkBrasil(
  titulo: string,
  plataforma: string | undefined
): Promise<string | undefined> {
  if (!plataforma) return undefined;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return undefined;

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `Procure o link EXATO e FUNCIONAL para assistir "${titulo}" na plataforma "${plataforma}" NO BRASIL.

Tente encontrar:
- Se é Netflix: link tipo https://www.netflix.com/title/...
- Se é Disney+: link tipo https://www.disneyplus.com/pt-br/video/...
- Se é Prime Video: link tipo https://www.primevideo.com/dp/...
- Se é HBO Max: link tipo https://www.hbomax.com/br/...
- Se é Globoplay: link tipo https://globoplay.globo.com/...

Responda APENAS com JSON válido:
{
  "link": "URL completa funcional ou vazio se não encontrar com certeza"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return parsed.link && typeof parsed.link === "string" ? parsed.link : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Lê um print/foto e devolve os títulos de filmes e séries que aparecem nele.
 * A imagem vem como Data URL (data:image/png;base64,...) do input de arquivo.
 */
export async function extrairTitulosDaImagem(imagemDataUrl: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Adicione a chave gratuita do Google AI Studio nas variáveis de ambiente."
    );
  }

  const match = imagemDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Imagem inválida. Envie um print em PNG, JPG ou WEBP.");
  }
  const [, mimeType, base64] = match;

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `Esta imagem é um print com uma lista de filmes e/ou séries (pode ser uma lista de texto, cartazes, capas, prints de app de streaming, cronogramas, etc).

Identifique TODOS os filmes e séries que aparecem na imagem.

Regras:
- Devolva o título oficial em português do Brasil quando existir; senão, o título original.
- Se reconhecer um cartaz/capa pela arte, use o título da obra mesmo que o texto esteja cortado ou ilegível.
- Não invente títulos que não estão na imagem.
- Não repita o mesmo título duas vezes.
- Ignore textos que não sejam títulos (datas, nomes de plataformas, categorias, números de fase, legendas).

Responda APENAS com um JSON válido, sem nenhum texto antes ou depois:
{
  "titulos": ["Título 1", "Título 2"]
}`;

  const result = await model.generateContent([
    { inlineData: { mimeType, data: base64 } },
    { text: prompt },
  ]);
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const bloco = text.match(/\{[\s\S]*\}/);
    if (!bloco) return [];
    parsed = JSON.parse(bloco[0]);
  }

  if (typeof parsed !== "object" || parsed === null) return [];
  const { titulos } = parsed as { titulos?: unknown };
  if (!Array.isArray(titulos)) return [];

  const vistos = new Set<string>();
  return titulos
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim())
    .filter((t) => {
      const chave = t.toLowerCase();
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
}

export async function preencherDadosFilme(titulo: string): Promise<DadosFilmeIA> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Adicione a chave gratuita do Google AI Studio nas variáveis de ambiente."
    );
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `Você é um especialista em filmes e séries. Pesquise o filme/série "${titulo}" e retorne informações precisas em JSON.

Se o título for ambíguo, escolha a versão mais popular/recente.
Se não encontrar o filme, retorne valores padrão (vazio para strings, null para numbers).

IMPORTANTE - BUSCAR LINKS DO BRASIL:
1. Identifique onde está disponível NO BRASIL (Netflix, Prime Video, Disney+, HBO Max, Globoplay, etc).
2. Procure o link DIRETO para a plataforma brasileira:
   - Disney+ Brasil: https://www.disneyplus.com/pt-br/...
   - Netflix Brasil: https://www.netflix.com/title/...
   - Prime Video Brasil: https://www.primevideo.com/dp/...
   - HBO Max Brasil: https://www.hbomax.com/br/...
   - Globoplay Brasil: https://globoplay.globo.com/...
3. Se encontrar em JustWatch Brasil ou similares, tente retornar o link mais confiável.
4. Se não tiver certeza do link exato, deixe vazio.

Responda APENAS com um JSON válido, sem nenhum texto antes ou depois:
{
  "genero": "string (gêneros separados por vírgula, ex: Ação, Ficção Científica)",
  "ano": "number (ano de lançamento) ou null",
  "sinopse": "string (descrição breve do filme em português, 2-3 frases)",
  "fase": "string (se for franquia tipo MCU: Fase 1, Fase 2, etc. ou vazio se não aplicável)",
  "plataforma": "string (plataforma de streaming no Brasil onde está disponível) ou vazio",
  "link_streaming": "string (URL completa do link direto para assistir NO BRASIL) ou vazio"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return { genero: "", ano: null, sinopse: "" };
    }
    parsed = JSON.parse(match[0]);
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { genero: "", ano: null, sinopse: "" };
  }

  const data = parsed as Record<string, unknown>;
  let link_streaming = typeof data.link_streaming === "string" && data.link_streaming ? data.link_streaming : undefined;
  const plataforma = typeof data.plataforma === "string" && data.plataforma ? data.plataforma : undefined;

  // Se não tiver link mas tiver plataforma, tenta buscar o link específico
  if (!link_streaming && plataforma) {
    link_streaming = await buscarLinkBrasil(titulo, plataforma);
  }

  return {
    genero: typeof data.genero === "string" ? data.genero : "",
    ano: typeof data.ano === "number" ? data.ano : null,
    sinopse: typeof data.sinopse === "string" ? data.sinopse : "",
    fase: typeof data.fase === "string" && data.fase ? data.fase : undefined,
    plataforma,
    link_streaming,
  };
}

export async function gerarSugestoes(
  assistidos: Filme[],
  jaNaLista: string[],
  perfis: Perfil[]
): Promise<SugestaoIA[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Adicione a chave gratuita do Google AI Studio nas variáveis de ambiente."
    );
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = buildPrompt(assistidos, jaNaLista, perfis);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error("A IA não retornou um JSON válido. Tente novamente.");
    }
    parsed = JSON.parse(match[0]);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Formato inesperado na resposta da IA.");
  }

  return parsed
    .filter(
      (item): item is SugestaoIA =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as SugestaoIA).titulo === "string"
    )
    .map((item) => ({
      titulo: item.titulo.trim(),
      categoria: item.categoria || "Filme",
      genero: item.genero || "",
      motivo: item.motivo || "",
      plataforma: item.plataforma?.trim() || undefined,
      link_streaming: item.link_streaming?.trim() || undefined,
    }));
}
