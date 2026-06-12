import { describe, it, expect } from "vitest";
import {
  scanPlanForPii,
  redactPlanPii,
  redactPiiText,
  PII_FALLBACK_REASON,
} from "@/lib/piiGuard";

const cleanPlan = {
  why_this_fits: "Plan ravnoteže cijene i kvaliteta.",
  accommodation_info: "Hotel Mostar · Tel: 033/560-520",
  itinerary: [
    {
      day: 1,
      title: "Polazak — Pariz",
      activities: [
        { time: "07:00", description: "Okupljanje na Aerodromu Sarajevo.", location: "Aerodrom Sarajevo", phone: "033 289 100" },
      ],
    },
  ],
};

describe("PDF PII guard", () => {
  it("clean plan with business contacts produces no hits", () => {
    expect(scanPlanForPii(cleanPlan)).toHaveLength(0);
  });

  it("detects personal name with title, e-mail and personal mobile anywhere in the plan", () => {
    const dirty = {
      ...cleanPlan,
      itinerary: [
        {
          day: 1,
          title: "Dan 1",
          activities: [
            { time: "09:00", description: "Vodič Gospodin Marko Marković, zovite 061 123 456.", notes: "mail: vodic@example.com" },
          ],
        },
      ],
    };
    const hits = scanPlanForPii(dirty);
    const kinds = hits.map((h) => h.kind).sort();
    expect(kinds).toContain("name");
    expect(kinds).toContain("email");
    expect(kinds).toContain("phone");
  });

  it("structured business phone field is exempt from the mobile pattern", () => {
    const plan = { itinerary: [{ day: 1, activities: [{ description: "Check-in.", phone: "061 555 333" }] }] };
    expect(scanPlanForPii(plan)).toHaveLength(0);
  });

  it("does not re-trigger on server validation_report diagnostics", () => {
    const plan = {
      ...cleanPlan,
      validation_report: { user_issues: ['lično ime sa titulom ("Gospodin Marko Marković")'], fallback_reason: "pii_detected" },
    };
    expect(scanPlanForPii(plan)).toHaveLength(0);
  });

  it("redacts every PII match with [uklonjeno] while keeping business data", () => {
    const dirty = {
      why_this_fits: "Kontakt: vodic@example.com ili Gospodin Marko Marković na 061 123 456.",
      itinerary: [{ day: 1, activities: [{ description: "Zovi 062 111 222.", phone: "033 560 520" }] }],
    };
    const out: any = redactPlanPii(dirty);
    expect(out.why_this_fits).not.toMatch(/@|Gospodin|06\d/);
    expect(out.why_this_fits).toContain("[uklonjeno]");
    expect(out.itinerary[0].activities[0].description).not.toMatch(/06\d/);
    expect(out.itinerary[0].activities[0].phone).toBe("033 560 520");
    expect(scanPlanForPii(out)).toHaveLength(0);
  });

  it("redactPiiText keeps non-PII text untouched", () => {
    const txt = "Posjeta Louvre muzeju, Rue de Rivoli, Pariz. Tel: 033/560-520.";
    expect(redactPiiText(txt)).toBe(txt);
  });

  it("uses the same fallback_reason as the edge function", () => {
    expect(PII_FALLBACK_REASON).toBe("pii_detected");
  });
});