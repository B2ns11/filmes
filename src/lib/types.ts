export type Usuario = "brunno" | "paloma";

export type StatusFilme = "assistido" | "para_assistir" | "sugestao_ia";
export type OrigemFilme = "usuario" | "ia" | "planilha";
export type TemaProjeto = "mcu" | "hp" | "sw" | "lotr" | null;

export interface Projeto {
  id: string;
  nome: string;
  descricao: string | null;
  emoji: string;
  tema: TemaProjeto;
  criado_em: string;
}

export interface Filme {
  id: string;
  titulo: string;
  categoria: string;
  genero: string;
  plataforma: string;
  link_streaming?: string;
  status: StatusFilme;
  origem: OrigemFilme;
  indicado_por: Usuario | null;
  motivo_ia: string;
  nota_brunno: number | null;
  nota_paloma: number | null;
  projeto_id: string | null;
  banner_url: string | null;
  sinopse: string | null;
  ano: number | null;
  fase: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface CriterioAvaliacao {
  label: string;
  emoji: string;
  notaMinima: number;
  notaMaxima?: number;
}

export interface Perfil {
  usuario: Usuario;
  nome: string;
  foto_base64: string | null;
  generos_favoritos: string[];
  generos_evitar: string[];
  preferencias_extra: string;
  criterios_avaliacao?: CriterioAvaliacao[];
  atualizado_em: string;
}

export function media(f: Pick<Filme, "nota_brunno" | "nota_paloma">): number | null {
  const notas = [f.nota_brunno, f.nota_paloma].filter(
    (n): n is number => typeof n === "number"
  );
  if (notas.length === 0) return null;
  return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 100) / 100;
}

export function avaliacaoBadge(m: number | null): {
  label: string;
  emoji: string;
  tone: "boa" | "ok" | "ruim" | "sem-nota";
} {
  if (m === null) return { label: "Sem nota", emoji: "•", tone: "sem-nota" };
  if (m >= 8) return { label: "Vale cada segundo", emoji: "⏳", tone: "boa" };
  if (m >= 5) return { label: "Dá pro gasto", emoji: "😐", tone: "ok" };
  return { label: "Sai dessa!", emoji: "🚫", tone: "ruim" };
}

export const NOME_USUARIO: Record<Usuario, string> = {
  brunno: "Brunno",
  paloma: "Paloma",
};

export const GENEROS_SUGERIDOS = [
  "Ação",
  "Aventura",
  "Comédia",
  "Drama",
  "Terror",
  "Suspense",
  "Thriller",
  "Ficção Científica",
  "Fantasia",
  "Romance",
  "Documentário",
  "Musical",
  "Reality",
  "True Crime",
  "Mistério",
  "Animação",
];
