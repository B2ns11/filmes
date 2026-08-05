/**
 * Migra os dados da planilha original (já convertidos para JSON em /data)
 * para o banco Supabase. Rode uma vez, depois de configurar o .env.local
 * e de ter criado as tabelas com supabase/schema.sql.
 *
 * Uso: npm run seed
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import assistidos from "../data/seed-assistidos.json";
import assistir from "../data/seed-assistir.json";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local. Configure antes de rodar o seed."
  );
  process.exit(1);
}

const db = createClient(url, key);

async function main() {
  console.log(`Migrando ${assistidos.length} títulos já assistidos...`);
  const { error: e1 } = await db.from("filmes").insert(assistidos);
  if (e1) throw e1;

  console.log(`Migrando ${assistir.length} títulos da lista "assistir"...`);
  const { error: e2 } = await db.from("filmes").insert(assistir);
  if (e2) throw e2;

  console.log("Pronto! Dados da planilha importados com sucesso.");
}

main().catch((err) => {
  console.error("Erro ao migrar dados:", err.message || err);
  process.exit(1);
});
