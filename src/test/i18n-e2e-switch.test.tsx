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
import { OfflineSyncStatus } from "@/components/offline/OfflineSyncStatus";

const renderApp = (ui: React.ReactElement) =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nextProvider>
  );

describe("E2E language switch (BS ↔ EN) across critical sections", () => {
  beforeEach(() => cleanup());

  const cases: Array<[string, React.ReactElement, (l: typeof bs) => string]> = [
    ["HeroSection", <HeroSection />, (d) => d.home.heroTitle],
    ["FeaturesSection", <FeaturesSection />, (d) => d.features.title],
    ["DestinationsSection", <DestinationsSection />, (d) => d.home.popularDestinations],
    ["CTASection", <CTASection />, (d) => d.home.ctaTitle],
    ["TestimonialsSection", <TestimonialsSection />, (d) => d.home.testimonialsTitle],
    ["OfflineSyncStatus", <OfflineSyncStatus />, (d) => d.offlineSync.online],
  ];

  for (const [name, ui, pick] of cases) {
    it(`${name} switches BS → EN live`, async () => {
      await act(async () => {
        await i18n.changeLanguage("bs");
      });
      renderApp(ui);
      expect(screen.getAllByText(pick(bs as any))[0]).toBeInTheDocument();
      await act(async () => {
        await i18n.changeLanguage("en");
      });
      expect(screen.getAllByText(pick(en as any))[0]).toBeInTheDocument();
    });
  }
});
