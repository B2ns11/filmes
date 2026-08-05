import type { Filme, Perfil, StatusFilme } from "./types";

async function tratar<T>(res: Response): Promise<T> {
  let data: { error?: string } = {};
  try {
    data = await res.json();
  } catch {
    throw new Error(
      "O servidor não respondeu como esperado. Confira se SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configurados."
    );
  }
  if (!res.ok) {
    throw new Error(data.error || "Erro inesperado.");
  }
  return data as T;
}

export const api = {
  listarFilmes: (status?: StatusFilme) =>
    fetch(`/api/filmes${status ? `?status=${status}` : ""}`).then((r) =>
      tratar<{ filmes: Filme[] }>(r)
    ),

  criarFilme: (payload: Partial<Filme>) =>
    fetch("/api/filmes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => tratar<{ filme: Filme }>(r)),

  atualizarFilme: (id: string, payload: Partial<Filme>) =>
    fetch(`/api/filmes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => tratar<{ filme: Filme }>(r)),

  removerFilme: (id: string) =>
    fetch(`/api/filmes/${id}`, { method: "DELETE" }).then((r) => tratar<{ ok: true }>(r)),

  buscarPerfil: (usuario: string) =>
    fetch(`/api/perfil?usuario=${usuario}`).then((r) => tratar<{ perfil: Perfil }>(r)),

  salvarPerfil: (payload: Partial<Perfil> & { usuario: string }) =>
    fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => tratar<{ perfil: Perfil }>(r)),

  gerarSugestoes: () =>
    fetch("/api/suggest", { method: "POST" }).then((r) => tratar<{ sugestoes: Filme[] }>(r)),
};
