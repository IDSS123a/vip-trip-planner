import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, BookOpen } from "lucide-react";

interface IdssAuditTrailProps {
  tripType?: "day-trip" | "multi-day" | string;
  gradeLevel?: string;
  days?: number;
  destinations?: string[];
  studentCount?: number;
  chaperonesCount?: number;
}

interface RuleCitation {
  source: string;
  article: string;
  rule: string;
  applied: string;
}

const buildRules = ({
  tripType,
  gradeLevel,
  days,
  destinations,
  studentCount,
  chaperonesCount,
}: IdssAuditTrailProps): RuleCitation[] => {
  const rules: RuleCitation[] = [];
  const isWholeSchool = gradeLevel === "all" || gradeLevel === "all+preschool";
  const dest = destinations?.length ? destinations.join(" → ") : "—";

  if (tripType === "day-trip") {
    rules.push({
      source: "Pravilnik IDSS (09.03.2026)",
      article: "Član 1 — Klasifikacija ekskurzija",
      rule: "Jednodnevna ekskurzija: bez noćenja, lokalno ili šire područje BiH.",
      applied: `Generirano ${days ?? 1} dan / 0 noći prema klasifikaciji „oneDay".`,
    });
    rules.push({
      source: "Uputstvo o organizaciji ekskurzija — 5.1",
      article: "Tačka 5.1 — Jednodnevni izlet",
      rule: "Bez razgledanja usputnih destinacija; što prije stići na izletište. Dozvoljene su samo kratke tehničke pauze (toalet/voda) ako je jednosmjerna vožnja > 2h.",
      applied: `AI prompt zabranjuje sightseeing na međustanicama — sav sadržaj na finalnoj destinaciji (${dest}).`,
    });
    if (isWholeSchool) {
      rules.push({
        source: "Pravilnik IDSS — Član 2",
        article: "Sastav grupe",
        rule: "Cijela škola (± predškolska grupa) može ići isključivo na jednodnevni izlet.",
        applied: `Odabrano '${gradeLevel === "all+preschool" ? "Cijela škola + Predškolska" : "Cijela škola"}' → višednevna opcija blokirana.`,
      });
    }
  } else if (tripType === "multi-day") {
    rules.push({
      source: "Pravilnik IDSS (09.03.2026)",
      article: "Član 1 — Klasifikacija",
      rule: "Višednevna domaća ekskurzija: 2–6 dana, do 5 noći; međunarodna: do 6 dana.",
      applied: `Generirano ${days ?? "?"} dana — u okviru dozvoljenog opsega.`,
    });
    rules.push({
      source: "Uputstvo 5.2",
      article: "Tačka 5.2 — Višednevna ekskurzija",
      rule: "Plan slijedi obavezne tačke programa: noćenje, ishrana, edukativne aktivnosti, vremenski okvir 09:00–21:00 sa obaveznim pauzama.",
      applied: "AI prompt aktivira blok pravila za multi-day (smještaj, ishrana, dnevne aktivnosti).",
    });
    rules.push({
      source: "Pravilnik — Član 2 / Uputstvo 3A",
      article: "Plan po razredima i rotacija (Član 4)",
      rule: "Destinacije moraju biti iz odobrene liste za razred; 2-godišnja rotacija primarne destinacije.",
      applied: `Razred ${gradeLevel ?? "—"} → destinacije provjerene u IDSS_GRADE_PLANS.`,
    });
    rules.push({
      source: "Saglasnost roditelja — Prilog 1",
      article: "Obavezna dokumentacija",
      rule: "Za svaku višednevnu ekskurziju mora biti generisana saglasnost roditelja po Prilogu 1.",
      applied: "Dokument 'Saglasnost Roditelja' dostupan u sekciji Generiranje PDF Dokumentacije.",
    });
  }

  // Univerzalna pravila (oba tipa)
  if (typeof studentCount === "number" && typeof chaperonesCount === "number") {
    rules.push({
      source: "Pravilnik IDSS — Član 6",
      article: "Pratnja (chaperones)",
      rule: "Minimalno 1 pratilac na 15 učenika za jednodnevne, 1 na 10 za višednevne ekskurzije.",
      applied: `${studentCount} učenika → ${chaperonesCount} pratilaca konfigurisano.`,
    });
  }

  rules.push({
    source: "Pravilnik — Član 3",
    article: "Termini i odobrenje",
    rule: "Odobrenje Školskog odbora najkasnije 30 dana prije puta; termini definisani u članu 3.",
    applied: "Validacija datuma izvršena prije generisanja plana.",
  });

  return rules;
};

const IdssAuditTrail = (props: IdssAuditTrailProps) => {
  const rules = buildRules(props);
  if (!rules.length) return null;

  const tripTypeLabel =
    props.tripType === "day-trip"
      ? "Jednodnevni izlet"
      : props.tripType === "multi-day"
        ? "Višednevna ekskurzija"
        : "Nepoznato";

  return (
    <Card className="border-primary/20 bg-muted/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          Zašto ovaj plan? — IDSS Audit Trail
          <Badge variant="outline" className="ml-2">{tripTypeLabel}</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sljedeća pravila iz IDSS Pravilnika i Uputstava primijenjena su na osnovu vašeg izbora
          tipa puta i razreda. Svaka stavka navodi izvor i način primjene.
        </p>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {rules.map((r, i) => (
            <li
              key={i}
              className="rounded-md border border-border bg-card p-3 space-y-1"
            >
              <div className="flex items-start gap-2 flex-wrap">
                <Badge variant="secondary" className="gap-1 text-xs">
                  <BookOpen className="h-3 w-3" />
                  {r.source}
                </Badge>
                <span className="text-xs font-semibold text-foreground">{r.article}</span>
              </div>
              <p className="text-sm text-foreground">
                <strong>Pravilo:</strong> {r.rule}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong className="text-primary">Primijenjeno:</strong> {r.applied}
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};

export default IdssAuditTrail;