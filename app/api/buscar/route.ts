import { NextRequest } from "next/server";
import path from "path";
import fs from "fs";

type Articulo = {
  id: number;
  numero: string;
  titulo: string;
  contenido: string;
  categoria: string;
  tags: string[];
};

type ConvenioJSON = {
  convenio: {
    nombre: string;
    boe_referencia: string;
    sector: string;
    fecha_publicacion: string;
    notas: string[];
  };
  articulos: Omit<Articulo, "id">[];
};

// Valida dinámicamente: acepta cualquier sector con JSON en scraper/output/
function sectorValido(sector: string): boolean {
  if (!sector || !/^[a-z0-9_]+$/.test(sector)) return false;
  const p = path.join(process.cwd(), "data", `${sector}.json`);
  return fs.existsSync(p);
}

const NUMEROS_PALABRA: Record<string, string> = {
  "un": "1", "una": "1", "dos": "2", "tres": "3", "cuatro": "4", "cinco": "5",
  "seis": "6", "siete": "7", "ocho": "8", "nueve": "9", "diez": "10",
  "once": "11", "doce": "12", "trece": "13", "catorce": "14", "quince": "15",
  "dieciséis": "16", "diecisiete": "17", "dieciocho": "18", "diecinueve": "19",
  "veinte": "20", "veintiún": "21", "veintidós": "22", "veintitrés": "23",
  "veinticuatro": "24", "veinticinco": "25", "treinta": "30", "cuarenta": "40",
  "cincuenta": "50", "sesenta": "60", "noventa": "90", "cien": "100", "ciento": "100",
};

// Números compuestos frecuentes en convenios (deben ir ANTES en la alternancia del regex)
const NUMEROS_COMPUESTOS: Record<string, string> = {
  "treinta y una": "31", "treinta y un": "31",
  "treinta y dos": "32", "treinta y tres": "33",
  "treinta y cuatro": "34", "treinta y cinco": "35",
  "cuarenta y cinco": "45", "cuarenta y ocho": "48",
  "cuarenta y cuatro": "44", "cuarenta y dos": "42",
  "veintidós": "22", "veintitrés": "23", "veinticuatro": "24", "veinticinco": "25",
};

// Los compuestos van primero para que regex los prefiera sobre las partes simples
const NUMEROS_COMP_RE = Object.keys(NUMEROS_COMPUESTOS)
  .sort((a, b) => b.length - a.length)
  .map((k) => k.replace(/\s+/g, "\\s+"))
  .join("|");
const NUMEROS_SIMPLE_RE = Object.keys(NUMEROS_PALABRA).join("|");
const NUMEROS_RE = `${NUMEROS_COMP_RE}|${NUMEROS_SIMPLE_RE}`;

const PATRON_NUM = new RegExp(
  `(?<![.\\d])(\\d+|${NUMEROS_RE})\\s*(días?\\s*(naturales?|laborables?|hábiles?)?|meses?\\b|años?\\b|semanas?\\b|horas?\\s*(semanales?|diarias?|anuales?)?\\b)`,
  "i"
);
// Porcentajes: "100 por 100", "100 %", "75 por ciento", "cien por cien"
const PATRON_PCT = new RegExp(
  `(?<![.\\d])(\\d+|${NUMEROS_RE})\\s*(?:%|por\\s*(?:100|cien(?:to)?))`,
  "i"
);

// Palabras que indican subcategoría especial — penalizar si no están en la query
const PALABRAS_SUBCATEGORIA = [
  "porteros", "vigilantes", "guardas", "médicos", "enfermeras", "directivos",
  "gerentes", "técnicos", "administrativos", "peones", "oficiales", "jefes",
];

function cargarConvenio(sector: string): ConvenioJSON | null {
  try {
    const jsonPath = path.join(process.cwd(), "data", `${sector}.json`);
    const raw = fs.readFileSync(jsonPath, "utf-8");
    return JSON.parse(raw) as ConvenioJSON;
  } catch {
    return null;
  }
}

// Intención de la query → categoría preferida
const INTENCION_CATEGORIA: Record<string, string[]> = {
  permisos:     ["permiso", "licencia", "ausencia", "matrimonio", "boda", "fallecimiento", "defuncion",
                 "nacimiento", "paternidad", "maternidad", "lactancia", "traslado", "hospitalizacion"],
  vacaciones:   ["vacacion", "vacaciones"],
  jornada:      ["jornada", "horario", "semana", "horas", "semanales", "trabajar", "descanso", "turno"],
  salario:      ["salario", "sueldo", "tabla", "plus", "complemento", "retribuci", "remuneraci", "pagas"],
  despido:      ["despido", "indemnizacion", "finiquito", "extincion", "preaviso"],
  contratacion: ["prueba", "contrato", "contratacion", "subrogacion", "fijo", "temporal"],
  excedencias:  ["excedencia", "conciliacion", "reduccion", "suspension"],
};

function puntuarRelevancia(articulo: Omit<Articulo, "id">, palabras: string[]): number {
  if (!palabras.length) return 1;
  const titulo = articulo.titulo.toLowerCase();
  const contenido = articulo.contenido.toLowerCase();
  const tags = articulo.tags.join(" ").toLowerCase();
  let score = 0;
  for (const p of palabras) {
    if (titulo === p) score += 12;
    else if (titulo.includes(p)) score += 5;
    if (tags.includes(p)) score += 3;
    if (contenido.includes(p)) score += 1;
  }

  // Bonus de categoría: si la query pide algo concreto, priorizar el artículo correcto
  const qStr = palabras.join(" ");
  for (const [cat, kws] of Object.entries(INTENCION_CATEGORIA)) {
    if (kws.some((kw) => qStr.includes(kw)) && articulo.categoria === cat) {
      score += 10;
      break;
    }
  }
  // Penalizar fuertemente artículos de "general" cuando la intención es permisos/vacaciones/jornada
  if (articulo.categoria === "general" &&
      Object.entries(INTENCION_CATEGORIA)
        .filter(([cat]) => cat !== "general")
        .some(([, kws]) => kws.some((kw) => qStr.includes(kw)))) {
    score -= 4;
  }

  return score;
}

function extraerRespuestaDirecta(contenido: string, palabras: string[], esVacacionesQuery = false): string | null {
  const texto = contenido.replace(/\n/g, " ");

  // Intentar split por sub-apartados (a), b), c)... o 1. 2. 3.)
  let fragmentos = texto
    .split(/(?=[a-zA-Z]\)\s{1,5}[^\s])|(?=\d+\.\s{2,})/)
    .map((f) => f.trim())
    .filter((f) => f.length > 20);

  // Si no hay sub-apartados, split por oraciones
  if (fragmentos.length <= 2) {
    fragmentos = texto
      .split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ\d])/)
      .map((f) => f.trim())
      .filter((f) => f.length > 20);
  }

  const queryLower = new Set(palabras);

  const puntuados = fragmentos.map((frag, i) => {
    const f = frag.toLowerCase();
    let score = 0;

    // +3 por cada palabra de la query que aparece en el fragmento
    for (const p of palabras) {
      if (f.includes(p)) score += 3;
    }

    // +2 si contiene un número/dato clave
    if (PATRON_NUM.test(frag)) score += 2;

    // Penalizar fragmentos que hablan de subcategorías específicas no preguntadas
    for (const sub of PALABRAS_SUBCATEGORIA) {
      if (f.includes(sub) && !queryLower.has(sub)) {
        score -= 2;
        break;
      }
    }
    // Penalizar fragmentos de compensación/reducción (no son el derecho principal)
    // En vacaciones: penalty fuerte para que nunca gane al entitlement principal
    const esCompensacion = /incremento|compensaci|penaliz|reducción proporcional|expediente de regulación|proporcionalmente/.test(f);
    if (esCompensacion) score -= esVacacionesQuery ? 10 : 3;
    // Para vacaciones: score diferenciado según unidad del número
    const fragTieneNumero = PATRON_NUM.test(frag);
    if (esVacacionesQuery && fragTieneNumero) {
      const mm = PATRON_NUM.exec(frag);
      const unidFrag = mm?.[2] ?? "";
      if (/día|semana/.test(unidFrag)) score += 5;  // bonus fuerte: es el dato que buscamos
      else if (/mes|año/.test(unidFrag)) score -= 4; // penalizar cláusulas secundarias
    }

    // Penalty por posición: cap más bajo cuando hay número
    const posicionPenalty = fragTieneNumero ? Math.min(i * 0.3, 1.5) : i * 0.4;
    score -= posicionPenalty;

    return { frag, score };
  });

  // Palabras demasiado genéricas — aparecen en casi todos los artículos y
  // no sirven para anclar un fragmento concreto
  const PALABRAS_GENERICAS = new Set([
    "permiso", "permisos", "licencia", "licencias", "jornada", "trabajador",
    "trabajadora", "trabajadores", "empresa", "contrato", "periodo", "derecho",
    "dias", "meses", "horas", "semana", "anuales", "semanales",
  ]);

  const palabrasEspecificas = palabras.filter((p) => !PALABRAS_GENERICAS.has(p));
  // Si TODAS las palabras son genéricas, usar la lista completa
  const palabrasValidacion = palabrasEspecificas.length > 0 ? palabrasEspecificas : palabras;

  // Para vacaciones: preferir fragmento con mayor días calificados (naturales/laborables/hábiles)
  const diasMinThreshold = esVacacionesQuery ? 20 : -1;

  if (diasMinThreshold > 0) {
    const patronGlobalFrag = new RegExp(PATRON_NUM.source, "gi");
    type FragCandidate = { frag: string; maxDias: number; calificado: boolean };
    const candidatos: FragCandidate[] = fragmentos.map((frag) => {
      let maxDias = -1;
      let calificado = false;
      let mm: RegExpExecArray | null;
      patronGlobalFrag.lastIndex = 0;
      while ((mm = patronGlobalFrag.exec(frag)) !== null) {
        const unidFrag = mm[2].trim();
        if (!/^día|^semana/i.test(unidFrag)) continue;
        const rawV = mm[1].toLowerCase().replace(/\s+/g, " ").trim();
        const numV = parseInt(NUMEROS_COMPUESTOS[rawV] ?? NUMEROS_PALABRA[rawV] ?? rawV, 10);
        if (!isNaN(numV) && numV > maxDias) {
          maxDias = numV;
          calificado = /natural|laborable|hábil|habil/.test(unidFrag);
        }
      }
      return { frag, maxDias, calificado };
    });

    const conCalif = candidatos.filter((x) => x.calificado && x.maxDias >= diasMinThreshold).sort((a, b) => b.maxDias - a.maxDias);
    if (conCalif.length > 0) return conCalif[0].frag.slice(0, 420).trim();
    const sinCalif = candidatos.filter((x) => !x.calificado && x.maxDias >= diasMinThreshold).sort((a, b) => b.maxDias - a.maxDias);
    if (sinCalif.length > 0) return sinCalif[0].frag.slice(0, 420).trim();
    // Sin fragmento con días suficientes: fall-through al selector normal
  }

  const mejor = puntuados.sort((a, b) => b.score - a.score)[0];

  const fragLower = mejor?.frag.toLowerCase() ?? "";
  const matchCount = palabrasValidacion.filter((p) => fragLower.includes(p)).length;
  const tieneNumero = PATRON_NUM.test(mejor?.frag ?? "");
  // Con número: umbral bajo (2) — el artículo ya fue seleccionado con score alto
  // Sin número: umbral alto (4) y 2 keywords mínimo
  const scoreMin = tieneNumero ? 2 : 4;
  const minKeywords = tieneNumero ? 0 : Math.min(2, palabrasValidacion.length);
  if (!mejor || mejor.score < scoreMin || matchCount < Math.min(minKeywords, palabrasValidacion.length)) return null;

  return mejor.frag.slice(0, 420).trim();
}

function extraerPorcentaje(texto: string): { valor: string; unidad: string } | null {
  const pct = PATRON_PCT.exec(texto);
  if (!pct) return null;
  const raw = pct[1].toLowerCase();
  const valor = NUMEROS_PALABRA[raw] ?? raw;
  const tras = texto.slice(pct.index, pct.index + 70).toLowerCase();
  const unidad = tras.includes("salario") ? "% del salario" : "%";
  return { valor, unidad };
}

function extraerDatoClave(respuesta: string, queryPalabras?: string[]): { valor: string; unidad: string } | null {
  // Normalizar: quitar paréntesis con número equivalente ("veintitrés (23) días" → "veintitrés días")
  const texto = respuesta.replace(/\s*\(\d+\)\s*/g, " ").replace(/\s+/g, " ");

  const esVacaciones = queryPalabras?.some((p) => p.includes("vacacion"));
  const esFallecimiento = queryPalabras?.some((p) => /fallecimiento|defuncion/.test(p));
  const esMatrimonio = queryPalabras?.some((p) => /matrimonio|boda/.test(p));
  const esJornada = queryPalabras?.some((p) => /jornada|horas.semanales/.test(p));
  const esPeriodoPrueba = queryPalabras?.some((p) => /prueba/.test(p));

  // Porcentaje: solo tiene sentido para baja/salario, no para permisos de días, jornada ni periodo prueba
  if (!esFallecimiento && !esMatrimonio && !esVacaciones && !esJornada && !esPeriodoPrueba) {
    const pct = extraerPorcentaje(texto);
    if (pct) return pct;
  }

  // Para fallecimiento: extraer número del fragmento SOLO si contiene "fallecimiento/defunción".
  // Si el fragmento es sobre otra cosa (matrimonio, pareja de hecho…), devolver null.
  if (esFallecimiento) {
    const kwIdx = texto.toLowerCase().search(/fallecimiento|defunci[oó]n/);
    if (kwIdx < 0) return null; // fragmento sobre otra cosa
    // Buscar en ventana de ±180 chars alrededor del keyword (el número puede venir antes o después)
    const ventanaStart = Math.max(0, kwIdx - 180);
    const ventanaText = texto.slice(ventanaStart, kwIdx + 180);
    const patronVentana = new RegExp(PATRON_NUM.source, "gi");
    let mp: RegExpExecArray | null;
    while ((mp = patronVentana.exec(ventanaText)) !== null) {
      const unidP = mp[2].trim().toLowerCase();
      if (/año/.test(unidP)) continue;
      const rawV = mp[1].toLowerCase().replace(/\s+/g, " ").trim();
      return { valor: NUMEROS_COMPUESTOS[rawV] ?? NUMEROS_PALABRA[rawV] ?? rawV, unidad: mp[2].trim().replace(/\s+/g, " ") };
    }
    return null;
  }

  const CONDICION_ANIO = /más de|mas de|mínimo de|minimo de|al menos|como mínimo|como minimo|superior a|mayor de|por lo menos/;
  const patronGlobal = new RegExp(PATRON_NUM.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = patronGlobal.exec(texto)) !== null) {
    const unidadMatch = m[2].trim().toLowerCase();
    const contextoAntes = texto.slice(Math.max(0, m.index - 30), m.index);
    // Para vacaciones: solo aceptar días/semanas (no horas, meses, años — son cláusulas secundarias)
    if (esVacaciones && !/^día|^semana/.test(unidadMatch)) continue;
    // Para permisos de matrimonio: saltar años (nunca es la respuesta)
    if (esMatrimonio && /año/.test(unidadMatch)) continue;
    // Para matrimonio: el fragmento debe contener "matrimonio"/"boda" para ser relevante
    if (esMatrimonio && !/matrimonio|boda|enlace/i.test(texto)) continue;
    // Para matrimonio: si el fragmento completo es sobre boda de familiar, no extraer cifra
    if (esMatrimonio && /ascendiente|hermano|descendiente|familiar\s+de|pariente|cuñad/i.test(texto)) continue;
    // Para jornada: solo horas con valor razonable de jornada completa (≥35), rechazar años
    if (esJornada) {
      if (/año/.test(unidadMatch)) continue;
      if (/^hora/.test(unidadMatch)) {
        const rawV = m[1].toLowerCase().replace(/\s+/g, " ").trim();
        const numV = parseInt(NUMEROS_COMPUESTOS[rawV] ?? NUMEROS_PALABRA[rawV] ?? rawV, 10);
        // Aceptar si es horas semanales ≥35, o horas anuales ≥1500
        const esAnual = /anual/.test(unidadMatch);
        if (!isNaN(numV) && !esAnual && numV < 35) continue; // horas semanales muy bajas = reducción
        if (!isNaN(numV) && esAnual && numV < 1500) continue;
      }
    }
    // Saltar si es condición previa con unidad años ("más de un AÑO de convivencia")
    if (/año/.test(unidadMatch) && CONDICION_ANIO.test(contextoAntes.toLowerCase())) continue;
    const rawValor = m[1].toLowerCase().replace(/\s+/g, " ").trim();
    const valor = NUMEROS_COMPUESTOS[rawValor] ?? NUMEROS_PALABRA[rawValor] ?? rawValor;
    const unidad = m[2].trim().replace(/\s+/g, " ");
    return { valor, unidad };
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sector = searchParams.get("sector") || "";
  const query = (searchParams.get("q") || "").trim();
  const categoria = searchParams.get("cat") || "";

  if (!sectorValido(sector)) {
    return Response.json({ error: "Sector no válido" }, { status: 400 });
  }

  const data = cargarConvenio(sector);
  if (!data) {
    return Response.json({ error: "Convenio no encontrado" }, { status: 404 });
  }

  // Normalizar query: quitar stop words cortas y acentos para matching
  const palabras = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["para", "como", "cuantos", "cuanto", "tiene", "tengo", "dias", "años"].includes(w));

  let articulos = data.articulos.map((a, i) => ({ ...a, id: i + 1 }));

  if (categoria) articulos = articulos.filter((a) => a.categoria === categoria);

  let articulosPuntuados: (typeof articulos[0] & { _score: number })[] = [];

  if (query) {
    articulosPuntuados = articulos
      .map((a) => ({ ...a, _score: puntuarRelevancia(a, palabras) }))
      .filter((a) => a._score > 0)
      .sort((a, b) => b._score - a._score);

    articulos = articulosPuntuados.map(({ _score: _, ...a }) => a);
  }

  let respuestaDirecta: string | null = null;
  let articuloRespuesta: (typeof articulos)[0] | null = null;
  let datoClave: { valor: string; unidad: string } | null = null;

  // Solo intentar respuesta directa si el artículo top tiene puntuación suficiente
  const scoreTop = articulosPuntuados[0]?._score ?? 0;
  const esVacacionesQuery = palabras.some((p) => p.includes("vacacion"));
  if (query && articulos.length > 0 && scoreTop >= 5) {
    respuestaDirecta = extraerRespuestaDirecta(articulos[0].contenido, palabras, esVacacionesQuery);
    if (respuestaDirecta) {
      articuloRespuesta = articulos[0];
      datoClave = extraerDatoClave(respuestaDirecta, palabras);
      // Fallback: porcentaje en el artículo completo, pero no para permisos de días
      const esFallecimientoQ = palabras.some((p) => /fallecimiento|defuncion/.test(p));
      const esMatrimonioQ = palabras.some((p) => /matrimonio|boda/.test(p));
      const esJornadaQ = palabras.some((p) => /jornada|horas/.test(p));
      const esVacacionesQ = palabras.some((p) => p.includes("vacacion"));
      const esPeriodoPruebaQ = palabras.some((p) => /prueba/.test(p));
      if (!datoClave && !esFallecimientoQ && !esMatrimonioQ && !esJornadaQ && !esVacacionesQ && !esPeriodoPruebaQ) {
        datoClave = extraerPorcentaje(articulos[0].contenido);
      }
    }
  }

  const total = articulos.length;
  articulos = articulos.slice(0, 20);

  const anio = (data.convenio.fecha_publicacion || "").slice(0, 4) || "?";

  return Response.json({
    convenio: {
      nombre: data.convenio.nombre,
      boe_referencia: data.convenio.boe_referencia,
      sector: data.convenio.sector,
      anio,
    },
    respuestaDirecta,
    articuloRespuesta,
    datoClave,
    articulos,
    total,
    query,
    scoreTop,
  });
}
