import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Files that MUST be fully localized (no Bosnian diacritics in JSX text).
const CRITICAL_FILES = [
  "src/pages/Auth.tsx",
  "src/pages/Contact.tsx",
  "src/pages/MyTrips.tsx",
  "src/pages/PlanTrip.tsx",
  "src/pages/UpdatePassword.tsx",
  "src/pages/SharedTrip.tsx",
  "src/components/trip/TripItinerary.tsx",
  "src/components/trip/IdssAuditTrail.tsx",
  "src/components/trip/EmailShareDialog.tsx",
  "src/components/trip/ShareTripDialog.tsx",
  "src/components/trip/StudentListInput.tsx",
  "src/components/offline/OfflineSyncStatus.tsx",
  "src/components/notifications/NotificationSettings.tsx",
  "src/components/home/HeroSection.tsx",
  "src/components/home/FeaturesSection.tsx",
  "src/components/home/DestinationsSection.tsx",
  "src/components/home/TestimonialsSection.tsx",
  "src/components/home/CTASection.tsx",
];

// Bosnian-specific diacritics; their presence in JSX text means a literal slipped in.
const DIACRITIC = /[šđčćžŠĐČĆŽ]/;
// Match JSX text between tags: >TEXT<  (single-line, no braces)
const JSX_TEXT_RE = />([^<>{}\n]+)</g;

function extractJsxText(src: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = JSX_TEXT_RE.exec(src))) {
    const t = m[1].trim();
    if (t.length < 2) continue;
    out.push(t);
  }
  return out;
}

describe("i18n hardcoded-string lint (critical files)", () => {
  for (const rel of CRITICAL_FILES) {
    it(`${rel} has no Bosnian literals in JSX text`, () => {
      const src = readFileSync(join(process.cwd(), rel), "utf8");
      const offenders = extractJsxText(src).filter((t) => DIACRITIC.test(t));
      expect(
        offenders,
        `Hardcoded BS strings in ${rel}:\n  ${offenders.join("\n  ")}`
      ).toEqual([]);
    });
  }
});
