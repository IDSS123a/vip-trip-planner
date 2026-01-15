import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Eye, 
  Calendar, 
  MapPin, 
  Bell, 
  FileText, 
  Download,
  Clock,
  Phone,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Calendar,
    title: "Pregled Ekskurzija",
    description: "Pratite sve predstojeće ekskurzije vašeg djeteta s detaljnim informacijama o datumima, destinacijama i aktivnostima.",
  },
  {
    icon: MapPin,
    title: "Mapu Rute",
    description: "Vizualizirajte planirano putovanje s interaktivnom mapom koja prikazuje sve stanice i lokacije.",
  },
  {
    icon: Clock,
    title: "Detaljni Itinerer",
    description: "Pregledajte vremenski plan svakog dana uključujući aktivnosti, obroke i pauze.",
  },
  {
    icon: FileText,
    title: "Digitalne Dozvole",
    description: "Preuzmite i potpišite obrazac za suglasnost bez potrebe za fizičkim papirom.",
  },
  {
    icon: Bell,
    title: "Obavijesti",
    description: "Primajte pravovremene obavijesti o promjenama, podsjetnike za rokove i hitne informacije.",
  },
  {
    icon: Phone,
    title: "Hitni Kontakti",
    description: "Pristupite kontakt informacijama nastavnika i pratitelja u bilo kojem trenutku.",
  },
];

const faqItems = [
  {
    question: "Kako mogu pristupiti informacijama o ekskurziji?",
    answer: "Nastavnik će vam poslati link za dijeljenje koji omogućuje pristup svim informacijama o ekskurziji bez potrebe za prijavom.",
  },
  {
    question: "Trebam li kreirati račun?",
    answer: "Ne, za pregledavanje informacija o ekskurziji nije potreban račun. Jednostavno koristite link koji ste dobili od nastavnika.",
  },
  {
    question: "Kako mogu potpisati suglasnost?",
    answer: "Preuzmite PDF obrazac za suglasnost, ispišite ga, potpišite i vratite nastavniku fizički ili skenirano putem e-maila.",
  },
  {
    question: "Što ako imam pitanja o ekskurziji?",
    answer: "Kontaktirajte direktno nastavnika putem kontakt informacija navedenih u planu ekskurzije ili škole.",
  },
  {
    question: "Mogu li vidjeti tko su drugi učenici i pratitelji?",
    answer: "Iz razloga privatnosti, detaljna lista učenika nije javno dostupna. Vidjet ćete samo opće informacije poput broja učenika i pratitelja.",
  },
];

const ParentPortal = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Eye className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Portal za Roditelje
          </h1>
          <p className="text-lg text-muted-foreground">
            Ostanite informirani o školskim ekskurzijama vašeg djeteta. Pregledajte planove, preuzmite dokumente i budite u toku.
          </p>
        </div>

        {/* How It Works */}
        <Card className="border-primary/20 bg-primary/5 mb-12">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-foreground mb-6 text-center">
              Kako Pristupiti Informacijama
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: 1,
                  title: "Primite Link",
                  description: "Nastavnik vam šalje link za dijeljenje putem e-maila ili poruke.",
                },
                {
                  step: 2,
                  title: "Otvorite Link",
                  description: "Kliknite na link da biste vidjeli sve detalje o ekskurziji.",
                },
                {
                  step: 3,
                  title: "Preuzmite Dokumente",
                  description: "Preuzmite suglasnost i ostale potrebne dokumente.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Što Možete Vidjeti
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Checklist for Parents */}
        <Card className="border-border bg-card mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Kontrolna Lista za Roditelje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Pregledajte plan ekskurzije i itinerer",
                "Potpišite i vratite obrazac za suglasnost",
                "Ažurirajte medicinske informacije ako je potrebno",
                "Provjerite popis potrebne opreme",
                "Zapišite hitne kontakte nastavnika",
                "Pripremite džeparac prema preporukama",
                "Označite datume u kalendaru",
                "Kontaktirajte nastavnika s pitanjima",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Česta Pitanja
        </h2>
        <div className="space-y-4 mb-12">
          {faqItems.map((item, index) => (
            <Card key={index} className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  {item.question}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact */}
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Imate Pitanja?
            </h3>
            <p className="text-muted-foreground mb-4">
              Za sva pitanja o ekskurziji, kontaktirajte nastavnika vašeg djeteta ili školu.
            </p>
            <Link to="/contact">
              <Button className="group">
                Kontaktirajte Školu
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ParentPortal;
