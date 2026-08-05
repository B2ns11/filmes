"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUsuario } from "@/lib/useUsuario";
import type { Usuario } from "@/lib/types";

interface CartaoUsuario {
  usuario: Usuario;
  nome: string;
  gradiente: string;
  emoji: string;
}

const CARTOES: CartaoUsuario[] = [
  {
    usuario: "brunno",
    nome: "Brunno",
    gradiente: "linear-gradient(150deg, #0f1522, #1b4fc4)",
    emoji: "🎥",
  },
  {
    usuario: "paloma",
    nome: "Paloma",
    gradiente: "linear-gradient(150deg, #ffe3ec, #d6467e)",
    emoji: "🍿",
  },
];

export default function SelecionarUsuarioPage() {
  const { usuario, carregado, entrar } = useUsuario();
  const router = useRouter();
  const [fotos, setFotos] = useState<Record<string, string | null>>({});

  useEffect(() => {
    delete document.documentElement.dataset.user;
  }, []);

  useEffect(() => {
    if (carregado && usuario) {
      router.replace("/assistidos");
    }
  }, [carregado, usuario, router]);

  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((data) => {
        const mapa: Record<string, string | null> = {};
        for (const p of data.perfis || []) {
          mapa[p.usuario] = p.foto_base64 || null;
        }
        setFotos(mapa);
      })
      .catch(() => {});
  }, []);

  if (!carregado || usuario) return null;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-[#0c0d10] px-4 text-center text-white">
      <div>
        <h1 className="text-3xl font-bold">🎬 Nosso Cinema</h1>
        <p className="mt-2 text-white/60">Quem tá assistindo?</p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        {CARTOES.map((c) => (
          <button
            key={c.usuario}
            onClick={() => entrar(c.usuario)}
            className="group flex w-56 flex-col items-center gap-3 rounded-2xl p-6 transition hover:scale-105"
          >
            <div
              className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl text-5xl shadow-lg ring-4 ring-transparent transition group-hover:ring-white/40"
              style={{ background: c.gradiente }}
            >
              {fotos[c.usuario] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fotos[c.usuario] as string}
                  alt={c.nome}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{c.emoji}</span>
              )}
            </div>
            <span className="text-lg font-medium">{c.nome}</span>
          </button>
        ))}
      </div>

      <p className="max-w-xs text-xs text-white/40">
        Sem senha — é só clicar em cima do seu nome pra entrar.
      </p>
    </div>
  );
}
