import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { detectPII } from "./index.ts";

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