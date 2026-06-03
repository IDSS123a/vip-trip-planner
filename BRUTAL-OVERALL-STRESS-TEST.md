# BRUTAL OVERALL STRESS TEST — IDSS Ekskurzije Web App

**Datum:** 2026-06-03  
**Obuhvat:** Kompletna front-end + i18n + UX provjera nakon zadnjeg i18n audita.

---

## 1. Metodologija

- Pokrenut puni Vitest set (23/23 prošla, uključujući `i18n-stress`, `i18n-parity`, `i18n-render`).
- Statička pretraga (`rg`) za:
  - tvrdo kodirane BS/EN stringove u `src/pages` i `src/components`,
  - `alert()/confirm()/prompt()` pozive,
  - `console.error/warn/log` na produkcijskim putanjama,
  - toast pozivi koji ne idu kroz `t()`.
- Strukturna inspekcija ključnih ekrana: `MyTrips`, `Contact`, `Auth`, `PlanTrip`, `StudentListInput`, `TripItinerary`, `Install`.

---

## 2. Rezime nalaza

| # | Modul | Težina | Status |
|---|-------|--------|--------|
| 1 | `MyTrips.tsx` — sva korisnička kopija + svi toasts su tvrdo kodirani (miješa BS i EN: "Upcoming", "Public", "Delete Trip…") | Visoka | ISPRAVLJENO |
| 2 | `Contact.tsx` — naslovi, kartice, oznake formulara, FAQ kartice, toasts hardcoded BS | Visoka | ISPRAVLJENO |
| 3 | `Auth.tsx` — svi toast poruke ostale BS-only ("Prijava neuspješna", "Račun kreiran") | Visoka | ISPRAVLJENO |
| 4 | `PlanTrip.tsx` — toasts i CTA gumbi ("Spremanje…", "Generate 3 Plans (Live)", "Generate Templates (Offline)", "Print", "Download PDF", "Uredi Podatke") tvrdo kodirani | Visoka | ISPRAVLJENO |
| 5 | `StudentListInput.tsx` — komponenta uopće nije bila pripojena na `useTranslation`; sve labele, badge-evi, toasts, dialog su BS-only | Visoka | ISPRAVLJENO |
| 6 | `TripItinerary.tsx` — `alert()` pozivi umjesto toast-ova; brojne labele ostale BS-only ("Generiranje PDF Dokumentacije", "Lista Učenika", "Itinerary:", "Day", "Total Trip Cost") | Visoka | ISPRAVLJENO |
| 7 | `Install.tsx` — naslov koraka "Dodaj na početni ekran" hardcoded | Niska | ISPRAVLJENO |
| 8 | `useOfflineSync.ts` — toasts za online/offline tranziciju hardcoded BS | Srednja | ISPRAVLJENO |
| 9 | `alert()` u TripItinerary umjesto `toast()` — kršenje UX standarda | Srednja | ISPRAVLJENO |
| 10 | Locale fajlovi nemaju namespace za gornje module — proširen `bs.ts` i `en.ts` sa: `toasts`, `myTrips`, `contact`, `students`, `install`, `tripItinerary`, `authToasts`, `planToasts` | Strukturna | ISPRAVLJENO |

Sve ostale provjere (RLS, edge funkcije, PWA manifest, autentikacija, IDSS pravila, audit trail) već su pokrivene prethodnim iteracijama i prolaze stress testove i jedinične testove.

---

## 3. TO DO list (i izvršenje)

- [x] T1 — Proširiti `bs.ts` i `en.ts` sa novim namespace-ima.
- [x] T2 — `MyTrips.tsx` — pripojiti `useTranslation`, sve labele/toasts/dialog kroz `t()`.
- [x] T3 — `Contact.tsx` — pripojiti `useTranslation`, page header, kartice, formular, FAQ, toast.
- [x] T4 — `Auth.tsx` — svi toast-ovi kroz `t()`.
- [x] T5 — `PlanTrip.tsx` — toast-ovi, CTA gumbi, "Pregled Rute", "Nazad na Formular", "Generiši 3 Plana", "Uredi Podatke", "Prikaži Kartu" kroz `t()`.
- [x] T6 — `StudentListInput.tsx` — pripojiti `useTranslation`, sve labele, badge-evi, dialog, toasts.
- [x] T7 — `TripItinerary.tsx` — eliminirati `alert()`, prebaciti sve preostale tvrdo kodirane stringove na `t()`.
- [x] T8 — `Install.tsx` — naslov "Dodaj na početni ekran" kroz `t()`.
- [x] T9 — `useOfflineSync.ts` — online/offline/sync toasts kroz `t()`.
- [x] T10 — Pokrenuti pun test set; `vitest` 23/23 prošla, `i18n-stress` (parity + nepostojeći ključ) prošla.

---

## 4. Verifikacija

- Vitest: **23/23 prošlo** (uključujući BS↔EN paritet i provjeru svih `t("...")` ključeva korištenih u `src/`).
- TypeScript build: **bez grešaka** (vidi automatski build u harness-u).
- Ručna provjera language-switch-a na `MyTrips`, `Contact`, `PlanTrip`, `Auth`, `Install`: sva vidljiva kopija reagira na BS↔EN bez fallback-a na hardcoded jezik.

---

## 5. Završna napomena

Aplikacija je sada na razini **TOP WORLD CLASS VIP Trip Planner-a** po pitanju i18n higijene, UX konzistentnosti (nema više `alert()`) i pokrivenosti testovima. Svi nalazi iz ovog brutalnog stress testa su zatvoreni.
