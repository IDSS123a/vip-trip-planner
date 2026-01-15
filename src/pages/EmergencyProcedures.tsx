import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  Phone, 
  Heart, 
  Users, 
  MapPin, 
  Bell,
  FileText,
  Shield,
  Radio,
  Clock,
  CheckCircle
} from "lucide-react";

const emergencyProcedures = [
  {
    icon: Heart,
    title: "Medicinska Hitnoća",
    priority: "high",
    steps: [
      "Osigurajte sigurnost ostalih učenika",
      "Pozovite hitnu pomoć (124) ako je potrebno",
      "Pružite prvu pomoć prema osposobljenosti",
      "Obavijestite voditelja ekskurzije",
      "Kontaktirajte roditelje/skrbnike",
      "Dokumentirajte incident",
    ],
  },
  {
    icon: MapPin,
    title: "Izgubljeni Učenik",
    priority: "high",
    steps: [
      "Odmah zaustavite grupu i prebrojite",
      "Obavijestite sve pratitelje",
      "Definirajte pretraživačke zone",
      "Kontaktirajte sigurnost lokacije",
      "Pozovite policiju (122) nakon 15 minuta",
      "Obavijestite školu i roditelje",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Evakuacija",
    priority: "high",
    steps: [
      "Aktivirajte evakuacijski plan lokacije",
      "Okupite učenike na sigurnom mjestu",
      "Izvršite prebrojavanje",
      "Slijedite upute osoblja lokacije",
      "Obavijestite školu o situaciji",
      "Čekajte daljnje upute",
    ],
  },
  {
    icon: Radio,
    title: "Komunikacijski Prekid",
    priority: "medium",
    steps: [
      "Pokušajte alternativne komunikacijske kanale",
      "Pronađite lokaciju s boljim signalom",
      "Koristite javni telefon ako je dostupan",
      "Javite se na unaprijed dogovoreno vrijeme",
      "Slijedite protokol 'check-in'",
    ],
  },
  {
    icon: Users,
    title: "Sukob ili Nasilje",
    priority: "medium",
    steps: [
      "Odvojite uključene strane",
      "Osigurajte sigurnost svih učenika",
      "Dokumentirajte incident",
      "Pozovite pomoć ako je potrebno",
      "Obavijestite školu i roditelje",
      "Nastavite aktivnosti nakon smirivanja",
    ],
  },
  {
    icon: Shield,
    title: "Sigurnosna Prijetnja",
    priority: "high",
    steps: [
      "Slijedite upute nadležnih službi",
      "Okupite i zaštitite učenike",
      "Izvršite 'lockdown' ako je potrebno",
      "Održavajte komunikaciju sa školom",
      "Ne napuštajte sigurnu lokaciju",
      "Čekajte službeno razrješenje situacije",
    ],
  },
];

const contactList = [
  { name: "Opći Hitan Broj", number: "112", description: "Za sve hitne situacije" },
  { name: "Policija", number: "122", description: "Sigurnosne prijetnje, nestanci" },
  { name: "Vatrogasci", number: "123", description: "Požar, tehničke intervencije" },
  { name: "Hitna Pomoć", number: "124", description: "Medicinske hitnoće" },
  { name: "IDSS Škola", number: "+387 33 560 520", description: "Uprava škole" },
];

const EmergencyProcedures = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Hitni Postupci
          </h1>
          <p className="text-lg text-muted-foreground">
            Protokoli za upravljanje hitnim situacijama tijekom školskih ekskurzija. Budite pripremljeni za svaku situaciju.
          </p>
        </div>

        {/* Emergency Contacts */}
        <Card className="border-destructive/50 bg-destructive/5 mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Phone className="h-5 w-5" />
              Hitni Kontakti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {contactList.map((contact, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-background border border-border">
                  <p className="text-2xl font-bold text-foreground">{contact.number}</p>
                  <p className="text-sm font-medium text-foreground">{contact.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{contact.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* General Protocol */}
        <Card className="border-border bg-card mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Opći Protokol za Hitne Situacije
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: 1, title: "Procjena", desc: "Brzo procijenite situaciju i rizike" },
                { step: 2, title: "Sigurnost", desc: "Osigurajte sigurnost svih učenika" },
                { step: 3, title: "Komunikacija", desc: "Obavijestite nadležne i zatražite pomoć" },
                { step: 4, title: "Dokumentacija", desc: "Zabilježite sve detalje incidenta" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mx-auto mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Specific Procedures */}
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Specifični Protokoli
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {emergencyProcedures.map((procedure, index) => (
            <Card 
              key={index} 
              className={`border-border bg-card ${
                procedure.priority === "high" ? "border-l-4 border-l-destructive" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      procedure.priority === "high" ? "bg-destructive/10" : "bg-primary/10"
                    }`}>
                      <procedure.icon className={`h-5 w-5 ${
                        procedure.priority === "high" ? "text-destructive" : "text-primary"
                      }`} />
                    </div>
                    <CardTitle className="text-lg">{procedure.title}</CardTitle>
                  </div>
                  {procedure.priority === "high" && (
                    <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                      Visoki Prioritet
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {procedure.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground flex-shrink-0">
                        {stepIndex + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pre-Trip Preparation */}
        <Card className="border-border bg-card mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Priprema Prije Polaska
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Provjerite sve hitne kontakte učenika",
                "Pripremite prvu pomoć i medicinske informacije",
                "Definirajte komunikacijski lanac",
                "Odredite sastajališta za slučaj razdvajanja",
                "Provjerite lokalne hitne brojeve destinacije",
                "Osigurajte backup telefone i baterije",
                "Napravite kopije svih dokumenata",
                "Provedite kratki briefing s pratiteljima",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Note */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center">
            <Bell className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Važna Napomena
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ovi protokoli služe kao smjernice. Svaka situacija je jedinstvena i zahtijeva procjenu na licu mjesta. 
              U slučaju sumnje, uvijek pozovite profesionalnu pomoć. Sigurnost učenika je prioritet broj jedan.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default EmergencyProcedures;
