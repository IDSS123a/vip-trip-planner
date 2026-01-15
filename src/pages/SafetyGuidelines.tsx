import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  AlertTriangle, 
  Phone, 
  Users, 
  Heart, 
  MapPin, 
  Clock, 
  CheckCircle,
  FileText,
  Bus
} from "lucide-react";

const safetyGuidelines = [
  {
    icon: Users,
    title: "Omjer Pratitelja i Učenika",
    description: "Obavezni minimalni omjeri prema uzrastu učenika.",
    details: [
      "Predškolski: 1 pratitelj na 4 učenika",
      "Razredi 1-4: 1 pratitelj na 6 učenika",
      "Razredi 5-8: 1 pratitelj na 8 učenika",
      "Razredi 9-13: 1 pratitelj na 10 učenika",
    ],
  },
  {
    icon: Phone,
    title: "Hitni Kontakti",
    description: "Svaki pratitelj mora imati pristup hitnim kontaktima.",
    details: [
      "Lista svih hitnih kontakata roditelja",
      "Kontakti škole i uprave",
      "Lokalni hitni brojevi (112, 122, 123, 124)",
      "Kontakti destinacije/objekta",
    ],
  },
  {
    icon: Heart,
    title: "Medicinske Informacije",
    description: "Evidencija zdravstvenih potreba svakog učenika.",
    details: [
      "Alergije i medicinska stanja",
      "Potrebni lijekovi i doziranje",
      "Posebne dijetetske potrebe",
      "Kontakti liječnika/pedijatra",
    ],
  },
  {
    icon: MapPin,
    title: "Praćenje Lokacije",
    description: "Kontinuirano praćenje grupe tijekom ekskurzije.",
    details: [
      "Redovno prebrojavanje učenika",
      "Određeni sastajališta za slučaj razdvajanja",
      "GPS praćenje za veće grupe",
      "Buddy sistem za mlađe učenike",
    ],
  },
  {
    icon: Bus,
    title: "Sigurnost Prijevoza",
    description: "Pravila sigurnosti tijekom putovanja.",
    details: [
      "Obavezno korištenje sigurnosnih pojaseva",
      "Zabrana stajanja tijekom vožnje",
      "Redovite pauze na dužim putovanjima",
      "Provjera vozila prije polaska",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Protokol za Hitne Situacije",
    description: "Jasno definirani postupci za različite scenarije.",
    details: [
      "Evakuacijski plan za svaku lokaciju",
      "Protokol za izgubljenog učenika",
      "Postupak u slučaju medicinske hitnoće",
      "Komunikacijski lanac s roditeljima",
    ],
  },
];

const checklistItems = [
  "Prikupljene sve potpisane suglasnosti roditelja",
  "Kompletirana lista medicinskih informacija",
  "Pripremljena torba za prvu pomoć",
  "Potvrđeni svi hitni kontakti",
  "Provjeren prijevoz i vozač",
  "Napravljena rezervacija destinacije",
  "Pripremljen detaljni itinerer",
  "Obaviještena uprava škole",
  "Napravljena lista za prebrojavanje",
  "Pripremljene identifikacijske kartice za učenike",
];

const SafetyGuidelines = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Sigurnosne Smjernice
          </h1>
          <p className="text-lg text-muted-foreground">
            Sigurnost učenika je naš prioritet. Slijedite ove smjernice za sigurnu i uspješnu ekskurziju.
          </p>
        </div>

        {/* Guidelines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {safetyGuidelines.map((guideline, index) => (
            <Card key={index} className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <guideline.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{guideline.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{guideline.description}</p>
                <ul className="space-y-2">
                  {guideline.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pre-Trip Checklist */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Kontrolna Lista Prije Polaska</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Provjerite sve stavke prije ekskurzije
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact Card */}
        <Card className="border-destructive/50 bg-destructive/5 mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive">Hitni Kontakti</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Zapamtite ove brojeve za hitne situacije
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Opći Hitan Broj", number: "112" },
                { name: "Policija", number: "122" },
                { name: "Vatrogasci", number: "123" },
                { name: "Hitna Pomoć", number: "124" },
              ].map((contact, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-background border border-border">
                  <p className="text-2xl font-bold text-foreground">{contact.number}</p>
                  <p className="text-sm text-muted-foreground">{contact.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SafetyGuidelines;
