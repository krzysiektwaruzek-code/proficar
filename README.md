# PROFICAR – strona internetowa

Strona warsztatu **PROFICAR** (mechanika pojazdowa, wymiana opon, klimatyzacja), ul. Jana Kochanowskiego 130, 80-405 Gdańsk.

Czysty HTML + CSS i jeden mały plik JavaScript, bez frameworków i bez instalowania czegokolwiek.
Zawartość repozytorium to gotowa strona: wystarczy wgrać ją do `public_html` na Hostingerze.

## Struktura

```
index.html            ← strona główna (cała treść, SEO, schema.org)
404.html              ← strona błędu
assets/css/styles.css ← wygląd strony
assets/js/main.js     ← menu mobilne, status „Otwarte/Zamknięte”, mapa, formularz, galeria
assets/fonts/         ← fonty Archivo i Inter (hostowane lokalnie)
assets/img/           ← grafika OG; w gallery/ trafią prawdziwe zdjęcia warsztatu
favicon.svg, *.png    ← ikony strony
robots.txt, sitemap.xml, site.webmanifest, .htaccess
docs/RESEARCH.md      ← raport: źródła, dane potwierdzone i niepewne
```

## Podgląd lokalny

Otwórz `index.html` w przeglądarce albo uruchom prosty serwer w katalogu projektu:

```bash
npx serve . -l 4173        # potem http://localhost:4173
# lub: python3 -m http.server 4173
```

## Najczęstsze zmiany

- **Telefon, adres, godziny** – występują w `index.html` w kilku miejscach (treść, stopka, schema.org
  w `<script type="application/ld+json">`). Użyj „Znajdź i zamień” w edytorze.
  Status „Otwarte teraz” czyta godziny z atrybutu `data-hours` w `index.html`.
- **Domena** – zamień `https://TWOJA-DOMENA.pl` w `index.html`, `sitemap.xml` i `robots.txt`.
- **Zdjęcia** – tylko prawdziwe zdjęcia PROFICAR, do `assets/img/gallery/` (najlepiej `.webp` / `.avif`),
  i wstaw je w sekcji `id="galeria"` w `index.html` zamiast bloków „Miejsce na zdjęcie”.
- **Formularz** – bez backendu przygotowuje SMS na numer warsztatu (nic nie wysyła przez internet).
  Po dodaniu skryptu wysyłki (np. `api/contact.php`) wpisz jego adres w atrybucie `data-endpoint` formularza.

## Wdrożenie (Hostinger – Git)

Strona wdraża się automatycznie z gałęzi `main`.

1. hPanel → Strony → Zarządzaj → **Zaawansowane → GIT**.
2. Repozytorium: `https://github.com/krzysiektwaruzek-code/proficar.git`, gałąź: `main`,
   katalog: puste pole (czyli `public_html`). Katalog `public_html` musi być wcześniej pusty
   (usuń `default.php` w Menedżerze plików).
3. **Utwórz**, potem **Wdróż**.
4. **Auto Deployment** → skopiuj adres webhooka → GitHub: Settings → Webhooks → Add webhook
   (Payload URL = skopiowany adres, Content type `application/json`, zdarzenie: push).

Po podpięciu właściwej domeny:
- zamień `https://TWOJA-DOMENA.pl` w `index.html`, `sitemap.xml`, `robots.txt`,
- w `index.html` zmień `noindex, follow` na `index, follow, max-image-preview:large`,
- włącz SSL w hPanel i odkomentuj przekierowanie HTTPS w `.htaccess`.

`.htaccess` blokuje dostęp do `.git`, `README.md` i `docs/` (Hostinger klonuje całe repo do `public_html`).

## Licencje

Fonty Archivo i Inter – SIL Open Font License 1.1.
