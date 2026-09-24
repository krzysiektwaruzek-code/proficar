# PROFICAR – strona internetowa

Strona warsztatu **PROFICAR** (mechanika pojazdowa, wymiana opon, klimatyzacja), ul. Jana Kochanowskiego 130, 80-405 Gdańsk.

Statyczny HTML + CSS + JS, bez frameworków i bez zależności npm. Generator (`src/build.mjs`) składa stronę
z danych firmy, więc telefon, adres i godziny edytujesz w jednym miejscu.

## Struktura

```
data/
  company.json      ← JEDNO ŹRÓDŁO danych firmy (telefon, adres, godziny, usługi, profile, domena)
  gallery.json      ← zdjęcia do galerii (tylko prawdziwe zdjęcia PROFICAR)
src/
  build.mjs         ← generator: dist/index.html, 404.html, sitemap.xml, robots.txt, manifest
  templates/
    page.mjs        ← szablon strony (sekcje, SEO, schema.org)
    icons.mjs       ← ikony SVG
  static/           ← pliki kopiowane 1:1 (CSS, JS, fonty, favicony, .htaccess)
scripts/
  render-images.mjs ← generuje favicony PNG i og-image.png (Playwright)
docs/
  RESEARCH.md       ← raport: źródła, dane potwierdzone i niepewne
dist/               ← wynik builda (to wgrywasz na serwer; nie jest trzymany w repo)
```

## Praca lokalna

```bash
npm run build     # generuje dist/
npm run serve     # podgląd na http://localhost:4173
```

Wymagany Node.js 18+.

## Najczęstsze zmiany

- **Telefon, adres, godziny, usługi** – `data/company.json`, potem `npm run build`.
- **Domena** – `site.url` w `data/company.json` (trafia do canonical, OG, sitemap, robots).
- **E-mail / NIP** – puste pola w `data/company.json`. Po uzupełnieniu pojawią się na stronie i w schema.org.
- **Zdjęcia** – wrzuć pliki do `src/static/assets/img/gallery/` (najlepiej `.avif` + `.webp` + `.jpg`,
  ok. 1600 px szerokości) i dopisz je do `items` w `data/gallery.json`. Lightbox włącza się automatycznie.
- **Formularz** – bez backendu przygotowuje SMS na numer warsztatu (nic nie wysyła przez internet).
  Po dodaniu skryptu wysyłki (np. `api/contact.php` na Hostingerze) wpisz jego adres w `form.endpoint`.

## Wdrożenie (Hostinger)

Na tym etapie strona nie jest publikowana. Po akceptacji: wgranie zawartości `dist/` do `public_html`
(ręcznie albo automatycznie przez GitHub Actions i FTP/SSH), podpięcie domeny i SSL, a potem odkomentowanie
przekierowania HTTPS w `src/static/.htaccess`.

## Licencje

Fonty Archivo i Inter – SIL Open Font License 1.1 (self-hosted, bez połączeń z Google Fonts).
