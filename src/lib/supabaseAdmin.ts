import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient<any, "public", any> | null = null;

export function supabaseAdmin(): SupabaseClient<any, "public", any> {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configurados (arquivo .env.local ou nas variáveis de ambiente do Vercel)."
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return client;
}
