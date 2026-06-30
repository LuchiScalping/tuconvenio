import { NextRequest } from "next/server";
import path from "path";
import fs from "fs";

type Lead = {
  email: string;
  sector: string;
  sectorNombre: string;
  fecha: string;
};

const LEADS_FILE = path.join(process.cwd(), "..", "scraper", "leads.json");

function cargarLeads(): Lead[] {
  try {
    if (!fs.existsSync(LEADS_FILE)) return [];
    return JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8")) as Lead[];
  } catch {
    return [];
  }
}

function guardarLeads(leads: Lead[]) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
}

export async function POST(request: NextRequest) {
  try {
    const { email, sector, sectorNombre } = await request.json() as Partial<Lead>;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Email inválido" }, { status: 400 });
    }
    if (!sector || !/^[a-z0-9_]+$/.test(sector)) {
      return Response.json({ error: "Sector inválido" }, { status: 400 });
    }

    const leads = cargarLeads();

    // Evitar duplicados por email+sector
    const existe = leads.some((l) => l.email === email && l.sector === sector);
    if (existe) {
      return Response.json({ ok: true, nuevo: false });
    }

    leads.push({
      email,
      sector,
      sectorNombre: sectorNombre ?? sector,
      fecha: new Date().toISOString(),
    });

    guardarLeads(leads);
    return Response.json({ ok: true, nuevo: true });
  } catch {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET() {
  const leads = cargarLeads();
  return Response.json({ total: leads.length, leads });
}
