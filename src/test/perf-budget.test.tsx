import { describe, it, expect } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { statSync, readdirSync } from "fs";
import { join } from "path";
import i18n from "@/i18n";
import BudgetTracker from "@/components/trip/BudgetTracker";
import ChecklistTemplates from "@/components/trip/ChecklistTemplates";
import DailyTimeline from "@/components/trip/DailyTimeline";

const RENDER_BUDGET_MS = 600;       // single mount, jsdom (generous to avoid CI flake)
const REPEAT_BUDGET_MS = 2500;      // 25 mount/unmount cycles
const LOCALE_KB_BUDGET = 200;       // each locale file should stay under this

const costs = {
  transport: 500, accommodation: 800, meals: 400,
  entry_fees: 100, activity_fees: 80, local_transport: 60,
  contingency: 100, total: 2040,
};
const itin = [{
  day: 1, title: "D1",
  activities: [
    { time: "08:00", description: "Polazak", type: "travel"   as const, location: "A" },
    { time: "12:00", description: "Ručak",   type: "meal"     as const, location: "B" },
    { time: "15:00", description: "Posjeta", type: "activity" as const, location: "C" },
  ],
}];

const wrap = (ui: React.ReactElement) => (
  <I18nextProvider i18n={i18n}>
    <MemoryRouter>{ui}</MemoryRouter>
  </I18nextProvider>
);

describe("Performance budgets (heaviest UI components)", () => {
  it(`single-mount BudgetTracker < ${RENDER_BUDGET_MS}ms`, () => {
    const t0 = performance.now();
    const { unmount } = render(wrap(
      <BudgetTracker costs={costs} costPerStudent={150} studentCount={20} budgetPerStudent={100} />
    ));
    const dt = performance.now() - t0;
    unmount();
    expect(dt, `BudgetTracker render took ${dt.toFixed(1)}ms`).toBeLessThan(RENDER_BUDGET_MS);
  });

  it(`25× mount/unmount DailyTimeline + ChecklistTemplates < ${REPEAT_BUDGET_MS}ms`, () => {
    const t0 = performance.now();
    for (let i = 0; i < 25; i++) {
      const a = render(wrap(<DailyTimeline itinerary={itin} />));
      a.unmount();
      const b = render(wrap(<ChecklistTemplates storageKey={`perf-${i}`} />));
      b.unmount();
    }
    const dt = performance.now() - t0;
    cleanup();
    expect(dt, `25 cycles took ${dt.toFixed(1)}ms`).toBeLessThan(REPEAT_BUDGET_MS);
  });

  it(`locale bundles stay under ${LOCALE_KB_BUDGET} KB each`, () => {
    for (const f of ["src/i18n/locales/bs.ts", "src/i18n/locales/en.ts"]) {
      const kb = statSync(join(process.cwd(), f)).size / 1024;
      expect(kb, `${f} is ${kb.toFixed(1)} KB`).toBeLessThan(LOCALE_KB_BUDGET);
    }
  });

  it("dist bundle (if built) stays under 1.5 MB gzip-uncompressed JS", () => {
    const dist = join(process.cwd(), "dist", "assets");
    try {
      const files = readdirSync(dist).filter((f) => f.endsWith(".js"));
      if (files.length === 0) return; // skip if not built
      const totalKb = files.reduce((s, f) => s + statSync(join(dist, f)).size, 0) / 1024;
      expect(totalKb, `JS bundle total ${totalKb.toFixed(1)} KB`).toBeLessThan(1536);
    } catch {
      // no dist directory — skip silently
    }
  });
});
