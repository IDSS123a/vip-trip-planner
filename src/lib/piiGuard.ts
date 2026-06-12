// ──────────────────────────────────────────────────────────────────
// PDF EXPORT PII GUARD — mirrors the edge-function PII guard so that
// forbidden personal information (personal names with titles, e-mail
// addresses, personal mobile phones) can never reach an exported PDF,
// even if it somehow slipped through the backend validation.
// Business contact data in structured `phone` fields is allowed.
// ──────────────────────────────────────────────────────────────────

export const PII_TITLE_NAME =
  /\b(gospodin|gospođa|gospodja|gđa|gdja|gosp\.|g\.|mr\.?|mrs\.?|ms\.?|dr\.?)\s+[A-ZČĆŠŽĐ][\wčćšžđČĆŠŽĐ]{2,}(?:\s+[A-ZČĆŠŽĐ][\wčćšžđČĆŠŽĐ]{2,})?/iu;
export const PII_EMAIL = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/;
// Personal mobile patterns (BiH 06X, with optional +387 prefix)
export const PII_PERSONAL_PHONE = /\b(?:\+?387[\s-]?)?06[0-9][\s\/\-]?\d{3}[\s\/\-]?\d{3,4}\b/;

/** Same fallback_reason the edge function uses when PII forces a fallback. */
export const PII_FALLBACK_REASON = "pii_detected";

const PHONE_EXEMPT_KEYS = new Set(["phone", "accommodation_phone"]);
// Server diagnostics quote the offending strings — skip them during scans
// so the guard does not re-trigger on its own report (they are not printed in the PDF).
const SKIPPED_KEYS = new Set(["validation_report", "_validation"]);

export interface PiiHit {
  where: string;
  kind: "name" | "email" | "phone";
}

function scanText(text: string, where: string, skipPhone: boolean, hits: PiiHit[]) {
  if (!text || typeof text !== "string") return;
  if (PII_TITLE_NAME.test(text)) hits.push({ where, kind: "name" });
  if (PII_EMAIL.test(text)) hits.push({ where, kind: "email" });
  if (!skipPhone && PII_PERSONAL_PHONE.test(text)) hits.push({ where, kind: "phone" });
}

/** Deep-scans a trip plan (any shape) for forbidden personal information. */
export function scanPlanForPii(plan: unknown): PiiHit[] {
  const hits: PiiHit[] = [];
  const walk = (node: unknown, label: string, parentKey?: string) => {
    if (node == null) return;
    if (typeof node === "string") {
      scanText(node, label, PHONE_EXEMPT_KEYS.has(parentKey || ""), hits);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${label}[${i}]`));
      return;
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (SKIPPED_KEYS.has(k)) continue;
        walk(v, `${label}.${k}`, k);
      }
    }
  };
  walk(plan, "plan");
  return hits;
}

const G = (re: RegExp, flags: string) => new RegExp(re.source, flags);
const PII_TITLE_NAME_G = G(PII_TITLE_NAME, "giu");
const PII_EMAIL_G = G(PII_EMAIL, "g");
const PII_PERSONAL_PHONE_G = G(PII_PERSONAL_PHONE, "g");

export function redactPiiText(text: string, skipPhone = false): string {
  if (!text || typeof text !== "string") return text;
  let out = text.replace(PII_EMAIL_G, "[uklonjeno]").replace(PII_TITLE_NAME_G, "[uklonjeno]");
  if (!skipPhone) out = out.replace(PII_PERSONAL_PHONE_G, "[uklonjeno]");
  return out;
}

/** Returns a deep copy of the plan with every PII match replaced by "[uklonjeno]". */
export function redactPlanPii<T>(plan: T): T {
  const walk = (node: unknown, parentKey?: string): unknown => {
    if (typeof node === "string") return redactPiiText(node, PHONE_EXEMPT_KEYS.has(parentKey || ""));
    if (Array.isArray(node)) return node.map((v) => walk(v));
    if (node && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        out[k] = SKIPPED_KEYS.has(k) ? v : walk(v, k);
      }
      return out;
    }
    return node;
  };
  return walk(plan) as T;
}