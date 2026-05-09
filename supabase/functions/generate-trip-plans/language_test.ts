import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { resolveLanguage, buildLanguageInstruction } from "./index.ts";

Deno.test("resolveLanguage: defaults to bs", () => {
  assertEquals(resolveLanguage(undefined), "bs");
  assertEquals(resolveLanguage(null), "bs");
  assertEquals(resolveLanguage(""), "bs");
  assertEquals(resolveLanguage("bs"), "bs");
  assertEquals(resolveLanguage("BS"), "bs");
});

Deno.test("resolveLanguage: maps English variants to en", () => {
  assertEquals(resolveLanguage("en"), "en");
  assertEquals(resolveLanguage("EN"), "en");
  assertEquals(resolveLanguage("en-US"), "en");
  assertEquals(resolveLanguage("english"), "en");
});

Deno.test("resolveLanguage: unknown languages fall back to bs", () => {
  assertEquals(resolveLanguage("de"), "bs");
  assertEquals(resolveLanguage("fr-FR"), "bs");
});

Deno.test("buildLanguageInstruction: English forces ENGLISH output", () => {
  const out = buildLanguageInstruction("en");
  assertStringIncludes(out, "ENGLISH");
  assertStringIncludes(out, "OUTPUT LANGUAGE");
});

Deno.test("buildLanguageInstruction: Bosnian forces BOSANSKI output", () => {
  const out = buildLanguageInstruction("bs");
  assertStringIncludes(out, "BOSANSKOM");
  assertStringIncludes(out, "JEZIK IZLAZA");
});

Deno.test("buildLanguageInstruction: default (no language) is Bosnian", () => {
  const out = buildLanguageInstruction(undefined);
  assertStringIncludes(out, "BOSANSKOM");
});

Deno.test("buildLanguageInstruction: never returns empty string", () => {
  for (const l of [undefined, null, "", "bs", "en", "xx"]) {
    const out = buildLanguageInstruction(l as string | null | undefined);
    if (!out || out.length < 20) throw new Error("expected non-empty instruction for " + String(l));
  }
});
