import {
  IconTools,
  IconShoppingCart,
  IconToolsKitchen2,
  IconStethoscope,
  IconSchool,
  IconShield,
  IconHome,
  IconHeadset,
  IconScissors,
  IconFlask,
  IconBuildingBank,
  IconCoins,
  IconClipboardList,
  IconBuildingCommunity,
  IconLeaf,
  IconBolt,
  IconPill,
  IconBeer,
  IconShoppingBag,
  IconPhone,
  IconPlane,
  IconBuildingStore,
  IconTag,
  IconGasStation,
  IconFlame,
  IconPlug,
  IconPlaneDeparture,
  type IconProps,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

export type SectorMeta = {
  nombre: string;
  desc: string;
  Icon: ComponentType<IconProps>;
  tipo: "sector" | "empresa";
  boe_id: string;
};

export const SECTOR_META: Record<string, SectorMeta> = {
  construccion:  { nombre: "Construcción",          desc: "Obras, albañilería e instalaciones",             Icon: IconTools,             tipo: "sector",  boe_id: "BOE-A-2023-19903" },
  retail:        { nombre: "Comercio",               desc: "Tiendas, supermercados y distribución",          Icon: IconShoppingCart,       tipo: "sector",  boe_id: "BOE-A-2024-11181" },
  hosteleria:    { nombre: "Hostelería",             desc: "Restaurantes, hoteles y catering",               Icon: IconToolsKitchen2,      tipo: "sector",  boe_id: "BOE-A-2025-12598" },
  sanidad:       { nombre: "Sanidad Privada",        desc: "Clínicas, residencias y atención",               Icon: IconStethoscope,        tipo: "sector",  boe_id: "BOE-A-2023-13742" },
  educacion:     { nombre: "Educación Privada",      desc: "Colegios privados y academias",                  Icon: IconSchool,             tipo: "sector",  boe_id: "BOE-A-2024-15501" },
  seguridad:     { nombre: "Seguridad Privada",      desc: "Vigilantes, guardas y empresas de seguridad",    Icon: IconShield,             tipo: "sector",  boe_id: "BOE-A-2026-8569"  },
  limpieza:      { nombre: "Limpieza de Edificios",  desc: "Limpiadores de edificios, oficinas y locales",   Icon: IconHome,               tipo: "sector",  boe_id: "BOE-A-2013-5424"  },
  contact_center:{ nombre: "Contact Center",         desc: "Telemarketing y atención al cliente",            Icon: IconHeadset,            tipo: "sector",  boe_id: "BOE-A-2023-13741" },
  peluqueria:    { nombre: "Peluquerías y Estética", desc: "Peluquerías, institutos de belleza y gimnasios", Icon: IconScissors,           tipo: "sector",  boe_id: "BOE-A-2024-21671" },
  quimica:       { nombre: "Industria Química",      desc: "Fabricación química, farmacéutica y plásticos",  Icon: IconFlask,              tipo: "sector",  boe_id: "BOE-A-2025-3083"  },
  banca:         { nombre: "Banca",                  desc: "Bancos y entidades bancarias",                   Icon: IconBuildingBank,       tipo: "sector",  boe_id: "BOE-A-2025-47"    },
  cajas_ahorro:  { nombre: "Cajas de Ahorro",        desc: "Cajas y entidades financieras de ahorro",        Icon: IconCoins,              tipo: "sector",  boe_id: "BOE-A-2024-11521" },
  gestorias:     { nombre: "Gestorías",              desc: "Gestorías administrativas y asesorías",          Icon: IconClipboardList,      tipo: "sector",  boe_id: "BOE-A-2024-17575" },
  inmobiliaria:  { nombre: "Inmobiliarias",          desc: "Gestión y mediación inmobiliaria",               Icon: IconBuildingCommunity,  tipo: "sector",  boe_id: "BOE-A-2024-19363" },
  saneamiento:   { nombre: "Saneamiento Público",    desc: "Limpieza viaria, residuos y alcantarillado",     Icon: IconLeaf,               tipo: "sector",  boe_id: "BOE-A-2024-22044" },
  metalgrafica:  { nombre: "Metal y Envases",        desc: "Fabricación de envases metálicos",               Icon: IconBolt,               tipo: "sector",  boe_id: "BOE-A-2025-17343" },
  farmacia:      { nombre: "Farmacias",              desc: "Oficinas de farmacia y parafarmacia",            Icon: IconPill,               tipo: "sector",  boe_id: "BOE-A-2022-23018" },
  mahou:         { nombre: "Mahou, SA",              desc: "Empresa cervecera Mahou San Miguel",             Icon: IconBeer,               tipo: "empresa", boe_id: "BOE-A-2024-7776"  },
  mercadona:     { nombre: "Mercadona",              desc: "Supermercados Mercadona",                        Icon: IconShoppingBag,        tipo: "empresa", boe_id: "BOE-A-2024-3851"  },
  telefonica:    { nombre: "Telefónica / Movistar",  desc: "Telefónica de España y Movistar",               Icon: IconPhone,              tipo: "empresa", boe_id: "BOE-A-2024-3854"  },
  vueling:       { nombre: "Vueling Airlines",       desc: "Personal de Vueling Airlines",                  Icon: IconPlane,              tipo: "empresa", boe_id: "BOE-A-2024-2514"  },
  carrefour:     { nombre: "Carrefour",              desc: "Grupo Supermercados Carrefour España",           Icon: IconBuildingStore,      tipo: "empresa", boe_id: "BOE-A-2023-14204" },
  lidl:          { nombre: "Lidl España",            desc: "Supermercados Lidl en España",                  Icon: IconTag,                tipo: "empresa", boe_id: "BOE-A-2022-14875" },
  repsol:        { nombre: "Repsol, SA",             desc: "Empresa energética y de combustibles Repsol",   Icon: IconGasStation,         tipo: "empresa", boe_id: "BOE-A-2023-8183"  },
  endesa:        { nombre: "Endesa",                 desc: "Grupo Endesa (eléctrica)",                      Icon: IconFlame,              tipo: "empresa", boe_id: "BOE-A-2025-3084"  },
  iberdrola:     { nombre: "Iberdrola Grupo",        desc: "Grupo Iberdrola (eléctrica)",                   Icon: IconPlug,               tipo: "empresa", boe_id: "BOE-A-2021-3284"  },
  iberia:        { nombre: "Iberia (tierra)",        desc: "Personal de tierra de Iberia Líneas Aéreas",    Icon: IconPlaneDeparture,     tipo: "empresa", boe_id: "BOE-A-2023-4120"  },
};
