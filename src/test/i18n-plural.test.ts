import { describe, it, expect, beforeAll } from "vitest";
import i18n from "@/i18n";

/**
 * Pluralization contract: toast count phrasings must be grammatically
 * correct for BS (one/few/other) and EN (one/other). This guards against
 * the previous bug where "1 promjena uspješno sinkronizirano" was used
 * for both singular and plural counts.
 */
describe("i18n pluralization — BS (one/few/other) + EN (one/other)", () => {
  beforeAll(async () => {
    await i18n.changeLanguage("bs");
  });

  it("BS — syncDoneDesc: 1 → singular, 3 → few, 5 → other", async () => {
    await i18n.changeLanguage("bs");
    expect(i18n.t("offlineSyncToast.syncDoneDesc", { count: 1 })).toContain(
      "sinkronizirana"
    );
    expect(i18n.t("offlineSyncToast.syncDoneDesc", { count: 3 })).toContain(
      "sinkronizirane"
    );
    expect(i18n.t("offlineSyncToast.syncDoneDesc", { count: 5 })).toContain(
      "sinkronizirano"
    );
  });

  it("EN — syncDoneDesc: 1 → 'change', 2+ → 'changes'", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("offlineSyncToast.syncDoneDesc", { count: 1 })).toMatch(
      /1 change\b(?! synced something else)/
    );
    expect(i18n.t("offlineSyncToast.syncDoneDesc", { count: 2 })).toContain(
      "2 changes"
    );
  });

  it("BS — syncFailDesc respects gramatical number", async () => {
    await i18n.changeLanguage("bs");
    const s1 = i18n.t("offlineSyncToast.syncFailDesc", { count: 1 });
    const s3 = i18n.t("offlineSyncToast.syncFailDesc", { count: 3 });
    const s5 = i18n.t("offlineSyncToast.syncFailDesc", { count: 5 });
    expect(s1).not.toEqual(s3);
    expect(s3).not.toEqual(s5);
  });

  it("count token is always interpolated", async () => {
    for (const lang of ["bs", "en"] as const) {
      await i18n.changeLanguage(lang);
      for (const c of [1, 2, 5]) {
        const out = i18n.t("offlineSyncToast.syncDoneDesc", { count: c });
        expect(out, `${lang} count=${c}`).toContain(String(c));
        expect(out).not.toContain("{{count}}");
      }
    }
  });
});