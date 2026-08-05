"use client";

export default function Modal({
  aberto,
  onClose,
  titulo,
  children,
}: {
  aberto: boolean;
  onClose: () => void;
  titulo: string;
  children: React.ReactNode;
}) {
  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      {/* No celular abre como uma folha subindo da parte de baixo (padrão iOS);
          no desktop vira um modal centralizado normal. */}
      <div
        className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-card p-6 pb-safe shadow-xl sm:rounded-app sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex justify-center sm:hidden">
          <span className="h-1.5 w-10 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="mb-4 mt-3 flex items-center justify-between sm:mt-0">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button
            onClick={onClose}
            className="rounded-app px-2 py-1 text-muted active:opacity-60"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
