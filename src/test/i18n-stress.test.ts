import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import bs from "@/i18n/locales/bs";
import en from "@/i18n/locales/en";

type Dict = Record<string, unknown>;

function flatten(obj: Dict, prefix = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...flatten(v as Dict, path));
    else if (typeof v === "string") out.push(path);
  }
  return out;
}

function walkSrc(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "test" || entry === "i18n") continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walkSrc(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry)) files.push(full);
  }
  return files;
}

describe("i18n full app stress", () => {
  it("BS and EN have identical key shape across ALL namespaces", () => {
    const bsKeys = flatten(bs as any).sort();
    const enKeys = flatten(en as any).sort();
    const missingInEn = bsKeys.filter((k) => !enKeys.includes(k));
    const missingInBs = enKeys.filter((k) => !bsKeys.includes(k));
    expect(missingInEn, `Missing in EN: ${missingInEn.join(", ")}`).toEqual([]);
    expect(missingInBs, `Missing in BS: ${missingInBs.join(", ")}`).toEqual([]);
  });

  it("no locale value is empty or whitespace-only", () => {
    const empties: string[] = [];
    const walk = (o: any, p: string, locale: string) => {
      for (const [k, v] of Object.entries(o)) {
        const path = `${locale}.${p ? p + "." : ""}${k}`;
        if (v && typeof v === "object") walk(v, p ? `${p}.${k}` : k, locale);
        else if (typeof v !== "string" || !v.trim()) empties.push(path);
      }
    };
    walk(bs, "", "bs"); walk(en, "", "en");
    expect(empties, `Empty locale values: ${empties.join(", ")}`).toEqual([]);
  });

  it("every t(\"key.path\") used in src/ exists in BS and EN locales", () => {
    const bsKeys = new Set(flatten(bs as any));
    const enKeys = new Set(flatten(en as any));
    const files = walkSrc("src");
    const usagePattern = /\bt\(\s*["'`]([a-zA-Z0-9_.]+)["'`]/g;
    const missing: string[] = [];
    const seen = new Set<string>();
    for (const f of files) {
      const txt = readFileSync(f, "utf8");
      let m: RegExpExecArray | null;
      while ((m = usagePattern.exec(txt))) {
        const key = m[1];
        // Skip dynamic-template patterns (those use backticks with ${} — already filtered by regex)
        // Skip leading-namespace prefixes only (no dot)
        if (!key.includes(".")) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!bsKeys.has(key) || !enKeys.has(key)) missing.push(`${f}: ${key}`);
      }
    }
    expect(missing, `Untranslated t() keys:\n${missing.join("\n")}`).toEqual([]);
  });
});
