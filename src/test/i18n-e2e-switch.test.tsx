import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import bs from "@/i18n/locales/bs";
import en from "@/i18n/locales/en";

import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import DestinationsSection from "@/components/home/DestinationsSection";
import CTASection from "@/components/home/CTASection";
import TestimonialsSection from "@/components/home/TestimonialsSection";

const renderApp = (ui: React.ReactElement) =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nextProvider>
  );

describe("E2E language switch (BS ↔ EN) across critical sections", () => {
  beforeEach(() => cleanup());

  const cases: Array<[string, React.ReactElement, (l: typeof bs) => string]> = [
    ["HeroSection",        <HeroSection />,         (d) => d.home.heroTitle],
    ["FeaturesSection",    <FeaturesSection />,     (d) => d.features.f1Title],
    ["DestinationsSection",<DestinationsSection />, (d) => d.home.destinationsAll],
    ["CTASection",         <CTASection />,          (d) => d.home.ctaHeadline],
    ["TestimonialsSection",<TestimonialsSection />, (d) => d.home.testimonialsSubtitle],
  ];

  for (const [name, ui, pick] of cases) {
    it(`${name} switches BS → EN live`, async () => {
      await act(async () => { await i18n.changeLanguage("bs"); });
      renderApp(ui);
      expect(screen.getAllByText(new RegExp(pick(bs).slice(0, 20), "i"))[0]).toBeInTheDocument();
      cleanup();
      await act(async () => { await i18n.changeLanguage("en"); });
      renderApp(ui);
      expect(screen.getAllByText(new RegExp(pick(en).slice(0, 20), "i"))[0]).toBeInTheDocument();
    });
  }
});
