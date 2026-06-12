import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { detectPII, redactPlanPII, sanitizePlanSchema } from "./index.ts";

Deno.test("detectPII: clean plan returns no hits", () => {
  const r = detectPII({
    why_this_fits: "Plan ravnoteže cijene i kvaliteta.",
    accommodation_name: "Hotel Mostar",
    itinerary: [
      { day: 1, activities: [{ type: "activity", description: "Razgledanje Starog mosta.", location: "Mostar" }] },
    ],
  });
  assertEquals(r.found, false);
  assertEquals(r.matches.length, 0);
});

Deno.test("detectPII: personal name with title is detected", () => {
  const r = detectPII({
    itinerary: [
      { day: 1, activities: [{ description: "Vodič Gospodin Marko Marković će dočekati grupu." }] },
    ],
  });
  assertEquals(r.found, true);
});

Deno.test("detectPII: e-mail address is detected", () => {
  const r = detectPII({
    why_this_fits: "Kontakt vodiča: vodic.test@example.com za pitanja.",
  });
  assertEquals(r.found, true);
});

Deno.test("detectPII: BiH personal mobile is detected", () => {
  const r = detectPII({
    itinerary: [
      { day: 1, activities: [{ description: "Zovi vodiča na 061 123 456 ako se izgubiš." }] },
    ],
  });
  assertEquals(r.found, true);
});

Deno.test("detectPII: business landline (033/560-520) is NOT flagged", () => {
  const r = detectPII({
    accommodation_name: "Hotel Mostar",
    itinerary: [
      { day: 1, activities: [{ description: "Hotel recepcija. Tel: 033/560-520. Radno vrijeme: 0-24." }] },
    ],
  });
  assertEquals(r.found, false);
});

Deno.test("detectPII deep scan: PII hidden in day summary is detected", () => {
  const r = detectPII({
    itinerary: [
      { day: 1, summary: "Za sva pitanja kontaktirajte gospođa Amila Hodžić.", activities: [] },
    ],
  });
  assertEquals(r.found, true);
});

Deno.test("detectPII deep scan: e-mail in accommodation_address is detected", () => {
  const r = detectPII({
    accommodation_address: "Rezervacije: rezervacije.privatno@gmail.com",
  });
  assertEquals(r.found, true);
});

Deno.test("detectPII deep scan: mobile in activity address field is detected", () => {
  const r = detectPII({
    itinerary: [
      { day: 1, activities: [{ description: "Posjeta muzeju.", address: "Zvati 062 333 444 za ulaz" }] },
    ],
  });
  assertEquals(r.found, true);
});

Deno.test("detectPII: structured business phone field is exempt from phone pattern", () => {
  const r = detectPII({
    itinerary: [
      { day: 1, activities: [{ description: "Hotel check-in.", phone: "061 555 333" }] },
    ],
  });
  assertEquals(r.found, false);
});

Deno.test("redactPlanPII: scrubs e-mail, name and mobile from all text fields", () => {
  const out = redactPlanPII({
    why_this_fits: "Kontakt: vodic@example.com ili Gospodin Marko Marković na 061 123 456.",
    itinerary: [{ day: 1, activities: [{ description: "Zovi 062 111 222.", phone: "033 560 520" }] }],
  } as any) as any;
  assertEquals(out.why_this_fits.includes("@"), false);
  assertEquals(/06[0-9]/.test(out.itinerary[0].activities[0].description), false);
  // structured business phone field is preserved
  assertEquals(out.itinerary[0].activities[0].phone, "033 560 520");
  assertEquals(out.why_this_fits.includes("[uklonjeno]"), true);
});

Deno.test("sanitizePlanSchema: unknown fields invented by the model are dropped", () => {
  const out = sanitizePlanSchema({
    type: "Balanced",
    accommodation_name: "Hotel Mostar",
    guide_personal_contact: "Gospodin Marko, 061 123 456",
    itinerary: [
      { day: 1, title: "Dan 1", secret_note: "x", activities: [
        { time: "09:00", description: "Posjeta", contact_person: "Marko M.", lat: 43.3, lng: 17.8 },
      ]},
    ],
  });
  assertEquals("guide_personal_contact" in out, false);
  assertEquals("secret_note" in out.itinerary[0], false);
  assertEquals("contact_person" in out.itinerary[0].activities[0], false);
  assertEquals(out.itinerary[0].activities[0].lat, 43.3);
  assertEquals(out.accommodation_name, "Hotel Mostar");
});