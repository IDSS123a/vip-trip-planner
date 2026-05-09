import { describe, it, expect } from "vitest";
import bs from "@/i18n/locales/bs";
import en from "@/i18n/locales/en";

type Dict = Record<string, unknown>;

function flatten(obj: Dict, prefix = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flatten(v as Dict, path));
    } else if (typeof v === "string") {
      out.push(path);
    }
  }
  return out;
}

const NAMESPACES = ["budget", "checklist", "timeline"] as const;

describe("i18n parity (BS ↔ EN) — CI guardrail", () => {
  for (const ns of NAMESPACES) {
    it(`namespace "${ns}" has identical keys in BS and EN`, () => {
      const bsKeys = flatten((bs as any)[ns], ns).sort();
      const enKeys = flatten((en as any)[ns], ns).sort();

      const missingInEn = bsKeys.filter((k) => !enKeys.includes(k));
      const missingInBs = enKeys.filter((k) => !bsKeys.includes(k));

      expect(
        missingInEn,
        `Missing in EN locale for "${ns}": ${missingInEn.join(", ")}`
      ).toEqual([]);
      expect(
        missingInBs,
        `Missing in BS locale for "${ns}": ${missingInBs.join(", ")}`
      ).toEqual([]);
    });

    it(`namespace "${ns}" has no empty values`, () => {
      const checkEmpty = (locale: any, name: string) => {
        const empties: string[] = [];
        const walk = (o: any, p: string) => {
          for (const [k, v] of Object.entries(o)) {
            const path = `${p}.${k}`;
            if (v && typeof v === "object") walk(v, path);
            else if (typeof v !== "string" || !v.trim()) empties.push(path);
          }
        };
        walk(locale[ns], name);
        return empties;
      };
      expect(checkEmpty(bs, "bs"), "Empty BS values").toEqual([]);
      expect(checkEmpty(en, "en"), "Empty EN values").toEqual([]);
    });
  }

  it("planTrip error/validation messages exist in both locales", () => {
    const required = ["consentMissing", "consentBlock", "rotationViolated"];
    for (const k of required) {
      expect((bs as any).planTrip[k], `bs.planTrip.${k}`).toBeTruthy();
      expect((en as any).planTrip[k], `en.planTrip.${k}`).toBeTruthy();
    }
  });
});
