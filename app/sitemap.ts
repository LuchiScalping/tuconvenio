import type { MetadataRoute } from "next";
import path from "path";
import fs from "fs";

const BASE_URL = "https://tuconvenio.es";

export default function sitemap(): MetadataRoute.Sitemap {
  const dataDir = path.join(process.cwd(), "data");
  let archivos: string[] = [];
  try {
    archivos = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));
  } catch {
    archivos = [];
  }

  const sectores = archivos
    .map((f) => f.replace(".json", ""))
    .filter(
      (slug) =>
        !slug.includes("_test") &&
        !slug.includes("_vii") &&
        !slug.includes("_viii")
    );

  const rutasSectores: MetadataRoute.Sitemap = sectores.map((slug) => ({
    url: `${BASE_URL}/buscar?sector=${slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...rutasSectores,
  ];
}
