// Build statycznej strony PROFICAR → katalog dist/ (gotowy do wgrania na Hostinger).
// Uruchom: npm run build   (Node ≥ 18, bez zewnętrznych zależności)
import { readFile, writeFile, mkdir, rm, cp, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPage, esc } from "./templates/page.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const staticDir = join(root, "src", "static");

const readJson = async (p) => JSON.parse(await readFile(join(root, p), "utf8"));

async function hashDir(dir) {
  const h = createHash("sha256");
  const walk = async (d) => {
    for (const name of (await readdir(d)).sort()) {
      const p = join(d, name);
      if ((await stat(p)).isDirectory()) await walk(p);
      else h.update(await readFile(p));
    }
  };
  await walk(dir);
  return h.digest("hex").slice(0, 10);
}

const company = await readJson("data/company.json");
const gallery = await readJson("data/gallery.json");
const siteUrl = company.site.url.replace(/\/$/, "");
const build = await hashDir(join(staticDir, "assets"));
const today = new Date().toISOString().slice(0, 10);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(staticDir, dist, { recursive: true });

// index.html
const html = renderPage(company, gallery).replaceAll("__BUILD__", build);
await writeFile(join(dist, "index.html"), html);

// 404.html
const tel = `tel:${company.contact.phoneE164}`;
await writeFile(
  join(dist, "404.html"),
  `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nie znaleziono strony – ${esc(company.company.brand)}</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/styles.css?v=${build}">
</head>
<body>
  <main class="error-page">
    <div style="display:grid;gap:1.25rem;justify-items:center">
      <div class="error-page__code" aria-hidden="true">404</div>
      <h1 style="font-size:clamp(1.6rem,4vw,2.4rem)">Nie znaleziono tej strony</h1>
      <p style="color:var(--text-muted);margin:0">Strona mogła zostać przeniesiona. Wróć na stronę główną albo zadzwoń do warsztatu.</p>
      <div class="btn-row" style="justify-content:center">
        <a class="btn btn--primary" href="/">Strona główna</a>
        <a class="btn btn--ghost" href="${tel}">Zadzwoń: ${esc(company.contact.phoneDisplay)}</a>
      </div>
    </div>
  </main>
</body>
</html>
`
);

// sitemap.xml
await writeFile(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${today}</lastmod>
  </url>
</urlset>
`
);

// robots.txt
await writeFile(
  join(dist, "robots.txt"),
  `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
);

// site.webmanifest
await writeFile(
  join(dist, "site.webmanifest"),
  JSON.stringify(
    {
      name: `${company.company.brand} – warsztat samochodowy Gdańsk`,
      short_name: company.company.brand,
      start_url: "/",
      display: "browser",
      background_color: company.site.themeColor,
      theme_color: company.site.themeColor,
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2
  )
);

if (company.site.url.includes("TWOJA-DOMENA")) {
  console.warn("⚠  Uwaga: site.url w data/company.json to wciąż placeholder – uzupełnij domenę przed publikacją.");
}
console.log(`✓ Zbudowano dist/ (build ${build})`);
