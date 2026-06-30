import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Convenio = {
  id: number;
  nombre: string;
  sector: string;
  sector_codigo: string;
  ambito: string;
  region: string | null;
  vigencia_desde: string | null;
  vigencia_hasta: string | null;
  activo: boolean;
  total_articulos: number;
};

export type Articulo = {
  id: number;
  convenio_id: number;
  numero: string;
  titulo: string;
  contenido: string;
  categoria: string;
  tags: string[];
};
