"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUsuario } from "@/lib/useUsuario";
import { NOME_USUARIO } from "@/lib/types";

const LINKS = [
  { href: "/assistidos", label: "Assistidos", icon: "🎬" },
  { href: "/assistir", label: "Assistir", icon: "🍿" },
  { href: "/perfil", label: "Perfil", icon: "🙂" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { usuario, carregado, sair } = useUsuario();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (usuario) {
      document.documentElement.dataset.user = usuario;
    }
    return () => {
      delete document.documentElement.dataset.user;
    };
  }, [usuario]);

  useEffect(() => {
    if (carregado && !usuario) {
      router.replace("/");
    }
  }, [carregado, usuario, router]);

  if (!carregado || !usuario) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <header className="sticky top-0 z-10 border-b border-border bg-surface-alt/90 pt-safe backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pb-3">
          <span className="flex items-center gap-2 font-semibold">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-app text-white"
              style={{ background: "var(--accent)" }}
            >
              🎬
            </span>
            Nosso Cinema
          </span>

          <button
            onClick={sair}
            className="rounded-full border border-border px-3 py-1.5 text-sm text-muted active:opacity-60"
          >
            {NOME_USUARIO[usuario]} · trocar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface-alt/95 px-safe pb-safe backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around pt-1.5">
          {LINKS.map((link) => {
            const ativo = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-1 flex-col items-center gap-0.5 rounded-app py-1.5 text-xs font-medium transition active:opacity-60"
                style={{ color: ativo ? "var(--accent)" : "var(--muted)" }}
              >
                <span className="text-xl leading-none">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
