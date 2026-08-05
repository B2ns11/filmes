"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Usuario } from "./types";

const CHAVE = "nosso-cinema:usuario";

export function useUsuario() {
  const [usuario, setUsuarioState] = useState<Usuario | null>(null);
  const [carregado, setCarregado] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const salvo = window.localStorage.getItem(CHAVE);
    if (salvo === "brunno" || salvo === "paloma") {
      setUsuarioState(salvo);
    }
    setCarregado(true);
  }, []);

  const entrar = useCallback((u: Usuario) => {
    window.localStorage.setItem(CHAVE, u);
    setUsuarioState(u);
  }, []);

  const sair = useCallback(() => {
    window.localStorage.removeItem(CHAVE);
    setUsuarioState(null);
    router.push("/");
  }, [router]);

  return { usuario, carregado, entrar, sair };
}
