/**
 * Preenche o pôster dos filmes que já estão no banco sem `banner_url`.
 *
 * Os filmes importados antes do TMDB entrar (a planilha original, tudo que foi
 * adicionado pela tela "Assistir") não têm capa. Sem rodar isso, as listas
 * ficam com o ícone 🎬 no lugar do pôster para sempre.
 *
 * Uso: npm run posters
 * Pode rodar quantas vezes quiser — só mexe em quem está sem pôster.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { buscarPoster } from "../src/lib/tmdb";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local."
  );
  process.exit(1);
}
if (!process.env.TMDB_API_KEY) {
  console.error(
    "Falta TMDB_API_KEY no .env.local. É a chave do themoviedb.org que busca os pôsteres."
  );
  process.exit(1);
}

const db = createClient(url, key);

async function main() {
  const { data: filmes, error } = await db
    .from("filmes")
    .select("id, titulo, ano")
    .is("banner_url", null);

  if (error) {
    console.error("Erro ao buscar filmes:", error.message);
    process.exit(1);
  }
  if (!filmes || filmes.length === 0) {
    console.log("Nenhum filme sem pôster. Nada a fazer.");
    return;
  }

  console.log(`${filmes.length} filme(s) sem pôster. Buscando no TMDB...\n`);

  let encontrados = 0;
  const semPoster: string[] = [];

  // Em série de propósito: é um script que roda uma vez, e assim dá pra
  // acompanhar item a item e não martelar a API.
  for (const filme of filmes as { id: string; titulo: string; ano: number | null }[]) {
    const poster = await buscarPoster(filme.titulo, filme.ano);

    if (!poster) {
      semPoster.push(filme.titulo);
      console.log(`  —  ${filme.titulo}`);
      continue;
    }

    const { error: updateError } = await db
      .from("filmes")
      .update({ banner_url: poster })
      .eq("id", filme.id);

    if (updateError) {
      console.log(`  ✗  ${filme.titulo} (erro ao salvar: ${updateError.message})`);
      continue;
    }

    encontrados++;
    console.log(`  ✓  ${filme.titulo}`);
  }

  console.log(`\n${encontrados} de ${filmes.length} pôster(es) preenchido(s).`);
  if (semPoster.length > 0) {
    console.log(
      `\nSem pôster no TMDB (dá pra subir a capa à mão pelo app):\n  ${semPoster.join(
        "\n  "
      )}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
