import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

// Heavy children mocked — alert lives at the top of TabsContent so we
// don't need real route maps, student inputs, or PDF pipelines here.
vi.mock("@/components/trip/TripRouteMap", () => ({ default: () => null }));
vi.mock("@/components/trip/StudentListInput", () => ({ default: () => null }));
vi.mock("@/components/trip/IdssAuditTrail", () => ({ default: () => null }));
vi.mock("@/hooks/useTripDocuments", () => ({
  useTripDocuments: () => ({
    generateParentPermission: vi.fn(),
    generateStudentList: vi.fn(),
    generateFullDocumentation: vi.fn(),
    isGenerating: false,
  }),
}));

import TripItinerary from "@/components/trip/TripItinerary";

function buildPlan(overrides: any = {}) {
  return {
    id: 1,
    type: "Balanced" as const,
    route: "Sarajevo → Mostar",
    reliability: 90,
    days: 2,
    distance_km: 130,
    travel_hours: 2,
    cost_per_student: 120,
    costs: {
      transport: 0, accommodation: 0, meals: 0, entry_fees: 0,
      activity_fees: 0, local_transport: 0, contingency: 0, total: 0,
    },
    why_this_fits: "",
    accommodation_info: "Hotel Mostar",
    itinerary: [{ day: 1, title: "Dan 1", activities: [] }],
    fallback_engine: true,
    ai_generated: false,
    ...overrides,
  };
}

function renderTrip(plan: any) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <TripItinerary
          plansData={{ plans: [plan], route_coordinates: [], educational_resources: [] } as any}
          isLoading={false}
          error={null}
          chaperones={[]}
          tripName="Test"
          departureCity="Sarajevo"
          destinations={["Mostar"]}
          studentCount={20}
        />
      </MemoryRouter>
    </I18nextProvider>
  );
}

describe("TripItinerary: Validation / USTAV alert", () => {
  beforeEach(async () => {
    cleanup();
    await act(async () => { await i18n.changeLanguage("bs"); });
  });

  it("shows USTAV alert with violated rules + fallback reason when user_constitution is violated", async () => {
    const userIssues = [
      "Dan 1: aktivnost smještaja ne odgovara izboru \"hotel\" (\"Hostel Centar\").",
      "Dan 2: planiran restoran iako korisnik je izabrao \"self_catering\".",
    ];
    const plan = buildPlan({
      validation_report: {
        violations: [],
        user_issues: userIssues,
        fallback_reason: "user_constitution_violation",
        replaced_tier: "Balanced",
      },
    });

    renderTrip(plan);

    // Title
    expect(screen.getByText(/USTAV korisnika je prekršen/i)).toBeInTheDocument();
    // Each violated rule is listed verbatim
    for (const rule of userIssues) {
      expect(screen.getByText(rule)).toBeInTheDocument();
    }
    // Fallback reason is shown
    const reasonBlock = screen.getByTestId("fallback-reason");
    expect(reasonBlock.textContent).toMatch(/Razlog fallbacka/i);
    expect(reasonBlock.textContent).toMatch(/AI nije ispoštovao obavezne korisničke unose/i);
  });

  it("shows PII alert + reason when forbidden personal information was detected", async () => {
    const userIssues = [
      "Zabranjene lične informacije pronađene → Dan 1 aktivnost (description): lično ime sa titulom (\"Gospodin Marko Marković\")",
    ];
    const plan = buildPlan({
      validation_report: {
        violations: [],
        user_issues: userIssues,
        fallback_reason: "pii_detected",
        replaced_tier: "Balanced",
      },
    });

    renderTrip(plan);

    expect(screen.getByText(/Detektovane zabranjene lične informacije/i)).toBeInTheDocument();
    expect(screen.getByText(userIssues[0])).toBeInTheDocument();
    const reasonBlock = screen.getByTestId("fallback-reason");
    expect(reasonBlock.textContent).toMatch(/Detektovane zabranjene lične informacije \(ime\/adresa\/telefon\)/i);
  });

  it("shows overnight rule violation reason when only overnight rules were broken", async () => {
    const plan = buildPlan({
      validation_report: {
        violations: ["Dan 1: noćenje u međustanici 'Konjic'."],
        user_issues: [],
        fallback_reason: "overnight_rule_violation",
        replaced_tier: "Balanced",
      },
    });

    renderTrip(plan);
    const reasonBlock = screen.getByTestId("fallback-reason");
    expect(reasonBlock.textContent).toMatch(/noćenja smiju desiti samo u krajnjoj destinaciji/i);
  });
});