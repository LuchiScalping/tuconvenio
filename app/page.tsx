import path from "path";
import fs from "fs";
import {
  IconScale, IconShieldCheck,
  IconTools, IconShoppingCart, IconToolsKitchen2, IconStethoscope, IconSchool, IconShield,
} from "@tabler/icons-react";
import HeroDemo from "./HeroDemo";
import SectorGrid, { type SectorItem } from "./SectorGrid";
import { SECTOR_META } from "./sectorMeta";

const ICONOS_DECO = [IconTools, IconShoppingCart, IconToolsKitchen2, IconStethoscope, IconSchool];

function leerSectores(): SectorItem[] {
  const outputDir = path.join(process.cwd(), "data");
  let archivos: string[];
  try {
    archivos = fs.readdirSync(outputDir).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }

  const sectores: SectorItem[] = [];

  for (const archivo of archivos) {
    const slug = archivo.replace(".json", "");

    // Excluir archivos de test, duplicados y variantes
    if (
      slug.includes("_test") ||
      slug.includes("_vii") ||
      slug.includes("_viii") ||
      slug.includes("deportivos") ||
      slug.includes("construccion_") ||
      slug.includes("educacion_")
    ) continue;

    try {
      const raw = fs.readFileSync(path.join(outputDir, archivo), "utf-8");
      const data = JSON.parse(raw);
      const count: number = data.articulos?.length ?? 0;
      if (count < 5) continue; // Ignorar convenios sin artículos útiles

      const meta = SECTOR_META[slug];
      const anio = (data.convenio?.fecha_publicacion ?? "").slice(0, 4) || "?";

      sectores.push({
        slug,
        nombre: meta?.nombre ?? data.convenio?.nombre?.slice(0, 40) ?? slug,
        desc:   meta?.desc   ?? data.convenio?.sector ?? "",
        anio,
        tipo:   meta?.tipo   ?? "sector",
        // Icon se resuelve en el cliente desde SECTOR_META (no serializable)
      });
    } catch {
      continue;
    }
  }

  // Orden: sectores primero, luego empresas; dentro de cada grupo por nombre
  return sectores.sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === "sector" ? -1 : 1;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

export default function Home() {
  const sectores = leerSectores();
  const totalArticulos = sectores.reduce((acc, _) => acc, 0); // simplificado
  const totalSectores = sectores.length;

  return (
    <div className="min-h-screen bg-paper flex flex-col">

      {/* Cabecera */}
      <header className="px-6 pt-7">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green text-white">
            <IconScale size={16} stroke={2} />
          </span>
          <span className="font-serif font-semibold text-ink text-[17px] tracking-tight">
            Convenios<span className="text-green">Claros</span>
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-9 pb-2 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 bg-green-bg text-green rounded-full pl-2 pr-3 py-1 text-[12px] font-medium mb-5">
          <IconShieldCheck size={14} />
          Convenios colectivos oficiales del BOE
        </div>

        <h1 className="font-serif font-semibold text-ink text-[38px] leading-[1.06] tracking-tight">
          Resuelve tus dudas<br />
          del trabajo <span className="italic text-green">al instante</span>
        </h1>
        <p className="text-ink-muted text-[15px] leading-relaxed mt-3 max-w-[340px]">
          Sin esperar a Recursos Humanos. La respuesta exacta de tu convenio: vacaciones, permisos, horas, pluses…
        </p>
      </section>

      {/* Panel visual */}
      <section className="px-6 pt-6">
        {/* Fila de iconos sectoriales decorativa */}
        <div className="flex items-center justify-between mb-3 px-1">
          {ICONOS_DECO.map((Icon, idx) => (
            <span key={idx} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-paper-card border border-line text-ink-hint">
              <Icon size={19} stroke={1.5} />
            </span>
          ))}
        </div>
        {/* Tarjeta demo */}
        <HeroDemo />
      </section>

      {/* Stats rápidas */}
      <section className="px-6 pt-5">
        <div className="flex items-center justify-center gap-3 text-[12px] text-ink-hint">
          <span className="font-semibold text-ink tabular-nums">{totalSectores}</span> convenios disponibles
          <span className="text-line">·</span>
          <span>Datos oficiales del BOE</span>
          <span className="text-line">·</span>
          <span>Gratis</span>
        </div>
      </section>

      {/* Grid de sectores con buscador — componente cliente */}
      <SectorGrid sectores={sectores} />

      {/* Pie */}
      <footer className="px-6 py-7 mt-4 flex items-center gap-2 text-ink-hint text-[12px]">
        <IconShieldCheck size={15} />
        Datos oficiales del BOE · Gratuito · Solo orientativo
      </footer>

    </div>
  );
}
