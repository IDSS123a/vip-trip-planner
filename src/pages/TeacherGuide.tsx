import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Play, 
  FileText, 
  Users, 
  Calendar, 
  Download,
  CheckCircle,
  ArrowRight,
  Lightbulb
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: 1,
    title: "Registracija i Prijava",
    description: "Kreirajte svoj besplatni račun ili se prijavite ako već imate jedan.",
    tips: [
      "Koristite službenu školsku e-mail adresu",
      "Unesite puno ime za lakšu identifikaciju",
      "Zapamtite da možete koristiti Google prijavu",
    ],
  },
  {
    number: 2,
    title: "Kreiranje Nove Ekskurzije",
    description: "Kliknite na 'Planiraj Ekskurziju' i unesite osnovne podatke.",
    tips: [
      "Počnite s polazištem (obično škola)",
      "Dodajte destinacije u redoslijedu posjete",
      "Odaberite odgovarajući tip ekskurzije za vaš razred",
    ],
  },
  {
    number: 3,
    title: "Odabir Razreda i Učenika",
    description: "Odaberite razred i unesite broj učenika koji sudjeluju.",
    tips: [
      "Sustav automatski izračunava minimalni broj pratitelja",
      "Mlađi razredi imaju manja ograničenja trajanja putovanja",
      "Za mješovite grupe odaberite 'Mješovita grupa'",
    ],
  },
  {
    number: 4,
    title: "Planiranje Datuma i Prijevoza",
    description: "Odaberite datume putovanja i vrstu prijevoza.",
    tips: [
      "Za jednodnevne izlete datumi moraju biti isti",
      "Avionski prijevoz nije dozvoljen za razrede 1-6",
      "Sustav provjerava usklađenost s pravilima škole",
    ],
  },
  {
    number: 5,
    title: "Generiranje Planova",
    description: "Kliknite 'Generiraj Planove' i dobijte 3 opcije (Regular, Middle, VIP).",
    tips: [
      "Svaki plan uključuje detaljan itinerer",
      "Usporedite cijene i aktivnosti između planova",
      "Možete regenerirati planove s izmijenjenim podacima",
    ],
  },
  {
    number: 6,
    title: "Dokumentacija i Dijeljenje",
    description: "Preuzmite PDF dokumentaciju i podijelite plan s roditeljima.",
    tips: [
      "Generirajte dozvole roditelja jednim klikom",
      "Unesite listu učenika za personalizirane dokumente",
      "Koristite link za dijeljenje za informiranje roditelja",
    ],
  },
];

const resources = [
  {
    icon: FileText,
    title: "Predložak Dozvole Roditelja",
    description: "Standardni obrazac za suglasnost roditelja s svim potrebnim poljima.",
    action: "Generiraj u aplikaciji",
    href: "/plan-trip",
  },
  {
    icon: Users,
    title: "Lista Učenika",
    description: "Obrazac za evidenciju učenika s kontaktima i medicinskim podacima.",
    action: "Generiraj u aplikaciji",
    href: "/plan-trip",
  },
  {
    icon: Calendar,
    title: "Šablon Itinerera",
    description: "Detaljni vremenski plan s aktivnostima, obrocima i pauzama.",
    action: "Automatski generisan",
    href: "/plan-trip",
  },
  {
    icon: Download,
    title: "Kompletna Dokumentacija",
    description: "Sve dokumente u jednom PDF-u za jednostavnu distribuciju.",
    action: "Preuzmite jednim klikom",
    href: "/my-trips",
  },
];

const TeacherGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Vodič za Nastavnike
          </h1>
          <p className="text-lg text-muted-foreground">
            Korak-po-korak upute za korištenje IDSS Ekskurzije – Planer Putovanja platforme.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="border-primary/20 bg-primary/5 mb-12">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                <Play className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Brzi Početak
                </h2>
                <p className="text-muted-foreground mb-4">
                  Kreirajte svoju prvu ekskurziju u manje od 5 minuta. Naš inteligentni sustav vodi vas kroz svaki korak.
                </p>
                <Link to="/plan-trip">
                  <Button className="group">
                    Započni Planiranje
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step by Step Guide */}
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Detaljni Vodič
        </h2>
        <div className="space-y-6 mb-12">
          {steps.map((step) => (
            <Card key={step.number} className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl flex-shrink-0">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {step.description}
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Savjeti</span>
                      </div>
                      <ul className="space-y-2">
                        {step.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Available Resources */}
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Dostupni Resursi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {resources.map((resource, index) => (
            <Link key={index} to={resource.href} className="block">
              <Card className="border-border bg-card hover:border-primary/40 hover:shadow-md transition-all h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <resource.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {resource.description}
                      </p>
                      <span className="text-xs text-primary font-medium inline-flex items-center gap-1">
                        {resource.action}
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Need Help */}
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Trebate Dodatnu Pomoć?
            </h3>
            <p className="text-muted-foreground mb-4">
              Naš tim za podršku dostupan je za sva vaša pitanja i nedoumice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/faq">
                <Button variant="outline">
                  Pogledaj FAQ
                </Button>
              </Link>
              <Link to="/contact">
                <Button>
                  Kontaktiraj Podršku
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default TeacherGuide;
