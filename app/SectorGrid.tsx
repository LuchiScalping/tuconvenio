"use client";

import { useState } from "react";
import Link from "next/link";
import { IconSearch, IconChevronRight, IconBolt, IconExternalLink } from "@tabler/icons-react";
import { SECTOR_META } from "./sectorMeta";

export type SectorItem = {
  slug: string;
  nombre: string;
  desc: string;
  anio: string;
  tipo: "sector" | "empresa";
  // Sin Icon — se resuelve en cliente desde SECTOR_META por slug
};

export default function SectorGrid({ sectores }: { sectores: SectorItem[] }) {
  const [filtro, setFiltro] = useState("");

  const q = filtro.toLowerCase().trim();
  const filtrados = q
    ? sectores.filter(
        (s) =>
          s.nombre.toLowerCase().includes(q) ||
          s.desc.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q)
      )
    : sectores;

  const grupos: Record<string, SectorItem[]> = {};
  for (const s of filtrados) {
    const g = s.tipo === "empresa" ? "Empresas con convenio propio" : "Sectores";
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(s);
  }

  return (
    <div className="px-4 pt-6 flex-1">
      {/* Buscador */}
      <div className="flex items-center gap-2 bg-white border border-line rounded-2xl pl-4 pr-3 py-2.5 mb-6 focus-within:border-green transition-colors">
        <IconSearch size={17} className="text-ink-hint shrink-0" />
        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Busca tu sector o empresa…"
          className="flex-1 bg-transparent text-ink placeholder-ink-hint text-[14px] focus:outline-none"
        />
      </div>

      {/* Sin resultados */}
      {filtrados.length === 0 && (
        <div className="text-center py-12 text-ink-hint text-[14px]">
          No encontramos "{filtro}"
          <div className="mt-1 text-[12px]">Prueba con otro nombre de sector</div>
        </div>
      )}

      {/* Grupos */}
      {Object.entries(grupos).map(([grupo, items]) => (
        <div key={grupo} className="mb-6">
          <p className="px-1 text-ink-hint text-[11px] uppercase tracking-[0.14em] font-medium mb-3">
            {grupo}
          </p>
          <div className="space-y-2.5">
            {items.map((s) => {
              const meta = SECTOR_META[s.slug];
              const Icon = meta?.Icon ?? IconBolt;
              const boeUrl = meta?.boe_id
                ? `https://www.boe.es/diario_boe/txt.php?id=${meta.boe_id}`
                : null;
              return (
                <div
                  key={s.slug}
                  className="group flex items-center gap-4 bg-white border border-line rounded-2xl px-4 py-4 hover:border-green hover:shadow-[0_2px_12px_rgba(15,110,86,0.08)] transition-all duration-150"
                >
                  <Link href={`/buscar?sector=${s.slug}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-green-bg text-green shrink-0 group-hover:scale-105 transition-transform">
                      <Icon size={22} stroke={1.75} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-serif font-medium text-ink text-[16px]">{s.nombre}</p>
                        {s.anio && s.anio !== "?" && (
                          <span className="text-[10px] text-green bg-green-bg rounded-full px-2 py-0.5 font-medium tabular-nums shrink-0">
                            {s.anio}
                          </span>
                        )}
                      </div>
                      <p className="text-ink-soft text-[12px] mt-0.5 truncate">{s.desc}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    {boeUrl && (
                      <a
                        href={boeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver convenio completo en el BOE"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] text-ink-hint hover:text-green transition-colors px-2 py-1 rounded-lg hover:bg-green-bg"
                      >
                        BOE <IconExternalLink size={11} />
                      </a>
                    )}
                    <IconChevronRight size={18} className="text-ink-hint group-hover:text-green group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
