import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { generateFallbackPlan, buildTravelLeg } from "./index.ts";

function makeCtx(city: string, lat: number, lng: number, suffix: string) {
  const poi = (name: string, kind: string) => ({ name, kind, lat, lng, address: `${name} adresa, ${city}` });
  return {
    city, lat, lng,
    museums: [poi(`Muzej ${suffix}`, "museums")],
    attractions: [poi(`Znamenitost ${suffix}`, "attractions")],
    restaurants: [poi(`Restoran ${suffix} 1`, "restaurants"), poi(`Restoran ${suffix} 2`, "restaurants")],
    hotels: [poi(`Hotel ${suffix}`, "hotels")],
    culture: [],
  };
}

const baseTrip = {
  departureCity: "Sarajevo",
  destinations: ["Pariz"],
  departureAddress: "Aerodrom Sarajevo, Kurta Schorka 36",
  tripType: "ekskurzija",
  gradeLevel: "8",
  studentCount: 20,
  chaperones: [],
  transport: "plane",
  departureDate: "2026-06-20",
  returnDate: "2026-06-24",
  educationalFocus: "",
  specialNeeds: "",
} as any;

const ctxs = [makeCtx("Sarajevo", 43.85, 18.41, "SA"), makeCtx("Pariz", 48.85, 2.35, "PA")] as any;

Deno.test("fallback engine: plane travel has NO bus-style technical pauses", () => {
  const plan = generateFallbackPlan(baseTrip, ctxs, 5, "Balanced");
  const day1 = plan.itinerary[0];
  const travel = day1.activities.find((a: any) => a.type === "travel");
  assertStringIncludes(travel.description, "Let Sarajevo → Pariz");
  assertEquals(/tehnička pauza/i.test(travel.description), false);
});

Deno.test("fallback engine: day 1 activities are in the DESTINATION, not the departure city", () => {
  const plan = generateFallbackPlan(baseTrip, ctxs, 5, "Balanced");
  const day1 = plan.itinerary[0];
  const nonTravel = day1.activities.filter((a: any) => a.type !== "travel" && !/Okupljanje/.test(a.description));
  assertEquals(nonTravel.length > 0, true);
  for (const a of nonTravel) {
    assertEquals(/\bSA\b|u Sarajevo/.test(`${a.location} ${a.description}`), false);
  }
  // Lunch uses a Paris POI
  const lunch = day1.activities.find((a: any) => a.type === "meal");
  assertStringIncludes(lunch.location, "PA");
});

Deno.test("fallback engine: bus travel keeps the mandated technical pauses (Član 15)", () => {
  const plan = generateFallbackPlan({ ...baseTrip, transport: "bus" }, ctxs, 3, "Budget");
  const travel = plan.itinerary[0].activities.find((a: any) => a.type === "travel");
  assertStringIncludes(travel.description, "Tehnička pauza svakih 2 sata");
});

Deno.test("fallback engine: meeting point uses the user's departure address verbatim", () => {
  const plan = generateFallbackPlan(baseTrip, ctxs, 5, "Balanced");
  const meet = plan.itinerary[0].activities[0];
  assertStringIncludes(meet.location, "Aerodrom Sarajevo");
});

Deno.test("fallback engine: day trip happens at the final destination with direct return", () => {
  const plan = generateFallbackPlan({ ...baseTrip, transport: "bus", returnDate: "2026-06-20" }, ctxs, 1, "Budget");
  const day1 = plan.itinerary[0];
  const accommodation = day1.activities.filter((a: any) => a.type === "accommodation");
  assertEquals(accommodation.length, 0);
  const travels = day1.activities.filter((a: any) => a.type === "travel");
  assertEquals(travels.length, 2); // out + return
  const lunch = day1.activities.find((a: any) => a.type === "meal");
  assertStringIncludes(lunch.location, "PA");
});

Deno.test("buildTravelLeg: each transport mode gets a sensible description", () => {
  assertEquals(/aerodrom/i.test(buildTravelLeg("plane", "A", "B").description), true);
  assertEquals(/vozom/i.test(buildTravelLeg("train", "A", "B").description), true);
  assertEquals(/autobusom/i.test(buildTravelLeg("bus", "A", "B").description), true);
});