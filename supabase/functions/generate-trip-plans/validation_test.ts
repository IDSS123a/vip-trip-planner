import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validatePlanOvernights } from "./index.ts";

// Helper to make a minimal plan object
function makePlan(opts: {
  accommodation_address?: string;
  accommodation_name?: string;
  itinerary?: Array<{ day: number; activities: Array<{ type?: string; description?: string; location?: string }> }>;
  type?: string;
}) {
  return {
    type: opts.type ?? "Balanced",
    accommodation_name: opts.accommodation_name ?? "",
    accommodation_address: opts.accommodation_address ?? "",
    itinerary: opts.itinerary ?? [],
  };
}

Deno.test("valid plan: all overnights in final destination", () => {
  const plan = makePlan({
    accommodation_name: "Hotel Mostar",
    accommodation_address: "Mostar, Bosna i Hercegovina",
    itinerary: [
      { day: 1, activities: [
        { type: "travel", description: "Polazak iz Sarajeva" },
        { type: "meal", description: "Ručak u Konjicu" },
        { type: "accommodation", description: "Check-in Hotel Mostar", location: "Mostar" },
      ]},
      { day: 2, activities: [
        { type: "activity", description: "Razgledanje Starog mosta", location: "Mostar" },
      ]},
    ],
  });
  const r = validatePlanOvernights(plan, "Mostar", ["Konjic"], 1);
  assertEquals(r.ok, true);
  assertEquals(r.violations.length, 0);
});

Deno.test("invalid plan: overnight in intermediate stop is detected", () => {
  const plan = makePlan({
    accommodation_name: "Hotel Konjic",
    accommodation_address: "Konjic centar",
    itinerary: [
      { day: 1, activities: [
        { type: "accommodation", description: "Noćenje u hotelu", location: "Konjic" },
      ]},
    ],
  });
  const r = validatePlanOvernights(plan, "Mostar", ["Konjic"], 1);
  assertEquals(r.ok, false);
  assertEquals(r.overnightStops.includes("Konjic"), true);
});

Deno.test("invalid plan: overnight described in text in intermediate", () => {
  const plan = makePlan({
    accommodation_address: "Mostar",
    itinerary: [
      { day: 1, activities: [
        { type: "activity", description: "Spavanje u hostelu Jajce nakon obilaska", location: "Jajce" },
      ]},
    ],
  });
  const r = validatePlanOvernights(plan, "Mostar", ["Jajce", "Konjic"], 2);
  assertEquals(r.ok, false);
});

Deno.test("multiple intermediate stops: none may have overnight", () => {
  const plan = makePlan({
    accommodation_address: "Dubrovnik",
    itinerary: [
      { day: 1, activities: [{ type: "meal", description: "Ručak u Mostaru" }]},
      { day: 2, activities: [{ type: "activity", description: "Razgledanje Trebinja" }]},
      { day: 3, activities: [{ type: "accommodation", description: "Check-in u Dubrovniku", location: "Dubrovnik" }]},
    ],
  });
  const r = validatePlanOvernights(plan, "Dubrovnik", ["Mostar", "Trebinje"], 2);
  assertEquals(r.ok, true);
});

Deno.test("day trip (0 nights): no accommodation activity allowed", () => {
  const plan = makePlan({
    itinerary: [
      { day: 1, activities: [
        { type: "travel", description: "Polazak" },
        { type: "accommodation", description: "Hotel Vrelo Bosne" },
      ]},
    ],
  });
  const r = validatePlanOvernights(plan, "Vrelo Bosne", [], 0);
  assertEquals(r.ok, false);
});

Deno.test("day trip (0 nights): clean plan passes", () => {
  const plan = makePlan({
    itinerary: [
      { day: 1, activities: [
        { type: "travel", description: "Polazak iz Sarajeva" },
        { type: "activity", description: "Šetnja Vrelom Bosne" },
        { type: "meal", description: "Ručak u restoranu" },
        { type: "travel", description: "Povratak" },
      ]},
    ],
  });
  const r = validatePlanOvernights(plan, "Vrelo Bosne", [], 0);
  assertEquals(r.ok, true);
});

Deno.test("long route (5 stops): only last has overnights", () => {
  const plan = makePlan({
    accommodation_address: "Beč, Austrija",
    itinerary: [
      { day: 1, activities: [{ type: "meal", description: "Pauza Zagreb" }]},
      { day: 2, activities: [{ type: "activity", description: "Obilazak Ljubljane" }]},
      { day: 3, activities: [{ type: "meal", description: "Ručak Graz" }]},
      { day: 4, activities: [{ type: "accommodation", description: "Hotel u Beču", location: "Beč" }]},
      { day: 5, activities: [{ type: "activity", description: "Schönbrunn obilazak" }]},
    ],
  });
  const r = validatePlanOvernights(plan, "Beč", ["Zagreb", "Ljubljana", "Graz"], 3);
  assertEquals(r.ok, true, JSON.stringify(r.violations));
});
