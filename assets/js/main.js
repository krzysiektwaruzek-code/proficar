/* PROFICAR – skrypty strony (bez zależności, ~ES2018). */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nagłówek: tło po przewinięciu + pasek mobilny ---------- */
  const header = $(".site-header");
  const mobileBar = $(".mobile-bar");
  const hero = $(".hero");
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    header && header.classList.toggle("is-scrolled", y > 12);
    if (mobileBar && hero) {
      const show = y > hero.offsetHeight * 0.55;
      mobileBar.classList.toggle("is-visible", show);
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Menu mobilne ---------- */
  const toggle = $(".menu-toggle");
  const menu = $("#mobile-menu");
  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Zamknij menu" : "Otwórz menu");
      header.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(() => {
          menu.classList.add("is-open");
          const first = $("a", menu);
          first && first.focus({ preventScroll: true });
        });
      } else {
        menu.classList.remove("is-open");
        setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, reduceMotion ? 0 : 300);
      }
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setOpen(false); toggle.focus(); }
      // prosta pułapka fokusu w otwartym menu
      if (e.key === "Tab" && menu.classList.contains("is-open")) {
        const f = [toggle, ...$$("a, button", menu)];
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", (m) => { if (m.matches) setOpen(false); });
  }

  /* ---------- Aktywny link w nawigacji ---------- */
  const navLinks = $$(".nav__link");
  if ("IntersectionObserver" in window && navLinks.length) {
    const map = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          navLinks.forEach((a) => a.classList.remove("is-active"));
          const a = map.get(en.target.id);
          a && a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, id) => { const s = document.getElementById(id); s && io.observe(s); });
  }

  /* ---------- Status „otwarte teraz” (czas Europe/Warsaw) ---------- */
  const statusEl = $("[data-open-status]");
  const warsawNow = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Warsaw", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const days = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
    return { day: days[get("weekday")], minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10) };
  };
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const fmt = (t) => t.replace(/^0/, "");
  const dayNames = ["poniedziałek", "wtorek", "środę", "czwartek", "piątek", "sobotę", "niedzielę"];

  const updateStatus = () => {
    if (!statusEl) return;
    let hours;
    try { hours = JSON.parse(statusEl.dataset.hours); } catch (e) { return; }
    const { day, minutes } = warsawNow();
    const today = hours[day];
    const text = $(".status__text", statusEl);
    const todayEl = $("[data-open-today]");
    let state = "closed";
    let label;
    if (today.o && minutes >= toMin(today.o) && minutes < toMin(today.c)) {
      state = "open";
      label = `Otwarte do ${fmt(today.c)}`;
    } else {
      // najbliższe otwarcie
      let next = null;
      for (let i = 0; i < 7; i++) {
        const d = (day + i) % 7;
        const h = hours[d];
        if (!h.o) continue;
        if (i === 0 && minutes >= toMin(h.o)) continue;
        next = { i, d, h };
        break;
      }
      label = "Zamknięte";
      if (next) {
        const when = next.i === 0 ? "dziś" : next.i === 1 ? "jutro" : `w ${dayNames[next.d]}`;
        label = `Zamknięte · otwieramy ${when} ${fmt(next.h.o)}`;
      }
    }
    statusEl.dataset.state = state;
    text.textContent = label;
    if (todayEl) todayEl.textContent = today.o ? `Dziś ${fmt(today.o)}–${fmt(today.c)}` : "Dziś nieczynne";
    // podświetlenie dnia w tabeli godzin (data-day: 0 = niedziela)
    const jsDay = (day + 1) % 7;
    $$(".hours tr").forEach((tr) => tr.classList.toggle("is-today", Number(tr.dataset.day) === jsDay));
  };
  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$("[data-reveal]");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const ro = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); obs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el) => ro.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Mapa: ładowanie po kliknięciu (fasada) ---------- */
  const mapEl = $("[data-map]");
  const loadBtn = $("[data-map-load]");
  if (mapEl && loadBtn) {
    loadBtn.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = mapEl.dataset.src;
      iframe.title = "Mapa Google – lokalizacja warsztatu PROFICAR";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.setAttribute("allowfullscreen", "");
      mapEl.appendChild(iframe);
      const facade = $(".map__facade", mapEl);
      facade && facade.remove();
      iframe.focus();
    });
  }

  /* ---------- Formularz ----------
     Integracja: ustaw "form.endpoint" w data/company.json (np. /api/contact.php).
     Bez endpointu formularz NIE wysyła danych – przygotowuje SMS w telefonie użytkownika. */
  const form = $("#contact-form");
  if (form) {
    const status = $(".form__status", form);
    const setStatus = (msg, type = "") => { status.textContent = msg; status.dataset.type = type; };
    const fields = {
      name: $("#f-name", form),
      message: $("#f-msg", form),
    };
    const validate = () => {
      let ok = true;
      Object.entries(fields).forEach(([key, el]) => {
        const err = $(`#${el.id}-err`, form);
        const empty = !el.value.trim();
        el.setAttribute("aria-invalid", String(empty));
        if (empty) {
          el.setAttribute("aria-describedby", err.id);
          err.textContent = key === "name" ? "Podaj imię." : "Opisz krótko, czego potrzebujesz.";
          if (ok) el.focus();
          ok = false;
        } else {
          el.removeAttribute("aria-describedby");
          err.textContent = "";
        }
      });
      return ok;
    };
    const composeText = () => {
      const d = new FormData(form);
      const lines = [
        `Dzień dobry, tu ${String(d.get("name")).trim()}.`,
        `Usługa: ${d.get("service")}`,
        d.get("car") ? `Samochód: ${String(d.get("car")).trim()}` : "",
        d.get("date") ? `Preferowany termin: ${String(d.get("date")).trim()}` : "",
        `${String(d.get("message")).trim()}`,
      ];
      return lines.filter(Boolean).join("\n");
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("");
      if (!validate()) return;
      const endpoint = form.dataset.endpoint;

      if (endpoint) {
        // Wysyłka na serwer – komunikat sukcesu tylko przy faktycznej odpowiedzi 2xx.
        const btn = $('button[type="submit"]', form);
        btn.disabled = true;
        setStatus("Wysyłanie…");
        try {
          const res = await fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          setStatus("Dziękujemy – zapytanie zostało wysłane.", "ok");
        } catch (err) {
          setStatus("Nie udało się wysłać zapytania. Zadzwoń do nas bezpośrednio.", "error");
        } finally {
          btn.disabled = false;
        }
        return;
      }

      // Tryb SMS: otwiera aplikację wiadomości z gotową treścią (nic nie jest wysyłane przez stronę).
      const body = encodeURIComponent(composeText());
      window.location.href = `sms:${form.dataset.sms}?body=${body}`;
      setStatus("Otwieramy aplikację SMS z gotową wiadomością – wyślij ją ze swojego telefonu. Jeśli nic się nie otworzyło, użyj przycisku „Kopiuj treść”.");
    });

    const copyBtn = $("[data-copy]", form);
    copyBtn && copyBtn.addEventListener("click", async () => {
      if (!validate()) return;
      const text = composeText();
      try {
        await navigator.clipboard.writeText(text);
        setStatus("Treść skopiowana do schowka. Wyślij ją SMS-em na numer podany obok albo przeczytaj podczas rozmowy.", "ok");
      } catch (err) {
        setStatus("Nie udało się skopiować automatycznie. Zaznacz i skopiuj opis ręcznie.", "error");
      }
    });
  }

  /* ---------- Galeria: lightbox (tylko gdy są zdjęcia) ---------- */
  const dataEl = $("#gallery-data");
  const dlg = $(".lightbox");
  if (dataEl && dlg && typeof dlg.showModal === "function") {
    const items = JSON.parse(dataEl.textContent);
    const img = $("img", dlg);
    const cap = $(".lightbox__caption", dlg);
    let idx = 0;
    const show = (i) => {
      idx = (i + items.length) % items.length;
      img.src = items[idx].src;
      img.alt = items[idx].alt;
      cap.textContent = items[idx].caption;
    };
    $$("[data-lightbox]").forEach((b) => b.addEventListener("click", () => { show(Number(b.dataset.lightbox)); dlg.showModal(); }));
    $("[data-lb-close]", dlg).addEventListener("click", () => dlg.close());
    $("[data-lb-prev]", dlg).addEventListener("click", () => show(idx - 1));
    $("[data-lb-next]", dlg).addEventListener("click", () => show(idx + 1));
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    let x0 = null;
    dlg.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ---------- Rok w stopce ---------- */
  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
