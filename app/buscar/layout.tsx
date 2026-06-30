import { Suspense } from "react";

export default function BuscarLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          Cargando...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
