import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import bs from "@/i18n/locales/bs";
import en from "@/i18n/locales/en";
import BudgetTracker from "@/components/trip/BudgetTracker";
import ChecklistTemplates from "@/components/trip/ChecklistTemplates";
import DailyTimeline from "@/components/trip/DailyTimeline";

const sampleCosts = {
  transport: 500, accommodation: 800, meals: 400,
  entry_fees: 100, activity_fees: 80, local_transport: 60,
  contingency: 100, total: 2040,
};

const sampleItinerary = [
  {
    day: 1,
    title: "Day 1",
    activities: [
      { time: "08:00", description: "Polazak", type: "travel" as const, location: "Sarajevo" },
      { time: "12:00", description: "Ručak", type: "meal" as const, location: "Konjic" },
    ],
  },
];

function renderWith(lang: "bs" | "en", ui: React.ReactElement) {
  // Switch language synchronously before render
  i18n.changeLanguage(lang);
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe("UI renders translated strings in both BS and EN", () => {
  beforeEach(() => cleanup());

  describe("BudgetTracker", () => {
    for (const lang of ["bs", "en"] as const) {
      const dict = (lang === "bs" ? bs : en).budget;
      it(`[${lang}] shows title, totals, over-budget warning`, () => {
        renderWith(lang, (
          <BudgetTracker
            costs={sampleCosts}
            costPerStudent={150}
            studentCount={14}
            budgetPerStudent={100}
          />
        ));
        expect(screen.getByText(dict.title)).toBeInTheDocument();
        expect(screen.getByText(dict.perCategory)).toBeInTheDocument();
        expect(screen.getByText(dict.transport)).toBeInTheDocument();
        expect(screen.getByText(dict.overBudgetWarning)).toBeInTheDocument();
        expect(screen.queryByText(dict.withinBudget)).not.toBeInTheDocument();
      });

      it(`[${lang}] shows within-budget message when under cap`, () => {
        renderWith(lang, (
          <BudgetTracker costs={sampleCosts} costPerStudent={50} studentCount={14} budgetPerStudent={200} />
        ));
        expect(screen.getByText(dict.withinBudget)).toBeInTheDocument();
        expect(screen.queryByText(dict.overBudgetWarning)).not.toBeInTheDocument();
      });

      it(`[${lang}] empty state shows chartHint`, () => {
        renderWith(lang, <BudgetTracker />);
        expect(screen.getByText(dict.chartHint)).toBeInTheDocument();
      });
    }
  });

  describe("ChecklistTemplates", () => {
    for (const lang of ["bs", "en"] as const) {
      const dict = (lang === "bs" ? bs : en).checklist;
      it(`[${lang}] renders title, tabs, and default packing items`, () => {
        renderWith(lang, <ChecklistTemplates storageKey={`test-cl-${lang}`} />);
        expect(screen.getByText(dict.title)).toBeInTheDocument();
        expect(screen.getByText(dict.subtitle)).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: dict.packing })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: dict.documents })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: dict.safety })).toBeInTheDocument();
        // Default tab is packing → at least one packing item rendered
        expect(screen.getByText(dict.items.clothes)).toBeInTheDocument();
      });
    }
  });

  describe("DailyTimeline", () => {
    for (const lang of ["bs", "en"] as const) {
      const dict = (lang === "bs" ? bs : en).timeline;
      it(`[${lang}] renders title, day badge, save button`, () => {
        renderWith(lang, <DailyTimeline itinerary={sampleItinerary} />);
        expect(screen.getByText(dict.title)).toBeInTheDocument();
        expect(screen.getByText(dict.subtitle)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: new RegExp(dict.saveOrder, "i") })).toBeInTheDocument();
        // Drag handle aria-label is translated
        const handles = screen.getAllByRole("button", { name: dict.dragHandle });
        expect(handles.length).toBeGreaterThan(0);
      });

      it(`[${lang}] empty state translated`, () => {
        renderWith(lang, <DailyTimeline itinerary={[]} />);
        expect(screen.getByText(dict.empty)).toBeInTheDocument();
      });
    }
  });

  describe("Language switching mid-session", () => {
    it("re-renders translated strings after changeLanguage", async () => {
      const { rerender } = renderWith("bs", <BudgetTracker costs={sampleCosts} costPerStudent={50} studentCount={14} budgetPerStudent={200} />);
      expect(screen.getByText(bs.budget.title)).toBeInTheDocument();
      await i18n.changeLanguage("en");
      rerender(<I18nextProvider i18n={i18n}><BudgetTracker costs={sampleCosts} costPerStudent={50} studentCount={14} budgetPerStudent={200} /></I18nextProvider>);
      expect(screen.getByText(en.budget.title)).toBeInTheDocument();
      expect(screen.queryByText(bs.budget.title)).not.toBeInTheDocument();
    });
  });
});
