"use client";

import { useState } from "react";
import { IconBell, IconCheck, IconLoader2 } from "@tabler/icons-react";

type Estado = "idle" | "loading" | "ok" | "error";

export default function LeadCapture({
  sector,
  sectorNombre,
}: {
  sector: string;
  sectorNombre: string;
}) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");

  // No mostrar si ya se suscribió en esta sesión
  const storageKey = `alerta_${sector}`;
  if (typeof window !== "undefined" && localStorage.getItem(storageKey)) return null;
  if (estado === "ok") return null;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("loading");
    try {
      const res = await fetch("/api/alerta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sector, sectorNombre }),
      });
      if (res.ok) {
        localStorage.setItem(storageKey, "1");
        setEstado("ok");
      } else {
        setEstado("error");
      }
    } catch {
      setEstado("error");
    }
  }

  return (
    <div className="my-6 bg-green-bg border border-green/20 rounded-2xl px-5 py-5">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green text-white shrink-0">
          <IconBell size={16} stroke={2} />
        </span>
        <p className="font-serif font-semibold text-ink text-[15px]">
          ¿Tu convenio cambia? Te avisamos gratis
        </p>
      </div>
      <p className="text-ink-soft text-[12px] leading-relaxed mb-4 ml-[42px]">
        Recibe un email solo cuando el convenio de <strong>{sectorNombre}</strong> se actualice en el BOE.
        Sin spam.
      </p>

      {estado === "error" && (
        <p className="text-red-600 text-[12px] mb-2 ml-[42px]">Algo ha fallado, prueba de nuevo.</p>
      )}

      <form onSubmit={enviar} className="flex items-center gap-2 ml-[42px]">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          className="flex-1 bg-white border border-line rounded-xl px-3.5 py-2 text-[13px] text-ink placeholder-ink-hint focus:outline-none focus:border-green transition-colors"
        />
        <button
          type="submit"
          disabled={estado === "loading"}
          className="inline-flex items-center gap-1.5 bg-green text-white rounded-xl px-4 py-2 text-[13px] font-medium hover:bg-[#0c5a47] active:scale-95 transition-all disabled:opacity-60 shrink-0"
        >
          {estado === "loading" ? (
            <IconLoader2 size={15} className="animate-spin" />
          ) : (
            <>
              <IconCheck size={15} />
              Avisar
            </>
          )}
        </button>
      </form>
    </div>
  );
}
