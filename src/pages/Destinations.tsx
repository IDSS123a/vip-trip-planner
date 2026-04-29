import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Clock, Users, BookOpen, ArrowRight, Info, Bus, Building2, RotateCw } from "lucide-react";
import { IDSS_GRADE_PLANS, EXCURSION_CATEGORIES, IDSS_TIMING } from "@/lib/idssRegulations";

/**
 * Katalog destinacija po Pravilniku IDSS o organizaciji ekskurzija (Član 2 / Uputstvo 3A).
 * NIJE marketing stranica — ovo je referentni dokument koji jasno pokazuje
 * koje su destinacije DOZVOLJENE za pojedini razred i pravila rotacije.
 */

interface DestinationDetail {
  name: string;
  highlights: string[];
  educationalGoals: string[];
}

const DESTINATION_DETAILS: Record<string, DestinationDetail> = {
  Konjic: {
    name: "Konjic",
    highlights: ["Tunel D-0 (Titov bunker ARK)", "Stari kameni most (1682)", "Rijeka Neretva", "Etno-selo Šuman"],
    educationalGoals: ["Historija Hladnog rata", "Kulturna baština BiH", "Geografija doline Neretve"],
  },
  Ajdinovići: {
    name: "Ajdinovići",
    highlights: ["Etno-selo Ajdinovići (Olovo)", "Tradicionalna arhitektura", "Prirodno okruženje", "Aktivnosti na otvorenom"],
    educationalGoals: ["Tradicionalni način života", "Ekologija", "Timski rad"],
  },
  Mostar: {
    name: "Mostar",
    highlights: ["Stari most (UNESCO)", "Stari grad / Kujundžiluk", "Karađoz-begova džamija", "Muzej Hercegovine"],
    educationalGoals: ["UNESCO baština", "Multikulturalnost BiH", "Otomanska arhitektura"],
  },
  Blagaj: {
    name: "Blagaj",
    highlights: ["Tekija na vrelu Bune", "Vrelo Bune (jedan od najjačih izvora u Evropi)", "Tvrđava Stjepan-grad", "Lokalna kuhinja"],
    educationalGoals: ["Hidrologija krša", "Sufijska tradicija", "Srednjovjekovna historija"],
  },
  Trebinje: {
    name: "Trebinje",
    highlights: ["Stari grad", "Manastir Tvrdoš", "Manastir Hercegovačka Gračanica", "Trebišnjica i Arslanagića most"],
    educationalGoals: ["Mediteranska klima i flora", "Pravoslavna baština", "Ekonomija vinogradarstva"],
  },
  Zagreb: {
    name: "Zagreb",
    highlights: ["Gornji grad i Lotrščak", "Muzej prekinutih veza", "Tehnički muzej Nikola Tesla", "Maksimir / ZOO"],
    educationalGoals: ["Habsburška historija", "Moderna evropska metropola", "STEM (Tehnički muzej)"],
  },
  Dubrovnik: {
    name: "Dubrovnik",
    highlights: ["Gradske zidine (UNESCO)", "Stradun", "Lokrum", "Pomorski muzej"],
    educationalGoals: ["Dubrovačka Republika", "Pomorska historija", "Renesansna književnost"],
  },
  München: {
    name: "München",
    highlights: ["Deutsches Museum", "BMW Welt & Museum", "Marienplatz", "Olimpijski park", "Dachau Memorial"],
    educationalGoals: ["Njemačka historija 20. vijeka", "Inžinjerstvo i STEM", "Bavarska kultura", "Memorijalna edukacija"],
  },
};

const Destinations = () => {
  // Grupiramo planove tako da se spojene grupe prikažu jednom
  const seenGroups = new Set<string>();
  const groupedPlans = Object.values(IDSS_GRADE_PLANS).filter((plan) => {
    // Preskoči pojedinačne razrede koji su već prikazani kroz spojenu grupu
    if (plan.gradeId === "5" || plan.gradeId === "6" || plan.gradeId === "7" || plan.gradeId === "8") {
      return false;
    }
    if (seenGroups.has(plan.groupKey)) return false;
    seenGroups.add(plan.groupKey);
    return true;
  });

  // Sort: 4, 5+6, 7+8, 9
  const sortOrder: Record<string, number> = { "4": 1, "5+6": 2, "7+8": 3, "9": 4 };
  groupedPlans.sort((a, b) => (sortOrder[a.groupKey] ?? 99) - (sortOrder[b.groupKey] ?? 99));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Badge variant="outline" className="mb-3">
              Pravilnik o organizaciji ekskurzija — Član 2 / Uputstvo 3A
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Katalog <span className="text-primary">Destinacija po Pravilniku</span>
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              Pregled <strong>obavezujućih destinacija</strong> za svaki razred odnosno spojenu grupu IDSS škole,
              uz tačke interesa, edukativne ciljeve i pravila 2-godišnje rotacije iz Pravilnika.
            </p>
          </div>

          {/* Info banner */}
          <Alert className="mb-8 border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>Termin održavanja:</strong> {IDSS_TIMING.grades5to9Window}.
              Odobrenje Školskog odbora najkasnije do <strong>{IDSS_TIMING.approvalDeadline.toLowerCase()}</strong>.
              Za 4. razred: {IDSS_TIMING.grade4Window.toLowerCase()}.
            </AlertDescription>
          </Alert>

          {/* Grade plan cards */}
          <div className="space-y-8">
            {groupedPlans.map((plan) => {
              const category = EXCURSION_CATEGORIES[plan.category];
              return (
                <Card key={plan.groupKey} className="border-border overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          {plan.groupLabel}
                        </CardTitle>
                        <CardDescription className="mt-1">{plan.groupingNote}</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {plan.days} {plan.days === 1 ? "dan" : "dana"} / {plan.nights} {plan.nights === 1 ? "noć" : "noći"}
                        </Badge>
                        <Badge variant="outline">{category.label}</Badge>
                        {plan.rotationDestinations.length > 0 && (
                          <Badge variant="default" className="gap-1">
                            <RotateCw className="h-3 w-3" />
                            2-god. rotacija
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Rotacijski ciklus */}
                    {plan.rotationDestinations.length > 0 && (
                      <Alert className="border-amber-500/30 bg-amber-500/5">
                        <RotateCw className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-sm">
                          <strong>Pravilo rotacije (Član 4):</strong> ako je grupa prošle godine bila u
                          <strong> {plan.primaryDestination}</strong>, ove godine ide u
                          <strong> {plan.rotationDestinations.join(" / ")}</strong> — i obratno.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Destinacije sa tačkama interesa */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.destinations.map((destName) => {
                        const detail = DESTINATION_DETAILS[destName];
                        if (!detail) return null;
                        const isPrimary = destName === plan.primaryDestination;
                        return (
                          <div
                            key={destName}
                            className="rounded-lg border border-border bg-card p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                {detail.name}
                              </h3>
                              {isPrimary && (
                                <Badge variant="default" className="text-xs">Primarna</Badge>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                                <Building2 className="h-3 w-3" />
                                Tačke interesa
                              </div>
                              <ul className="text-sm text-foreground space-y-1">
                                {detail.highlights.map((h) => (
                                  <li key={h} className="flex gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{h}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                                <BookOpen className="h-3 w-3" />
                                Edukativni ciljevi
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {detail.educationalGoals.map((g) => (
                                  <Badge key={g} variant="secondary" className="text-xs font-normal">
                                    {g}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Separator />

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Bus className="h-4 w-4" />
                        <span>Spreman za planiranje? Generiraj 3 verificirana plana puta.</span>
                      </div>
                      <Button asChild className="gap-2">
                        <Link to="/plan-trip" state={{ presetGradeLevel: plan.gradeId }}>
                          Planiraj za {plan.groupLabel.split("(")[0].trim()}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer note */}
          <Card className="mt-8 border-border bg-muted/20">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Predškolska grupa, 1–3. razred
              </h2>
              <p className="text-sm text-muted-foreground">
                Za predškolsku grupu i razrede 1–3. organiziraju se isključivo lokalni jednodnevni izleti
                (Vrelo Bosne, Skakavac, Trebević, Olimpijski muzej Sarajevo) prema godišnjem planu rada
                razrednika. Ovi izleti ne podliježu pravilu rotacije.
              </p>
              <Button asChild variant="outline" className="mt-4 gap-2">
                <Link to="/plan-trip">
                  Planiraj jednodnevni izlet
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Destinations;