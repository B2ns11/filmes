import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Filme, Perfil, Prioridade } from "./types";
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

/** Erro de cota diária esgotada — esperar não resolve, só o dia seguinte. */
export class CotaDiariaEsgotada extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "CotaDiariaEsgotada";
  }
}

/**
 * Aceita várias chaves separadas por vírgula em GEMINI_API_KEY.
 *
 * A cota gratuita do Gemini é por PROJETO do Google Cloud, não por chave — o
 * erro 429 diz `PerDayPerProjectPerModel`. Então só adianta listar chaves de
 * projetos diferentes; duas do mesmo projeto dividem a mesma cota.
 */
function chavesGemini(): string[] {
  const bruto = process.env.GEMINI_API_KEY || "";
  return [...new Set(bruto.split(",").map((c) => c.trim()).filter(Boolean))];
}

type TipoLimite = "dia" | "minuto" | null;

/** O quotaId que o Google devolve no 429 diz qual cota estourou. */
function tipoDeLimite(e: unknown): TipoLimite {
  const msg = e instanceof Error ? e.message : String(e);
  const ehLimite =
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.toLowerCase().includes("rate limit") ||
    msg.toLowerCase().includes("quota");

  if (!ehLimite) return null;
  return /per\s*day|PerDay|RequestsPerDay/i.test(msg) ? "dia" : "minuto";
}

/**
 * Chaves que já bateram a cota diária, com o horário até quando ignorá-las.
 *
 * É memória de processo: some quando a função serverless esfria, e aí a chave é
 * testada de novo. O custo disso é uma chamada que falha rápido, então não vale
 * a complexidade de persistir em banco.
 */
const esgotadasAte = new Map<string, number>();
const SEIS_HORAS = 6 * 60 * 60 * 1000;

type Conteudo = Parameters<
  ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]
>[0];

/**
 * Faz a chamada ao Gemini pedindo JSON de volta, com duas defesas:
 *
 * - cota por MINUTO estourada → espera e tenta de novo na mesma chave;
 * - cota por DIA estourada → marca a chave e passa para a próxima da lista,
 *   porque nesse caso repetir não adianta.
 */
async function gerarJSON(conteudo: Conteudo): Promise<string> {
  const chaves = chavesGemini();
  if (chaves.length === 0) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Adicione a chave gratuita do Google AI Studio nas variáveis de ambiente."
    );
  }

  const agora = Date.now();
  const livres = chaves.filter((c) => (esgotadasAte.get(c) ?? 0) < agora);
  // Se todas estão marcadas, tenta todas mesmo assim: a marcação é um palpite
  // e a cota pode ter virado o dia.
  const aTentar = livres.length > 0 ? livres : chaves;

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  let ultimoErro: unknown;

  for (const chave of aTentar) {
    const model = new GoogleGenerativeAI(chave).getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json" },
    });

    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        const resultado = await model.generateContent(conteudo);
        return resultado.response.text();
      } catch (e) {
        ultimoErro = e;
        const limite = tipoDeLimite(e);

        if (limite === "dia") {
          esgotadasAte.set(chave, Date.now() + SEIS_HORAS);
          break; // próxima chave
        }
        if (limite === "minuto" && tentativa < 2) {
          await espera(2000 * 2 ** tentativa); // 2s, 4s
          continue;
        }
        if (limite === "minuto") break; // próxima chave
        throw e; // não é cota: trocar de chave não resolveria
      }
    }
  }

  if (tipoDeLimite(ultimoErro) === "dia") {
    throw new CotaDiariaEsgotada(
      chaves.length > 1
        ? `As ${chaves.length} chaves do Gemini bateram a cota diária. Tente amanhã ou adicione outra chave (de um projeto diferente do Google Cloud) em GEMINI_API_KEY.`
        : "A cota diária gratuita do Gemini acabou. Tente amanhã, troque o GEMINI_MODEL por um de cota maior, ou adicione uma segunda chave separada por vírgula em GEMINI_API_KEY."
    );
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
  if (titulos.length === 0) return [];

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

  const parsed = extrairJSON(await gerarJSON(prompt), "lista");

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
    const parsed = extrairJSON(await gerarJSON(prompt), "objeto") as {
      link?: unknown;
    } | null;
    return typeof parsed?.link === "string" && parsed.link ? parsed.link : undefined;
  } catch {
    // Busca de reforço: se falhar, o filme fica sem link e segue a vida.
    return undefined;
  }
}

export interface FilmeDoPrint {
  titulo: string;
  prioridade: Prioridade | null;
}

function ehPrioridade(v: unknown): v is Prioridade {
  return v === "obrigatorio" || v === "recomendado" || v === "pular";
}

/**
 * Reforço para o que o modelo não limpar sozinho: numeração da lista no começo
 * ("30. "), bolinha colorida solta, e o ano entre parênteses no fim. Título sujo
 * atrapalha tanto a busca do pôster no TMDB quanto o preenchimento pela IA.
 */
function limparTitulo(bruto: string): string {
  return bruto
    .trim()
    // Bolinhas/quadrados coloridos que tenham vindo junto.
    .replace(/^[\u{1F534}-\u{1F7EB}\u{25A0}-\u{25FF}\u{2B00}-\u{2BFF}]+\s*/u, "")
    // "30. ", "30) ", "30 - " — exige separador para não comer "12 Homens...".
    .replace(/^\d{1,3}\s*[.)\-–—]\s*/, "")
    // "(2016)" no fim.
    .replace(/\s*\((?:19|20)\d{2}\)\s*$/, "")
    .trim();
}

/**
 * Lê um print/foto e devolve os filmes que aparecem nele, com a prioridade do
 * farol quando o item tem bolinha colorida antes do título.
 * A imagem vem como Data URL (data:image/png;base64,...) do input de arquivo.
 */
export async function extrairTitulosDaImagem(
  imagemDataUrl: string
): Promise<FilmeDoPrint[]> {
  const match = imagemDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Imagem inválida. Envie um print em PNG, JPG ou WEBP.");
  }
  const [, mimeType, base64] = match;

  const prompt = `Esta imagem é um print com uma lista de filmes e/ou séries (pode ser uma lista de texto, cartazes, capas, prints de app de streaming, cronogramas, etc).

Identifique TODOS os filmes e séries que aparecem na imagem.

Regras para o TÍTULO:
- Devolva o título oficial em português do Brasil quando existir; senão, o título original.
- REMOVA a numeração da lista do começo do título. "30. Guardiões da Galáxia Vol. 3" vira "Guardiões da Galáxia Vol. 3".
- REMOVA o ano entre parênteses do fim do título. "X-Men: Apocalipse (2016)" vira "X-Men: Apocalipse".
- Se reconhecer um cartaz/capa pela arte, use o título da obra mesmo que o texto esteja cortado ou ilegível.
- Não invente títulos que não estão na imagem.
- Não repita o mesmo título duas vezes.
- Ignore textos que não sejam títulos (datas soltas, nomes de plataformas, categorias, números de fase, legendas).

Regras para a PRIORIDADE (sistema de farol):
Alguns itens têm uma bolinha colorida ANTES do título. Traduza a cor assim:
- bolinha VERMELHA 🔴 → "obrigatorio"
- bolinha AMARELA ou LARANJA 🟡 → "recomendado"
- bolinha VERDE 🟢 → "pular"
Se o item não tiver bolinha colorida, ou se a cor não for nenhuma dessas, use null.
Olhe a cor com atenção item por item — a prioridade varia entre os itens da mesma lista.

Responda APENAS com um JSON válido, sem nenhum texto antes ou depois:
{
  "filmes": [
    { "titulo": "string", "prioridade": "obrigatorio" | "recomendado" | "pular" | null }
  ]
}`;

  const texto = await gerarJSON([
    { inlineData: { mimeType, data: base64 } },
    { text: prompt },
  ]);

  const parsed = extrairJSON(texto, "objeto");
  if (typeof parsed !== "object" || parsed === null) return [];
  const { filmes } = parsed as { filmes?: unknown };
  if (!Array.isArray(filmes)) return [];

  const vistos = new Set<string>();
  const saida: FilmeDoPrint[] = [];

  for (const item of filmes) {
    if (typeof item !== "object" || item === null) continue;
    const { titulo, prioridade } = item as Record<string, unknown>;
    if (typeof titulo !== "string" || !titulo.trim()) continue;

    const limpo = limparTitulo(titulo);
    const chave = limpo.toLowerCase();
    if (!limpo || vistos.has(chave)) continue;
    vistos.add(chave);

    saida.push({
      titulo: limpo,
      prioridade: ehPrioridade(prioridade) ? prioridade : null,
    });
  }

  return saida;
}

export async function preencherDadosFilme(titulo: string): Promise<DadosFilmeIA> {
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

  const parsed = extrairJSON(await gerarJSON(prompt), "objeto");

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
  const prompt = buildPrompt(assistidos, jaNaLista, perfis);
  const parsed = extrairJSON(await gerarJSON(prompt), "lista");

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
