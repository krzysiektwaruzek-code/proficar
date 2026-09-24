// Szablon strony głównej PROFICAR.
// Wszystkie dane firmy pochodzą z data/company.json i data/gallery.json – nie wpisuj ich tutaj na sztywno.
import { icon, sprite } from "./icons.mjs";

export const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Grupuje dni o tych samych godzinach: „Pn–Pt 9:00–18:00”. */
export function hoursGroups(hours) {
  const fmt = (t) => t.replace(/^0/, "");
  const groups = [];
  for (const h of hours) {
    const key = h.open ? `${fmt(h.open)}–${fmt(h.close)}` : "nieczynne";
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.days.push(h);
    else groups.push({ key, days: [h] });
  }
  return groups.map((g) => ({
    label: g.days.length > 1 ? `${g.days[0].short}–${g.days[g.days.length - 1].short}` : g.days[0].short,
    labelLong: g.days.length > 1 ? `${g.days[0].day} – ${g.days[g.days.length - 1].day}` : g.days[0].day,
    value: g.key,
  }));
}

const yearsFrom = (iso) => new Date(iso).getFullYear();

export function renderPage(c, gallery) {
  const { site, company, contact, address, maps, hours, services, profiles } = c;
  const tel = `tel:${contact.phoneE164}`;
  const fullAddress = `${address.street}, ${address.postalCode} ${address.city}`;
  const mapsQuery = encodeURIComponent(maps.query);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${mapsQuery}`;
  const embedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const groups = hoursGroups(hours);
  const hoursShort = groups.filter((g) => g.value !== "nieczynne").map((g) => `${g.label} ${g.value}`).join(" · ");
  const since = yearsFrom(company.activeSince);
  const svc = Object.fromEntries(services.map((s) => [s.id, s]));
  const smsNumber = contact.phoneE164;
  const reviewProfiles = profiles.filter((p) => ["google", "fixly", "dobrymechanik"].includes(p.kind));

  const nav = [
    ["#uslugi", "Usługi"],
    ["#mechanika", "Mechanika"],
    ["#opony", "Opony"],
    ["#klimatyzacja", "Klimatyzacja"],
    ["#o-firmie", "O firmie"],
    ["#lokalizacja", "Dojazd"],
    ["#faq", "FAQ"],
    ["#kontakt", "Kontakt"],
  ];

  const faq = [
    {
      q: "Gdzie znajduje się warsztat PROFICAR?",
      a: `Warsztat PROFICAR mieści się pod adresem ${fullAddress}. Trasę dojazdu wyznaczysz jednym kliknięciem w sekcji „Dojazd”.`,
    },
    {
      q: "W jakich godzinach jest czynny warsztat?",
      a: `Od poniedziałku do piątku w godzinach 9:00–18:00, w soboty 9:00–12:00. W niedziele warsztat jest nieczynny.`,
    },
    {
      q: "Jak umówić wizytę?",
      a: `Najprościej telefonicznie pod numerem ${contact.phoneDisplay}, w godzinach pracy warsztatu. Opisz samochód i problem – ustalicie dogodny termin.`,
    },
    {
      q: "Czy warsztat jest otwarty w soboty?",
      a: "Tak, w soboty PROFICAR pracuje w godzinach 9:00–12:00.",
    },
    {
      q: "Jakie usługi wykonuje PROFICAR?",
      a: `Warsztat zajmuje się mechaniką pojazdową (w tym kompleksowymi naprawami samochodów), wymianą opon i wulkanizacją oraz serwisem klimatyzacji samochodowej.`,
    },
    {
      q: "Ile kosztuje naprawa lub wymiana opon?",
      a: `Na tej stronie nie publikujemy cennika. Koszt usługi zależy od samochodu i zakresu prac – zapytaj o niego telefonicznie pod numerem ${contact.phoneDisplay}.`,
    },
    {
      q: "Czy mogę wysłać zapytanie przez stronę?",
      a: c.form.endpoint
        ? "Tak – skorzystaj z formularza w sekcji „Kontakt”."
        : `Formularz w sekcji „Kontakt” przygotuje gotową wiadomość SMS na numer ${contact.phoneDisplay}, którą wyślesz ze swojego telefonu. Najszybszy kontakt to jednak rozmowa telefoniczna.`,
    },
  ];

  // --- JSON-LD (tylko potwierdzone dane) --------------------------------------
  const url = site.url.replace(/\/$/, "") + "/";
  const business = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "@id": `${url}#business`,
    name: company.brand,
    alternateName: company.legalName,
    description: site.description,
    url,
    telephone: contact.phoneE164,
    ...(contact.email ? { email: contact.email } : {}),
    image: url.replace(/\/$/, "") + site.ogImage,
    foundingDate: company.activeSince,
    founder: { "@type": "Person", name: company.owner },
    address: {
      "@type": "PostalAddress",
      streetAddress: address.street.replace(/^ul\.\s*/, "ul. "),
      postalCode: address.postalCode,
      addressLocality: address.city,
      addressRegion: address.region,
      addressCountry: address.country,
    },
    hasMap: maps.profileUrl,
    openingHoursSpecification: hours
      .filter((h) => h.open)
      .reduce((acc, h) => {
        const hit = acc.find((a) => a.opens === h.open && a.closes === h.close);
        if (hit) hit.dayOfWeek.push(h.schema);
        else acc.push({ "@type": "OpeningHoursSpecification", dayOfWeek: [h.schema], opens: h.open, closes: h.close });
        return acc;
      }, []),
    sameAs: profiles.filter((p) => p.kind !== "google").map((p) => p.url),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Usługi PROFICAR",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name, description: s.short },
      })),
    },
    ...(company.nip ? { taxID: company.nip } : {}),
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}#website`,
    url,
    name: company.brand,
    inLanguage: "pl-PL",
    publisher: { "@id": `${url}#business` },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;

  // --- Galeria ------------------------------------------------------------------
  const hasPhotos = gallery.items.length > 0;
  const showGallery = hasPhotos || gallery.showPlaceholders;
  const layoutCls = (l) => (l === "wide" ? " gallery__item--wide" : l === "tall" ? " gallery__item--tall" : "");
  const galleryItems = hasPhotos
    ? gallery.items
        .map(
          (g, i) => `
          <figure class="gallery__item${layoutCls(g.layout)}" data-reveal style="--delay:${(i % 4) * 0.06}s">
            <button class="gallery__btn" type="button" data-lightbox="${i}" aria-label="Powiększ zdjęcie: ${esc(g.alt)}">
              <picture>
                ${g.avif ? `<source srcset="${esc(g.avif)}" type="image/avif">` : ""}
                ${g.webp ? `<source srcset="${esc(g.webp)}" type="image/webp">` : ""}
                <img src="${esc(g.src)}" alt="${esc(g.alt)}" width="${g.width}" height="${g.height}" loading="lazy" decoding="async">
              </picture>
            </button>
            ${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ""}
          </figure>`
        )
        .join("")
    : gallery.placeholders
        .map(
          (p, i) => `
          <div class="gallery__item${layoutCls(p.layout)}" data-reveal style="--delay:${(i % 4) * 0.06}s">
            <div class="gallery__placeholder">${icon("image")}<span>Miejsce na zdjęcie:<br>${esc(p.label)}</span></div>
          </div>`
        )
        .join("");

  const hoursRows = hours
    .map(
      (h, i) =>
        `<tr data-day="${(i + 1) % 7}"><th scope="row">${h.day}</th><td>${h.open ? `${h.open.replace(/^0/, "")} – ${h.close.replace(/^0/, "")}` : "nieczynne"}</td></tr>`
    )
    .join("");

  const hoursData = esc(JSON.stringify(hours.map((h) => ({ o: h.open, c: h.close }))));

  const serviceCard = (s, i, id, cool = false) => `
        <article class="service-card${cool ? " service-card--cool" : ""}" data-reveal style="--delay:${i * 0.08}s">
          <span class="service-card__num" aria-hidden="true">0${i + 1}</span>
          <div class="icon-badge${cool ? " icon-badge--cool" : ""}">${icon(s.icon)}</div>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.short)}</p>
          <ul aria-label="Zakres: ${esc(s.name)}">${s.scope.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <a class="text-link" href="#${id}">Więcej o usłudze ${icon("arrow")}<span class="sr-only">: ${esc(s.name)}</span></a>
        </article>`;

  return `<!doctype html>
<html lang="${site.lang}" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(site.title)}</title>
  <meta name="description" content="${esc(site.description)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="${site.themeColor}">
  <meta name="format-detection" content="telephone=no">

  <meta property="og:type" content="website">
  <meta property="og:locale" content="${site.locale}">
  <meta property="og:site_name" content="${esc(company.brand)}">
  <meta property="og:title" content="${esc(site.title)}">
  <meta property="og:description" content="${esc(site.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${url.replace(/\/$/, "")}${site.ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="PROFICAR – mechanika pojazdowa, wymiana opon, klimatyzacja. Gdańsk, ul. Jana Kochanowskiego 130">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(site.title)}">
  <meta name="twitter:description" content="${esc(site.description)}">
  <meta name="twitter:image" content="${url.replace(/\/$/, "")}${site.ogImage}">

  <meta name="geo.region" content="PL-22">
  <meta name="geo.placename" content="${esc(address.city)}">

  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">

  <link rel="preload" href="/assets/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/styles.css?v=__BUILD__">
  <script>document.documentElement.classList.replace("no-js","js")</script>
  ${ld(business)}
  ${ld(website)}
  ${ld(faqLd)}
</head>
<body>
${sprite()}
<a class="skip-link" href="#main">Przejdź do treści</a>

<header class="site-header" id="top">
  <div class="container site-header__inner">
    <a class="brand" href="#top" aria-label="${esc(company.brand)} – strona główna">
      <span class="brand__mark" aria-hidden="true">P</span>
      <span class="brand__text">
        <span class="brand__name">${esc(company.brand)}</span>
        <span class="brand__sub">Warsztat · Gdańsk</span>
      </span>
    </a>

    <nav class="nav" aria-label="Główna nawigacja">
      <ul class="nav__list">
        ${nav.map(([h, l]) => `<li><a class="nav__link" href="${h}">${l}</a></li>`).join("")}
      </ul>
    </nav>

    <div class="header-actions">
      <a class="btn btn--primary header-call" href="${tel}" data-track="call-header">${icon("phone")}<span>${esc(contact.phoneDisplay)}</span></a>
      <a class="header-call-icon" href="${tel}" aria-label="Zadzwoń: ${esc(contact.phoneDisplay)}" data-track="call-header">${icon("phone")}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Otwórz menu">
        <span class="menu-toggle__bars" aria-hidden="true"><span></span><span></span><span></span></span>
      </button>
    </div>
  </div>
</header>

<div class="mobile-menu" id="mobile-menu" aria-label="Menu" hidden>
  <nav aria-label="Menu mobilne">
    <ul class="mobile-menu__list">
      ${nav.map(([h, l]) => `<li><a href="${h}">${l}${icon("arrow")}</a></li>`).join("")}
    </ul>
  </nav>
  <a class="btn btn--primary btn--lg btn--block" href="${tel}">${icon("phone")}Zadzwoń: ${esc(contact.phoneDisplay)}</a>
  <div class="mobile-menu__meta">
    <span><strong>${esc(address.street)}</strong>, ${esc(address.postalCode)} ${esc(address.city)}</span>
    <span>${esc(hoursShort)}</span>
  </div>
</div>

<main id="main">

  <!-- HERO ================================================================= -->
  <section class="hero" aria-labelledby="hero-title">
    <div class="container hero__grid">
      <div class="hero__content">
        <span class="eyebrow">Warsztat samochodowy · ${esc(address.city)}</span>
        <h1 id="hero-title">
          <span class="hero__brand">${esc(company.brand)}</span>
          <span class="hl">Mechanika pojazdowa,</span> wymiana opon i klimatyzacja w Gdańsku
        </h1>
        <p class="hero__lead">Warsztat przy <strong>${esc(address.street)}</strong>. Zadzwoń, opisz problem z samochodem i umów termin wizyty.</p>
        <div class="btn-row">
          <a class="btn btn--primary btn--lg" href="${tel}" data-track="call-hero">${icon("phone")}Zadzwoń: ${esc(contact.phoneDisplay)}</a>
          <a class="btn btn--ghost btn--lg" href="${directionsUrl}" target="_blank" rel="noopener" data-track="route-hero">${icon("route")}Wyznacz trasę</a>
        </div>
        <ul class="hero__tags" aria-label="Główne usługi">
          ${services.map((s) => `<li class="chip">${icon(s.icon)}${esc(s.name)}</li>`).join("")}
        </ul>
      </div>

      <div class="hero__visual">
        <svg class="hero__rings" viewBox="0 0 400 400" aria-hidden="true">
          <defs>
            <radialGradient id="hg" cx="50%" cy="50%" r="50%">
              <stop offset="0" stop-color="#ff5b1f" stop-opacity=".35"/>
              <stop offset=".6" stop-color="#ff5b1f" stop-opacity=".05"/>
              <stop offset="1" stop-color="#ff5b1f" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="hl" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#ff7a45"/>
              <stop offset="1" stop-color="#ff5b1f" stop-opacity=".2"/>
            </linearGradient>
          </defs>
          <circle cx="200" cy="200" r="190" fill="url(#hg)"/>
          <g class="spin" fill="none">
            <circle cx="200" cy="200" r="176" stroke="rgba(255,255,255,.14)" stroke-width="22" stroke-dasharray="7 9"/>
            <circle cx="200" cy="200" r="188" stroke="rgba(255,255,255,.12)" stroke-width="1"/>
            <circle cx="200" cy="200" r="164" stroke="rgba(255,255,255,.12)" stroke-width="1"/>
          </g>
          <g class="spin spin--rev" fill="none">
            <circle cx="200" cy="200" r="134" stroke="url(#hl)" stroke-width="2" stroke-dasharray="210 632" stroke-linecap="round"/>
            <circle cx="200" cy="200" r="120" stroke="rgba(255,255,255,.08)" stroke-width="1" stroke-dasharray="2 6"/>
          </g>
          <g fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1.5">
            <circle cx="200" cy="200" r="92"/>
            <circle cx="200" cy="200" r="40" stroke="rgba(255,91,31,.7)" stroke-width="2"/>
            <path d="M200 108v52M200 240v52M108 200h52M240 200h52M135 135l37 37M228 228l37 37M265 135l-37 37M172 228l-37 37"/>
          </g>
          <circle cx="200" cy="200" r="8" fill="#ff5b1f"/>
        </svg>

        <aside class="status-card" aria-label="Godziny otwarcia i adres">
          <div class="status-card__head">
            <span class="status" data-open-status data-hours="${hoursData}">
              <span class="status__dot" aria-hidden="true"></span>
              <span class="status__text">Godziny otwarcia</span>
            </span>
            <span class="status-card__today" data-open-today></span>
          </div>
          <div class="status-card__row">${icon("pin")}<span><strong>${esc(address.street)}</strong>${esc(address.postalCode)} ${esc(address.city)}</span></div>
          <div class="status-card__row">${icon("clock")}<span><strong>${esc(groups[0].label)}: ${esc(groups[0].value)}</strong>${groups
            .slice(1)
            .map((g) => `${esc(g.label)}: ${esc(g.value)}`)
            .join(" · ")}</span></div>
        </aside>
      </div>
    </div>
    <a class="hero__scroll" href="#fakty" aria-label="Przewiń do informacji"><span></span></a>
  </section>

  <!-- FAKTY ================================================================= -->
  <section class="section facts" id="fakty" aria-label="Najważniejsze informacje">
    <div class="container">
      <ul class="facts__list">
        <li class="facts__item">${icon("pin")}<div><span class="facts__label">Adres</span><span class="facts__value"><a href="${directionsUrl}" target="_blank" rel="noopener">${esc(address.streetShort)}, ${esc(address.city)}</a></span></div></li>
        <li class="facts__item">${icon("phone")}<div><span class="facts__label">Telefon</span><span class="facts__value"><a href="${tel}">${esc(contact.phoneDisplay)}</a></span></div></li>
        <li class="facts__item">${icon("clock")}<div><span class="facts__label">Godziny</span><span class="facts__value">${esc(hoursShort)}</span></div></li>
        <li class="facts__item">${icon("calendar")}<div><span class="facts__label">Działalność</span><span class="facts__value">od ${since} r.</span></div></li>
      </ul>
    </div>
  </section>

  <!-- USŁUGI ================================================================ -->
  <section class="section theme-light" id="uslugi" aria-labelledby="uslugi-title">
    <div class="container">
      <div class="section-head section-head--split">
        <div class="section-head" style="margin:0">
          <span class="eyebrow">Usługi</span>
          <h2 id="uslugi-title">Trzy obszary. Jeden warsztat.</h2>
        </div>
        <p>Mechanika, opony i klimatyzacja pod jednym adresem w Gdańsku – bez szukania kilku różnych serwisów dla jednego samochodu.</p>
      </div>
      <div class="services-grid">
        ${serviceCard(svc.mechanika, 0, "mechanika")}
        ${serviceCard(svc.opony, 1, "opony")}
        ${serviceCard(svc.klimatyzacja, 2, "klimatyzacja", true)}
      </div>
    </div>
  </section>

  <!-- MECHANIKA ============================================================= -->
  <section class="section" id="mechanika" aria-labelledby="mechanika-title">
    <div class="container feature">
      <div class="feature__body" data-reveal>
        <span class="eyebrow">01 · Mechanika pojazdowa</span>
        <h2 id="mechanika-title">Mechanika pojazdowa i kompleksowe naprawy</h2>
        <p>PROFICAR zajmuje się naprawami mechanicznymi samochodów – zarówno z silnikami benzynowymi, jak i diesla. Przyjedź z konkretną usterką albo z objawem, którego przyczyny nie znasz.</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="${tel}" data-track="call-mechanika">${icon("phone")}Umów naprawę</a>
          <a class="btn btn--ghost" href="#kontakt">Kontakt</a>
        </div>
      </div>
      <div class="feature__panel" data-reveal style="--delay:.1s">
        <h3>Zakres prac</h3>
        <ul class="check-list">
          ${svc.mechanika.scope.map((x) => `<li>${icon("check")}<span>${esc(x)}</span></li>`).join("")}
        </ul>
        <div class="note">${icon("info")}<p><strong>Opisz objawy przez telefon.</strong> Stuki, spadek mocy, kontrolka na desce – im więcej szczegółów podasz przy umawianiu wizyty, tym łatwiej zaplanować naprawę.</p></div>
      </div>
    </div>
  </section>

  <!-- OPONY ================================================================= -->
  <section class="section theme-light" id="opony" aria-labelledby="opony-title">
    <div class="container feature feature--reverse">
      <div class="feature__body" data-reveal>
        <span class="eyebrow">02 · Opony</span>
        <h2 id="opony-title">Wymiana opon i wulkanizacja</h2>
        <p>Sezonowa wymiana opon i usługi wulkanizacyjne wykonasz na miejscu, w warsztacie przy ${esc(address.streetShort)}. Jeśli przy okazji coś niepokoi Cię w samochodzie – mechanika działa pod tym samym adresem.</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="${tel}" data-track="call-opony">${icon("phone")}Umów wymianę opon</a>
        </div>
      </div>
      <div class="feature__panel" data-reveal style="--delay:.1s">
        <h3>W skrócie</h3>
        <div class="season">
          <div class="season__item">${icon("sun")}<strong>Wiosna</strong><span>Zmiana na opony letnie</span></div>
          <div class="season__item">${icon("leaf")}<strong>Jesień</strong><span>Zmiana na opony zimowe</span></div>
          <div class="season__item">${icon("tire")}<strong>Wymiana</strong><span>Na miejscu, ${esc(address.streetShort)}</span></div>
          <div class="season__item">${icon("layers")}<strong>Wulkanizacja</strong><span>Usługi wulkanizacyjne w warsztacie</span></div>
        </div>
        <div class="note">${icon("calendar")}<p><strong>Termin w sezonie?</strong> Wiosną i jesienią zainteresowanie wymianą opon jest największe – zadzwoń wcześniej, aby ustalić dogodną godzinę.</p></div>
      </div>
    </div>
  </section>

  <!-- KLIMATYZACJA ========================================================== -->
  <section class="section section--cool" id="klimatyzacja" aria-labelledby="klima-title">
    <div class="container feature">
      <div class="feature__body" data-reveal>
        <span class="eyebrow eyebrow--cool">03 · Klimatyzacja</span>
        <h2 id="klima-title">Serwis klimatyzacji samochodowej</h2>
        <p>Klimatyzacja to jeden z trzech głównych obszarów pracy PROFICAR. Jeżeli układ słabo chłodzi, nieprzyjemnie pachnie lub nie działa – zadzwoń i ustal zakres serwisu oraz termin.</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="${tel}" data-track="call-klima">${icon("phone")}Zapytaj o serwis klimatyzacji</a>
        </div>
      </div>
      <div class="feature__panel" data-reveal style="--delay:.1s">
        <h3>Zakres</h3>
        <ul class="check-list">
          ${svc.klimatyzacja.scope.map((x) => `<li>${icon("check")}<span>${esc(x)}</span></li>`).join("")}
        </ul>
        <div class="note">${icon("info")}<p><strong>Szczegóły ustalisz telefonicznie.</strong> Dokładny zakres prac przy klimatyzacji zależy od samochodu i objawów – dlatego nie publikujemy tu listy czynności ani cen.</p></div>
      </div>
    </div>
  </section>

  <!-- JAK UMÓWIĆ ============================================================ -->
  <section class="section theme-light" id="jak-umowic" aria-labelledby="proces-title">
    <div class="container">
      <div class="section-head">
        <span class="eyebrow">Wizyta krok po kroku</span>
        <h2 id="proces-title">Jak umówić wizytę?</h2>
      </div>
      <ol class="steps">
        <li class="step" data-reveal>
          <span class="step__num" aria-hidden="true">01</span>
          <h3>Zadzwoń</h3>
          <p>Numer <a href="${tel}">${esc(contact.phoneDisplay)}</a> – ${esc(hoursShort)}.</p>
        </li>
        <li class="step" data-reveal style="--delay:.08s">
          <span class="step__num" aria-hidden="true">02</span>
          <h3>Opisz samochód i problem</h3>
          <p>Marka, model i to, co się dzieje z autem – albo usługa, której potrzebujesz. Wspólnie ustalicie termin.</p>
        </li>
        <li class="step" data-reveal style="--delay:.16s">
          <span class="step__num" aria-hidden="true">03</span>
          <h3>Przyjedź do warsztatu</h3>
          <p>${esc(fullAddress)}. <a href="${directionsUrl}" target="_blank" rel="noopener">Wyznacz trasę</a>.</p>
        </li>
      </ol>
    </div>
  </section>

  <!-- O FIRMIE ============================================================== -->
  <section class="section" id="o-firmie" aria-labelledby="o-firmie-title">
    <div class="container">
      <div class="section-head section-head--split">
        <div class="section-head" style="margin:0">
          <span class="eyebrow">O firmie</span>
          <h2 id="o-firmie-title">PROFICAR – konkretnie</h2>
        </div>
        <p>Bez pustych haseł. Oto fakty o warsztacie, które możesz sprawdzić samodzielnie.</p>
      </div>
      <div class="about-grid">
        <article class="about-card" data-reveal>
          <div class="about-card__kpi">${since}<small> r.</small></div>
          <h3>Działalność od ${since} roku</h3>
          <p>Według danych z CEIDG firma ${esc(company.legalName)} rozpoczęła działalność we wrześniu ${since} r.</p>
        </article>
        <article class="about-card" data-reveal style="--delay:.06s">
          <div class="about-card__kpi">3<small> w 1</small></div>
          <h3>Trzy usługi w jednym miejscu</h3>
          <p>Mechanika pojazdowa, wymiana opon z wulkanizacją oraz klimatyzacja – pod jednym adresem.</p>
        </article>
        <article class="about-card" data-reveal style="--delay:.12s">
          <div class="about-card__kpi">Sob<small> 9–12</small></div>
          <h3>Otwarte także w soboty</h3>
          <p>Poza tygodniem roboczym (${esc(groups[0].label)} ${esc(groups[0].value)}) warsztat pracuje również w sobotnie przedpołudnia.</p>
        </article>
        <article class="about-card" data-reveal style="--delay:.18s">
          <div class="about-card__kpi">${reviewProfiles.length}<small> profile</small></div>
          <h3>Opinie do sprawdzenia</h3>
          <p>Oceny klientów przeczytasz w niezależnych serwisach: ${reviewProfiles.map((p) => esc(p.name)).join(", ")}.</p>
        </article>
      </div>
      <p class="source-note">Źródło daty rozpoczęcia działalności: Centralna Ewidencja i Informacja o Działalności Gospodarczej (CEIDG).</p>
    </div>
  </section>

  ${
    showGallery
      ? `<!-- GALERIA ============================================================== -->
  <section class="section" id="galeria" aria-labelledby="galeria-title" style="padding-top:0">
    <div class="container">
      <div class="section-head">
        <span class="eyebrow">Galeria</span>
        <h2 id="galeria-title">Warsztat PROFICAR</h2>
      </div>
      <div class="gallery">${galleryItems}
      </div>
      ${
        hasPhotos
          ? ""
          : `<p class="gallery-note">${icon("info")}<span>Galeria czeka na prawdziwe zdjęcia warsztatu. Nie publikujemy tu zdjęć stockowych ani generowanych – pokażemy wyłącznie PROFICAR.</span></p>`
      }
    </div>
  </section>`
      : ""
  }

  <!-- OPINIE ================================================================ -->
  <section class="section theme-light" id="opinie" aria-labelledby="opinie-title">
    <div class="container">
      <div class="section-head section-head--split">
        <div class="section-head" style="margin:0">
          <span class="eyebrow">Opinie klientów</span>
          <h2 id="opinie-title">Sprawdź opinie u źródła</h2>
        </div>
        <p>Nie wybieramy dla Ciebie „najlepszych” recenzji. Przeczytaj wszystkie opinie o PROFICAR bezpośrednio w serwisach, w których wystawili je klienci.</p>
      </div>
      <div class="reviews">
        ${reviewProfiles
          .map(
            (p, i) => `
        <a class="review-source" href="${esc(p.url)}" target="_blank" rel="noopener" data-reveal style="--delay:${i * 0.08}s">
          <span class="review-source__top">
            <span class="review-source__logo" aria-hidden="true">${esc(p.name.charAt(0))}</span>
          </span>
          <span class="review-source__name">${esc(p.name)}</span>
          <p>${
            p.kind === "google"
              ? "Profil firmy w Mapach Google – opinie, zdjęcia dodane przez użytkowników i wskazówki dojazdu."
              : p.kind === "fixly"
              ? "Profil PROFICAR Sebastian Gąsiewski w serwisie Fixly z opiniami zleceniodawców."
              : "Wizytówka warsztatu w serwisie DobryMechanik.pl z ocenami klientów."
          }</p>
          <span class="text-link">Zobacz opinie ${icon("external")}<span class="sr-only">(otwiera się w nowej karcie)</span></span>
        </a>`
          )
          .join("")}
      </div>
    </div>
  </section>

  <!-- LOKALIZACJA =========================================================== -->
  <section class="section theme-light" id="lokalizacja" aria-labelledby="lokalizacja-title" style="padding-top:0">
    <div class="container">
      <div class="section-head">
        <span class="eyebrow">Dojazd</span>
        <h2 id="lokalizacja-title">Warsztat samochodowy przy ul. Kochanowskiego w Gdańsku</h2>
      </div>
      <div class="location">
        <div class="map" data-map data-src="${esc(embedUrl)}">
          <div class="map__facade">
            <span class="map__pin">${icon("pin")}</span>
            <span class="map__addr">${esc(address.streetShort)}</span>
            <button class="btn btn--light" type="button" data-map-load>${icon("map")}Pokaż mapę Google</button>
            <p>Mapa ładuje się dopiero po kliknięciu – do tego momentu Google nie otrzymuje żadnych danych.</p>
          </div>
        </div>
        <div class="card location__card">
          <address class="location__addr">
            <strong>${esc(company.brand)}</strong>
            ${esc(address.street)}<br>${esc(address.postalCode)} ${esc(address.city)}
          </address>
          <div class="location__btns">
            <a class="btn btn--primary" href="${directionsUrl}" target="_blank" rel="noopener" data-track="route-location">${icon("route")}Nawiguj do warsztatu</a>
            <a class="btn btn--ghost" href="${esc(maps.profileUrl)}" target="_blank" rel="noopener">${icon("pin")}Google Maps</a>
            <a class="btn btn--ghost" href="${appleMapsUrl}" target="_blank" rel="noopener">${icon("map")}Mapy Apple</a>
          </div>
          <div class="note">${icon("clock")}<p><strong>${esc(hoursShort)}</strong><br>Niedziela: nieczynne</p></div>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ =================================================================== -->
  <section class="section theme-light" id="faq" aria-labelledby="faq-title" style="padding-top:0">
    <div class="container">
      <div class="section-head">
        <span class="eyebrow">FAQ</span>
        <h2 id="faq-title">Najczęstsze pytania</h2>
      </div>
      <div class="faq">
        ${faq
          .map(
            (f, i) => `
        <details${i === 0 ? " open" : ""}>
          <summary>${esc(f.q)}</summary>
          <div class="faq__answer"><p>${esc(f.a)}</p></div>
        </details>`
          )
          .join("")}
      </div>
    </div>
  </section>

  <!-- KONTAKT =============================================================== -->
  <section class="section" id="kontakt" aria-labelledby="kontakt-title">
    <div class="container">
      <div class="section-head">
        <span class="eyebrow">Kontakt</span>
        <h2 id="kontakt-title">Zadzwoń i umów wizytę</h2>
        <p>Telefon to najszybsza droga do terminu w PROFICAR.</p>
      </div>

      <div class="contact">
        <div class="contact__side">
          <div class="contact-call" data-reveal>
            <h3>Telefon do warsztatu</h3>
            <a class="contact-call__phone" href="${tel}" data-track="call-contact">${esc(contact.phoneDisplay)}</a>
            <p>Zadzwoń w godzinach pracy warsztatu: ${esc(hoursShort)}.</p>
            <div><a class="btn btn--lg" href="${tel}" data-track="call-contact-btn">${icon("phone")}Zadzwoń teraz</a></div>
          </div>

          <div class="card" data-reveal>
            <div class="contact-info">
              <div class="contact-info__row">${icon("pin")}<div><strong>Adres</strong><span>${esc(fullAddress)}</span></div></div>
              ${
                contact.email
                  ? `<div class="contact-info__row">${icon("message")}<div><strong>E-mail</strong><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div></div>`
                  : ""
              }
              <table class="hours">
                <caption class="sr-only">Godziny otwarcia warsztatu PROFICAR</caption>
                <tbody>${hoursRows}</tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card" data-reveal style="--delay:.1s">
          <h3 style="margin-bottom:.4rem">Zapytanie o wizytę</h3>
          <p style="color:var(--text-muted);margin-bottom:1.4rem">Wolisz napisać? Wypełnij formularz – przygotujemy gotową wiadomość.</p>
          <form class="form" id="contact-form" novalidate data-endpoint="${esc(c.form.endpoint)}" data-sms="${esc(smsNumber)}">
            <div class="form__row">
              <div class="field">
                <label for="f-name">Imię</label>
                <input id="f-name" name="name" type="text" autocomplete="given-name" required maxlength="60">
                <span class="field__error" id="f-name-err" aria-live="polite"></span>
              </div>
              <div class="field">
                <label for="f-car">Samochód <span class="opt">(marka, model)</span></label>
                <input id="f-car" name="car" type="text" autocomplete="off" maxlength="80" placeholder="np. Škoda Octavia 2016">
              </div>
            </div>
            <div class="form__row">
              <div class="field">
                <label for="f-service">Usługa</label>
                <select id="f-service" name="service">
                  ${services.map((s) => `<option>${esc(s.name)}</option>`).join("")}
                  <option>Inne / nie wiem</option>
                </select>
              </div>
              <div class="field">
                <label for="f-date">Preferowany termin <span class="opt">(opcjonalnie)</span></label>
                <input id="f-date" name="date" type="text" maxlength="60" placeholder="np. wtorek po 14:00">
              </div>
            </div>
            <div class="field">
              <label for="f-msg">Opis problemu</label>
              <textarea id="f-msg" name="message" required maxlength="800" placeholder="Co się dzieje z samochodem lub czego potrzebujesz?"></textarea>
              <span class="field__error" id="f-msg-err" aria-live="polite"></span>
            </div>
            ${
              c.form.endpoint
                ? ""
                : `<div class="form__info">${icon("info")}<span><strong>Jak to działa?</strong> Formularz nie wysyła danych przez internet. Po kliknięciu przycisku otworzy się aplikacja SMS z gotową wiadomością na numer ${esc(contact.phoneDisplay)} – wyślesz ją samodzielnie. Na komputerze możesz skopiować treść.</span></div>`
            }
            <div class="form__actions">
              <button class="btn btn--primary btn--lg" type="submit">${icon(c.form.endpoint ? "arrow" : "message")}${c.form.endpoint ? "Wyślij zapytanie" : "Przygotuj SMS"}</button>
              ${c.form.endpoint ? "" : `<button class="btn btn--ghost btn--lg" type="button" data-copy>${icon("copy")}Kopiuj treść</button>`}
            </div>
            <p class="form__status" role="status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA =================================================================== -->
  <section class="section section--tight" aria-label="Szybki kontakt" style="padding-top:0">
    <div class="container">
      <div class="cta-band" data-reveal>
        <div>
          <h2>Samochód do naprawy, opony do zmiany?</h2>
          <p>${esc(company.brand)} · ${esc(fullAddress)} · ${esc(hoursShort)}</p>
        </div>
        <div class="btn-row">
          <a class="btn btn--primary btn--lg" href="${tel}" data-track="call-cta">${icon("phone")}${esc(contact.phoneDisplay)}</a>
          <a class="btn btn--ghost btn--lg" href="${directionsUrl}" target="_blank" rel="noopener">${icon("route")}Trasa</a>
        </div>
      </div>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col footer-brand">
        <a class="brand" href="#top" aria-label="${esc(company.brand)} – powrót na górę">
          <span class="brand__mark" aria-hidden="true">P</span>
          <span class="brand__text"><span class="brand__name">${esc(company.brand)}</span><span class="brand__sub">Warsztat · Gdańsk</span></span>
        </a>
        <p>Warsztat samochodowy w Gdańsku: mechanika pojazdowa, wymiana opon i wulkanizacja, klimatyzacja.</p>
      </div>
      <div class="footer-col">
        <h2>Kontakt</h2>
        <address>
          ${esc(address.street)}<br>${esc(address.postalCode)} ${esc(address.city)}<br>
          <a href="${tel}">tel. ${esc(contact.phoneDisplay)}</a>
          ${contact.email ? `<br><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>` : ""}
        </address>
      </div>
      <div class="footer-col">
        <h2>Godziny otwarcia</h2>
        <dl class="footer-hours">
          ${groups.map((g) => `<dt>${esc(g.label)}</dt><dd>${esc(g.value)}</dd>`).join("")}
        </dl>
      </div>
      <div class="footer-col">
        <h2>Znajdziesz nas</h2>
        <ul>
          ${profiles.map((p) => `<li><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a></li>`).join("")}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>${new Date().getFullYear()}</span> ${esc(company.legalName)}${company.nip ? ` · NIP ${esc(company.nip)}` : ""}</span>
      <span>Strona nie zapisuje plików cookies. <a href="#top">Do góry ↑</a></span>
    </div>
  </div>
</footer>

<aside class="mobile-bar" aria-label="Szybki kontakt">
  <a class="btn btn--primary" href="${tel}" data-track="call-mobilebar">${icon("phone")}Zadzwoń</a>
  <a class="btn btn--ghost" href="${directionsUrl}" target="_blank" rel="noopener" data-track="route-mobilebar">${icon("route")}Dojazd</a>
</aside>

${
  hasPhotos
    ? `<dialog class="lightbox" aria-label="Podgląd zdjęcia">
  <button class="lightbox__close" type="button" data-lb-close aria-label="Zamknij">${icon("close")}</button>
  <button class="lightbox__nav lightbox__nav--prev" type="button" data-lb-prev aria-label="Poprzednie zdjęcie">${icon("chevronLeft")}</button>
  <img alt="">
  <button class="lightbox__nav lightbox__nav--next" type="button" data-lb-next aria-label="Następne zdjęcie">${icon("chevronRight")}</button>
  <p class="lightbox__caption"></p>
</dialog>
<script type="application/json" id="gallery-data">${JSON.stringify(gallery.items.map((g) => ({ src: g.src, alt: g.alt, caption: g.caption || "" }))).replace(/</g, "\\u003c")}</script>`
    : ""
}

<script src="/assets/js/main.js?v=__BUILD__" defer></script>
</body>
</html>
`;
}
