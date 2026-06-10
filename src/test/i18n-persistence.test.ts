import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Language persistence: the user's choice (stored in localStorage under the
 * key "idss-language") must survive a hard reload AND a transition from
 * offline → online. We simulate the reload by resetting the module cache
 * and re-importing the i18n init module.
 */
describe("i18n persistence across hard reload and offline transitions", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("EN choice persists across a simulated hard reload", async () => {
    localStorage.setItem("idss-language", "en");
    const mod = await import("@/i18n");
    // Wait for i18next async init to settle
    await new Promise((r) => setTimeout(r, 0));
    expect(mod.default.language.startsWith("en")).toBe(true);

    // Simulate hard reload: drop module cache, re-import
    vi.resetModules();
    const reloaded = await import("@/i18n");
    await new Promise((r) => setTimeout(r, 0));
    expect(reloaded.default.language.startsWith("en")).toBe(true);
    expect(localStorage.getItem("idss-language")).toBe("en");
  });

  it("BS choice persists across a simulated hard reload", async () => {
    localStorage.setItem("idss-language", "bs");
    vi.resetModules();
    const mod = await import("@/i18n");
    await new Promise((r) => setTimeout(r, 0));
    expect(mod.default.language.startsWith("bs")).toBe(true);
  });

  it("language survives offline → online cycle (storage is not cleared)", async () => {
    localStorage.setItem("idss-language", "en");
    vi.resetModules();
    const mod = await import("@/i18n");
    await new Promise((r) => setTimeout(r, 0));
    expect(mod.default.language.startsWith("en")).toBe(true);

    // Go offline
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    window.dispatchEvent(new Event("offline"));
    // Storage must remain
    expect(localStorage.getItem("idss-language")).toBe("en");

    // Back online + hard reload — must still load EN
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    window.dispatchEvent(new Event("online"));
    vi.resetModules();
    const reloaded = await import("@/i18n");
    await new Promise((r) => setTimeout(r, 0));
    expect(reloaded.default.language.startsWith("en")).toBe(true);
  });
});