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

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * O tier gratuito do Gemini limita chamadas por minuto e responde 429 quando
 * estoura. Nesse caso vale esperar e tentar de novo em vez de desistir.
 */
async function comRetry<T>(fn: () => Promise<T>, tentativas = 3): Promise<T> {
  let ultimoErro: unknown;

  for (let i = 0; i < tentativas; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimoErro = e;
      const msg = e instanceof Error ? e.message : String(e);
      const limiteEstourado =
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.toLowerCase().includes("rate limit") ||
        msg.toLowerCase().includes("quota");

      if (!limiteEstourado || i === tentativas - 1) throw e;
      await espera(2000 * 2 ** i); // 2s, 4s
    }
  }

  throw ultimoErro;
}

function extrairJSON(texto: string, tipo: "objeto" | "lista"): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    const padrao = tipo === "lista" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
    const bloco = texto.match(padrao);
    if (!bloco) return null;
    try {
      return JSON.parse(bloco[0]);
    } catch {
      return null;
    }
  }
}

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

/**
 * Preenche vários filmes numa ÚNICA chamada à IA.
 *
 * O lote antes fazia uma (às vezes duas) chamadas por filme, o que estourava o
 * limite por minuto no meio do processo e fazia os últimos filmes entrarem
 * vazios. Um bloco de títulos por chamada mantém o total bem abaixo do limite.
 *
 * O retorno tem sempre o mesmo tamanho e ordem de `titulos`; posições que a IA
 * não soube preencher vêm como `null`.
 */
export async function preencherDadosVariosFilmes(
  titulos: string[]
): Promise<(DadosFilmeIA | null)[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Adicione a chave gratuita do Google AI Studio nas variáveis de ambiente."
    );
  }
  if (titulos.length === 0) return [];

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: "application/json" },
  });

  const lista = titulos.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const prompt = `Você é um especialista em filmes e séries. Para CADA título abaixo, retorne as informações pesquisadas.

Títulos:
${lista}

Regras:
- Retorne EXATAMENTE ${titulos.length} objeto(s), na MESMA ORDEM da lista acima.
- Repita o título recebido no campo "titulo" para eu conseguir parear.
- Se o título for ambíguo, escolha a versão mais popular/recente.
- Se não encontrar algum, use "" para textos e null para números, mas mantenha o objeto na lista.

IMPORTANTE - PLATAFORMA E LINK NO BRASIL:
- Diga em qual serviço está disponível NO BRASIL (Netflix, Prime Video, Disney+, Max, Globoplay, etc).
- Inclua o link direto da plataforma brasileira quando tiver certeza:
  Disney+ https://www.disneyplus.com/pt-br/...
  Netflix https://www.netflix.com/title/...
  Prime Video https://www.primevideo.com/dp/...
  Max https://www.max.com/br/...
  Globoplay https://globoplay.globo.com/...
- Se não tiver certeza do link exato, deixe vazio. Nunca invente URL.

Responda APENAS com um JSON válido, sem nenhum texto antes ou depois:
[
  {
    "titulo": "string (o título recebido)",
    "genero": "string (gêneros separados por vírgula)",
    "ano": number ou null,
    "sinopse": "string (2-3 frases em português)",
    "fase": "string (se for franquia: Fase 1, Fase 2... senão vazio)",
    "plataforma": "string ou vazio",
    "link_streaming": "string (URL completa) ou vazio"
  }
]`;

  const result = await comRetry(() => model.generateContent(prompt));
  const parsed = extrairJSON(result.response.text(), "lista");

  if (!Array.isArray(parsed)) return titulos.map(() => null);

  const converter = (item: Record<string, unknown>): DadosFilmeIA => ({
    genero: typeof item.genero === "string" ? item.genero : "",
    ano: typeof item.ano === "number" ? item.ano : null,
    sinopse: typeof item.sinopse === "string" ? item.sinopse : "",
    fase: typeof item.fase === "string" && item.fase ? item.fase : undefined,
    plataforma:
      typeof item.plataforma === "string" && item.plataforma ? item.plataforma : undefined,
    link_streaming:
      typeof item.link_streaming === "string" && item.link_streaming
        ? item.link_streaming
        : undefined,
  });

  const itens = parsed.filter(
    (i): i is Record<string, unknown> => typeof i === "object" && i !== null
  );

  // Caminho feliz: veio na mesma ordem e quantidade que pedimos.
  if (itens.length === titulos.length) {
    return itens.map(converter);
  }

  // Veio torto: pareia pelo título devolvido.
  const porTitulo = new Map<string, Record<string, unknown>>();
  for (const item of itens) {
    if (typeof item.titulo === "string") {
      porTitulo.set(normalizar(item.titulo), item);
    }
  }

  return titulos.map((t) => {
    const item = porTitulo.get(normalizar(t));
    return item ? converter(item) : null;
  });
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

  const result = await comRetry(() =>
    model.generateContent([
      { inlineData: { mimeType, data: base64 } },
      { text: prompt },
    ])
  );

  const parsed = extrairJSON(result.response.text(), "objeto");
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
