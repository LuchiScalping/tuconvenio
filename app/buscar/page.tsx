"use client";

import { useState, useEffect, useCallback, useRef, type ComponentType } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { SECTOR_META } from "../sectorMeta";
import {
  IconArrowLeft,
  IconArrowRight,
  IconSearch,
  IconFileText,
  IconChevronDown,
  IconExternalLink,
  IconInfoCircle,
  IconMoodEmpty,
  IconCircleCheck,
  IconLoader2,
  IconSun,
  IconFlower,
  IconHeart,
  IconClipboardCheck,
  IconClock,
  IconDoorExit,
  IconBabyCarriage,
  IconBriefcase,
  IconBandage,
  IconBolt,
  IconBed,
  IconTrendingUp,
  IconMoon,
  IconCash,
  IconAlertTriangle,
  IconCalendarMonth,
  IconNotebook,
  IconReceipt,
  type IconProps,
} from "@tabler/icons-react";

type IconCmp = ComponentType<IconProps>;

type Articulo = {
  id: number;
  numero: string;
  titulo: string;
  contenido: string;
  categoria: string;
  tags: string[];
};

type Resultado = {
  convenio: { nombre: string; boe_referencia: string; sector: string; anio: string };
  respuestaDirecta: string | null;
  articuloRespuesta: Articulo | null;
  datoClave: { valor: string; unidad: string } | null;
  articulos: Articulo[];
  total: number;
  query: string;
};

// Delegado a sectorMeta.ts — todos los sectores disponibles

const CATS: Record<string, string> = {
  permisos: "Permisos",
  vacaciones: "Vacaciones",
  salario: "Salario",
  jornada: "Jornada",
  excedencias: "Excedencias",
  contratacion: "Contratación",
  despido: "Despido",
  general: "General",
};

type Pregunta = { Icon: IconCmp; corto: string; query: string; texto: string };

// Preguntas comunes reutilizables
const P = {
  vacaciones:   { Icon: IconSun,            corto: "Vacaciones",   query: "vacaciones días anuales",                  texto: "¿Cuántos días de vacaciones?" },
  jornada:      { Icon: IconClock,          corto: "Jornada",      query: "jornada máxima horas semanales ordinaria", texto: "¿Cuántas horas se trabajan a la semana?" },
  fallecimiento:{ Icon: IconFlower,         corto: "Fallecimiento",query: "permiso fallecimiento familiar",           texto: "¿Permiso por fallecimiento?" },
  matrimonio:   { Icon: IconHeart,          corto: "Matrimonio",   query: "permiso matrimonio boda",                  texto: "¿Permiso por matrimonio?" },
  despido:      { Icon: IconBriefcase,      corto: "Despido",      query: "indemnización despido días por año",       texto: "¿Indemnización por despido?" },
  prueba:       { Icon: IconClipboardCheck, corto: "Período prueba",query: "período prueba duración meses",            texto: "¿Cuánto dura el período de prueba?" },
  horasExtra:   { Icon: IconBolt,           corto: "Horas extra",  query: "horas extraordinarias precio compensación",texto: "¿Cómo se pagan las horas extra?" },
  nacimiento:   { Icon: IconBabyCarriage,   corto: "Nacimiento",   query: "permiso nacimiento hijo paternidad",       texto: "¿Permiso por nacimiento de hijo?" },
  antiguedad:   { Icon: IconTrendingUp,     corto: "Antigüedad",   query: "plus antigüedad trienio quinquenio",       texto: "¿Tengo plus de antigüedad?" },
  excedencia:   { Icon: IconDoorExit,       corto: "Excedencia",   query: "excedencia voluntaria meses años",         texto: "¿Excedencia voluntaria?" },
  descanso:     { Icon: IconBed,            corto: "Descanso",     query: "descanso mínimo entre jornadas horas",     texto: "¿Descanso entre jornadas?" },
  baja:         { Icon: IconBandage,        corto: "Baja",         query: "complemento incapacidad temporal enfermedad", texto: "¿Qué cobro si estoy de baja?" },
  nocturno:     { Icon: IconMoon,           corto: "Nocturno",     query: "trabajo nocturno plus nocturnidad",        texto: "¿Cómo se paga el trabajo nocturno?" },
} satisfies Record<string, Pregunta>;

const PREGUNTAS_GENERICAS: Pregunta[] = [
  P.vacaciones, P.jornada, P.fallecimiento, P.matrimonio,
  P.nacimiento, P.baja, P.despido, P.prueba, P.horasExtra, P.excedencia,
];

const PREGUNTAS_POR_SECTOR: Record<string, Pregunta[]> = {
  construccion: [
    P.vacaciones,
    P.jornada,
    { Icon: IconCash,           corto: "Dietas",        query: "dietas desplazamiento kilometraje",                texto: "¿Cuánto cobro de dietas o desplazamiento?" },
    P.fallecimiento,
    P.despido,
    { Icon: IconAlertTriangle,  corto: "Plus penoso",   query: "plus penoso tóxico peligroso",                     texto: "¿Plus por trabajos penosos o peligrosos?" },
    { Icon: IconBandage,        corto: "Baja accidente",query: "complemento hospitalización incapacidad accidente",texto: "¿Qué cobro si estoy de baja por accidente?" },
    P.matrimonio,
    P.horasExtra,
    P.nacimiento,
  ],
  retail: [
    P.vacaciones,
    P.jornada,
    { Icon: IconCalendarMonth,  corto: "Festivos",      query: "jornada festivos descanso domingos",               texto: "¿Tengo que trabajar domingos y festivos?" },
    P.nocturno,
    P.prueba,
    P.despido,
    P.fallecimiento,
    P.matrimonio,
    P.antiguedad,
    P.nacimiento,
  ],
  hosteleria: [
    P.vacaciones,
    { Icon: IconClock,          corto: "Jornada",       query: "jornada anual horas",                              texto: "¿Cuántas horas se trabajan al año?" },
    P.horasExtra,
    P.prueba,
    P.despido,
    P.fallecimiento,
    P.descanso,
    P.matrimonio,
    P.antiguedad,
    P.nacimiento,
  ],
  sanidad: [
    P.vacaciones,
    P.jornada,
    { Icon: IconMoon,           corto: "Turnos",        query: "jornada nocturna turnos horario",                  texto: "¿Cómo son los turnos y el trabajo nocturno?" },
    { Icon: IconBandage,        corto: "Baja",          query: "compensación incapacidad temporal accidente",      texto: "¿Qué cobro si estoy de baja?" },
    P.descanso,
    P.despido,
    P.fallecimiento,
    P.excedencia,
    P.matrimonio,
    P.prueba,
  ],
  educacion: [
    { Icon: IconNotebook,       corto: "Horas lectivas",query: "personal docente horas lectivas jornada",          texto: "¿Cuántas horas lectivas tengo?" },
    { Icon: IconCalendarMonth,  corto: "Vac. escolares",query: "jornada continuada periodos vacaciones escolares", texto: "¿Qué jornada hay en vacaciones escolares?" },
    P.vacaciones,
    { Icon: IconReceipt,        corto: "Pagas extra",   query: "pagas extras",                                     texto: "¿Cuántas pagas extras tengo?" },
    { Icon: IconBed,            corto: "Descanso",      query: "descanso semanal entre jornadas",                  texto: "¿Descanso semanal y entre jornadas?" },
    P.despido,
    P.fallecimiento,
    P.excedencia,
    P.matrimonio,
    P.prueba,
  ],
};

function partirContenido(texto: string): string[] {
  return texto
    .split(/(?=\d+\.\s{2,})|(?=[a-zA-Z]\)\s{1,5}[^\s])/)
    .map((p) => p.trim())
    .filter((p) => p.length > 15);
}

export default function BuscarPage() {
  const searchParams = useSearchParams();
  const sector = searchParams.get("sector") || "";
  const urlQuery = searchParams.get("q") || "";

  const router = useRouter();
  const [query, setQuery] = useState(urlQuery);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [cargando, setCargando] = useState(false);
  const [fuenteAbierta, setFuenteAbierta] = useState(false);
  const [articuloAbierto, setArticuloAbierto] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Si estamos mostrando una respuesta (para que "atrás" vuelva a la lista de preguntas)
  const mostrandoRef = useRef(false);

  const buscar = useCallback(
    async (q: string) => {
      if (!sector) return;
      setCargando(true);
      setFuenteAbierta(false);
      setArticuloAbierto(null);
      try {
        const res = await fetch(`/api/buscar?${new URLSearchParams({ sector, q, cat: "" })}`);
        setResultado(await res.json());
      } catch {
        setResultado(null);
      } finally {
        setCargando(false);
      }
    },
    [sector]
  );

  // Abrir una pregunta: añade una entrada al historial la primera vez,
  // así el botón "atrás" del navegador/móvil vuelve a la lista, no a la landing.
  const irAPregunta = useCallback(
    (texto: string, q: string) => {
      setQuery(texto);
      if (!mostrandoRef.current) {
        mostrandoRef.current = true;
        window.history.pushState({ ans: true }, "");
      }
      buscar(q);
    },
    [buscar]
  );

  const volverAtras = () => {
    if (mostrandoRef.current) {
      window.history.back();
    } else {
      router.push("/");
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (urlQuery) {
      mostrandoRef.current = true;
      window.history.pushState({ ans: true }, "");
    }
    buscar(urlQuery);
  }, [sector]);

  // "Atrás" estando en una respuesta → limpiar y mostrar la lista de preguntas
  useEffect(() => {
    const onPop = () => {
      mostrandoRef.current = false;
      setResultado(null);
      setQuery("");
      setFuenteAbierta(false);
      setArticuloAbierto(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const sectorInfo = SECTOR_META[sector];
  if (!sector) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Link href="/" className="text-green font-medium">← Volver al inicio</Link>
      </div>
    );
  }

  const SectorIcon = sectorInfo?.Icon ?? (() => null);
  const sectorNombre = sectorInfo?.nombre ?? sector;
  const PREGUNTAS = PREGUNTAS_POR_SECTOR[sector] ?? PREGUNTAS_GENERICAS;
  const tieneRespuesta = !!(resultado?.respuestaDirecta && resultado?.articuloRespuesta);

  return (
    <div className="min-h-screen bg-paper">

      {/* Cabecera */}
      <header className="bg-paper/95 backdrop-blur-sm border-b border-line-soft sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={volverAtras}
            aria-label="Atrás"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-paper-card text-ink-soft hover:text-ink transition-colors"
          >
            <IconArrowLeft size={18} />
          </button>
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-bg text-green">
            <SectorIcon size={16} stroke={1.75} />
          </span>
          <span className="font-serif font-medium text-ink text-[15px]">{sectorNombre}</span>
          <div className="ml-auto flex items-center gap-2">
            {resultado?.convenio?.anio && (
              <span className="text-[11px] text-green bg-green-bg rounded-full px-2.5 py-1 font-medium tabular-nums">
                BOE {resultado.convenio.anio}
              </span>
            )}
            {resultado?.convenio?.boe_referencia && (
              <a
                href={`https://www.boe.es/diario_boe/txt.php?id=${resultado.convenio.boe_referencia}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-ink-hint hover:text-green transition-colors border border-line rounded-full px-2.5 py-1 hover:border-green hover:bg-green-bg"
              >
                Convenio completo <IconExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {/* Buscador */}
        <div className="max-w-xl mx-auto px-4 pb-3">
          <form
            onSubmit={(e) => { e.preventDefault(); if (query.trim()) irAPregunta(query, query); }}
            className="flex items-center gap-2 bg-white border border-line rounded-2xl pl-4 pr-2 py-1.5 focus-within:border-green transition-colors"
          >
            <IconSearch size={18} className="text-ink-hint shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Cuántos días de permiso por matrimonio?"
              className="flex-1 bg-transparent text-ink placeholder-ink-hint text-sm py-2 focus:outline-none"
            />
            <button
              type="submit"
              disabled={cargando}
              aria-label="Buscar"
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-green text-white hover:bg-[#0c5a47] active:scale-95 transition-all disabled:opacity-50 shrink-0"
            >
              <IconArrowRight size={18} />
            </button>
          </form>
          <p className="text-[11px] text-ink-hint mt-2 px-1">
            💡 Usa palabras clave: <span className="text-ink-soft">vacaciones, jornada, horas extra, excedencia, despido…</span> — no frases completas
          </p>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4">

        {/* Sin búsqueda — preguntas */}
        {!resultado?.query && !cargando && (
          <div className="py-6">
            <p className="text-ink-hint text-[11px] uppercase tracking-[0.14em] font-medium mb-4">
              Preguntas frecuentes
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {PREGUNTAS.map((p) => (
                <button
                  key={p.query}
                  onClick={() => irAPregunta(p.texto, p.query)}
                  className="group flex items-center gap-3 bg-white border border-line rounded-2xl px-3.5 py-3.5 text-left hover:border-green hover:shadow-[0_2px_12px_rgba(15,110,86,0.08)] transition-all"
                >
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-green-bg text-green shrink-0">
                    <p.Icon size={18} stroke={1.75} />
                  </span>
                  <span className="text-ink text-[13px] font-medium leading-tight group-hover:text-green transition-colors">
                    {p.corto}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {cargando && (
          <div className="flex flex-col items-center justify-center py-28 gap-3">
            <IconLoader2 size={28} className="text-green animate-spin" />
            <p className="text-sm text-ink-soft">Buscando en el convenio…</p>
          </div>
        )}

        {/* Resultados */}
        {!cargando && resultado?.query && (
          <div className="py-2">

            {/* ✅ Respuesta con número grande */}
            {tieneRespuesta && (
              <div>
                <p className="font-serif text-ink text-[20px] leading-tight font-medium mt-5 mb-1">
                  {query}
                </p>

                {resultado.datoClave ? (
                  <div className="text-center py-8">
                    <div className="font-serif font-semibold text-green text-[92px] leading-[0.9] tracking-tight tabular-nums">
                      {resultado.datoClave.valor}
                    </div>
                    <div className="text-ink-muted text-[17px] mt-2">
                      {resultado.datoClave.unidad}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <IconCircleCheck size={56} className="text-green" stroke={1.5} />
                  </div>
                )}

                {/* Contexto */}
                <div className="bg-paper-card rounded-2xl px-5 py-4">
                  <p className="text-ink-muted text-[13.5px] leading-relaxed">
                    {resultado.respuestaDirecta}
                  </p>
                </div>

                {/* Fuente */}
                <button
                  onClick={() => setFuenteAbierta(!fuenteAbierta)}
                  className="mt-3 w-full flex items-center gap-2 text-ink-soft hover:text-ink text-[12px] transition-colors px-1"
                >
                  <IconFileText size={15} className="shrink-0" />
                  <span className="font-medium">{resultado.articuloRespuesta?.numero}</span>
                  <span className="text-ink-hint">·</span>
                  <span className="truncate">{resultado.articuloRespuesta?.titulo}</span>
                  <IconChevronDown size={15} className={`ml-auto shrink-0 transition-transform ${fuenteAbierta ? "rotate-180" : ""}`} />
                </button>
                {fuenteAbierta && (
                  <div className="mt-2 space-y-2 bg-white border border-line rounded-2xl p-4">
                    {partirContenido(resultado.articuloRespuesta!.contenido).map((p, i) => (
                      <p key={i} className="text-[12px] text-ink-muted leading-relaxed pl-3 border-l-2 border-line">
                        {p}
                      </p>
                    ))}
                    <a
                      href={`https://www.boe.es/diario_boe/txt.php?id=${resultado.convenio.boe_referencia}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1 text-[12px] text-green font-medium hover:underline"
                    >
                      Ver texto completo en el BOE <IconExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ❓ Sin respuesta directa */}
            {!tieneRespuesta && resultado.articulos.length > 0 && (
              <div className="pt-4">
                <div className="flex items-center gap-2.5 text-ink-muted text-[13px] mb-4 px-1">
                  <IconInfoCircle size={18} className="text-ink-soft shrink-0" />
                  No encontré una cifra exacta. Estos artículos pueden ayudarte:
                </div>
                <div className="space-y-2">
                  {resultado.articulos.slice(0, 8).map((art) => {
                    const cat = CATS[art.categoria] ?? CATS.general;
                    const abierto = articuloAbierto === art.id;
                    return (
                      <div key={art.id} className="bg-white border border-line rounded-2xl overflow-hidden">
                        <button
                          onClick={() => setArticuloAbierto(abierto ? null : art.id)}
                          className="w-full text-left px-4 py-3.5 hover:bg-paper-card/60 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-medium text-green bg-green-bg rounded-full px-2 py-0.5">
                                  {cat}
                                </span>
                                <span className="text-[10px] text-ink-hint font-medium">{art.numero}</span>
                              </div>
                              <p className="font-serif font-medium text-ink text-[14px] leading-snug">{art.titulo}</p>
                              {!abierto && (
                                <p className="text-[12px] text-ink-soft mt-0.5 line-clamp-1">
                                  {art.contenido.slice(0, 80)}…
                                </p>
                              )}
                            </div>
                            <IconChevronDown size={16} className={`text-ink-hint mt-1 shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`} />
                          </div>
                        </button>
                        {abierto && (
                          <div className="px-4 pb-4 pt-1 space-y-2 border-t border-line-soft">
                            {partirContenido(art.contenido).map((punto, i) => (
                              <p key={i} className="text-[12px] text-ink-muted leading-relaxed pl-3 border-l-2 border-line mt-2">
                                {punto}
                              </p>
                            ))}
                            <a
                              href={`https://www.boe.es/diario_boe/txt.php?id=${resultado.convenio.boe_referencia}`}
                              target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-1 text-[12px] text-green font-medium hover:underline"
                            >
                              Ver en el BOE <IconExternalLink size={14} />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sin resultados */}
            {resultado.articulos.length === 0 && !tieneRespuesta && (
              <div className="flex flex-col items-center text-center py-20">
                <IconMoodEmpty size={44} className="text-ink-hint" stroke={1.5} />
                <p className="text-ink-muted text-sm mt-3 mb-1">No encontré nada con esas palabras</p>
                <a
                  href={`https://www.boe.es/diario_boe/txt.php?id=${resultado?.convenio?.boe_referencia}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] text-green font-medium hover:underline mt-2"
                >
                  Ver convenio completo <IconExternalLink size={14} />
                </a>
              </div>
            )}

            {/* Otras preguntas */}
            <div className="mt-4 pt-5 border-t border-line-soft">
              <p className="text-ink-hint text-[11px] uppercase tracking-[0.14em] font-medium mb-3">
                Otras preguntas
              </p>
              <div className="flex flex-wrap gap-2">
                {PREGUNTAS.filter((p) => p.query !== resultado.query).slice(0, 7).map((p) => (
                  <button
                    key={p.query}
                    onClick={() => irAPregunta(p.texto, p.query)}
                    className="inline-flex items-center gap-1.5 bg-white border border-line rounded-full pl-2.5 pr-3.5 py-1.5 text-[12px] text-ink-muted hover:border-green hover:text-green transition-all"
                  >
                    <p.Icon size={14} stroke={1.75} />
                    {p.corto}
                  </button>
                ))}
              </div>
            </div>

            <div className="pb-12" />
          </div>
        )}
      </div>
    </div>
  );
}
