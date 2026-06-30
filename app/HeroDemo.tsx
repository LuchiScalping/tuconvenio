"use client";

import { useState, useEffect } from "react";

const EJEMPLOS = [
  { pregunta: "¿Cuántos días de vacaciones tengo?", valor: "30", unidad: "días naturales", art: "Art. 76" },
  { pregunta: "¿Días de permiso por matrimonio?",   valor: "15", unidad: "días naturales", art: "Art. 75" },
  { pregunta: "¿Permiso por fallecimiento familiar?", valor: "3", unidad: "días laborables", art: "Art. 75" },
  { pregunta: "¿Jornada máxima semanal?",           valor: "40", unidad: "horas / semana",  art: "Art. 74" },
];

export default function HeroDemo() {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setI((p) => (p + 1) % EJEMPLOS.length);
        setVisible(true);
      }, 320);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  const e = EJEMPLOS[i];

  return (
    <div className="bg-white border border-line rounded-2xl overflow-hidden">
      {/* Cuerpo */}
      <div
        className="px-4 py-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        {/* Pregunta */}
        <p className="text-ink-soft text-[13px] mb-3 leading-snug text-center">{e.pregunta}</p>

        {/* Respuesta */}
        <div className="flex items-baseline justify-center gap-2.5">
          <span className="font-serif font-semibold text-green text-[52px] leading-none tabular-nums tracking-tight">
            {e.valor}
          </span>
          <span className="text-ink-muted text-[14px] leading-tight">{e.unidad}</span>
          <span
            className="inline-block w-[2px] h-[30px] bg-green rounded-sm ml-0.5 self-center"
            style={{ animation: "heroBlink 0.85s step-end infinite" }}
          />
        </div>
      </div>

      {/* Pie */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-line-soft bg-paper/60">
        <span className="text-ink-hint text-[11px] font-medium">{e.art} · Convenio oficial</span>
        <div className="flex gap-1.5">
          {EJEMPLOS.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === i ? "w-4 bg-green" : "w-1.5 bg-line"
              }`}
            />
          ))}
        </div>
      </div>

      <style>{`@keyframes heroBlink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}
