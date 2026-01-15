import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Accessibility as AccessibilityIcon, 
  Eye, 
  Ear, 
  Move, 
  Brain, 
  MessageSquare,
  CheckCircle,
  Keyboard,
  Monitor
} from "lucide-react";

const accessibilityFeatures = [
  {
    icon: Eye,
    title: "Vizualna Pristupačnost",
    description: "Podržavamo korisnike s oštećenjem vida.",
    features: [
      "Kompatibilnost sa čitačima ekrana (screen readers)",
      "Visoki kontrast teksta i pozadine",
      "Mogućnost povećanja teksta do 200%",
      "Alt tekstovi za sve slike i ikone",
      "Jasna hijerarhija naslova (H1-H6)",
    ],
  },
  {
    icon: Ear,
    title: "Slušna Pristupačnost",
    description: "Podržavamo korisnike s oštećenjem sluha.",
    features: [
      "Sav sadržaj dostupan bez zvuka",
      "Vizualne obavijesti umjesto zvučnih",
      "Titlovi za video sadržaje (kada su dostupni)",
      "Tekstualne alternative za audio upute",
    ],
  },
  {
    icon: Move,
    title: "Motorička Pristupačnost",
    description: "Podržavamo korisnike s ograničenom pokretljivošću.",
    features: [
      "Potpuna navigacija tipkovnicom",
      "Veliki, lako klikabilni elementi",
      "Nema vremenski ograničenih interakcija",
      "Konzistentna navigacija na svim stranicama",
      "Skip-to-content linkovi",
    ],
  },
  {
    icon: Brain,
    title: "Kognitivna Pristupačnost",
    description: "Jednostavno i intuitivno korisničko iskustvo.",
    features: [
      "Jasna i jednostavna struktura stranica",
      "Dosljedni dizajn i navigacija",
      "Izbjegavanje automatskog osvježavanja",
      "Čitljivi fontovi i veličine teksta",
      "Jasne upute i povratne informacije",
    ],
  },
];

const keyboardShortcuts = [
  { key: "Tab", action: "Navigacija naprijed kroz interaktivne elemente" },
  { key: "Shift + Tab", action: "Navigacija unatrag kroz interaktivne elemente" },
  { key: "Enter", action: "Aktiviranje odabranog elementa (gumba, linka)" },
  { key: "Space", action: "Aktiviranje checkboxa ili gumba" },
  { key: "Escape", action: "Zatvaranje dijaloga ili padajućeg izbornika" },
  { key: "Arrow Keys", action: "Navigacija unutar izbornika i popisa" },
];

const wcagCompliance = [
  {
    level: "A",
    title: "Osnovna Razina",
    items: [
      "Alt tekst za slike",
      "Navigacija tipkovnicom",
      "Čitljiv tekst bez CSS-a",
    ],
  },
  {
    level: "AA",
    title: "Srednja Razina",
    items: [
      "Minimalni kontrast 4.5:1",
      "Promjenjiva veličina teksta",
      "Fokus vidljiv na svim elementima",
    ],
  },
  {
    level: "Cilj",
    title: "WCAG 2.1 AA",
    items: [
      "Kontinuirano poboljšavanje",
      "Redovito testiranje",
      "Korisničke povratne informacije",
    ],
  },
];

const Accessibility = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <AccessibilityIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pristupačnost
          </h1>
          <p className="text-lg text-muted-foreground">
            Posvećeni smo stvaranju inkluzivne platforme dostupne svim korisnicima, bez obzira na njihove sposobnosti.
          </p>
        </div>

        {/* Commitment Statement */}
        <Card className="border-primary/20 bg-primary/5 mb-12">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Naša Posvećenost Pristupačnosti
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Vjerujemo da svaka osoba zaslužuje jednaki pristup informacijama i alatima za planiranje ekskurzija. 
              Kontinuirano radimo na poboljšanju pristupačnosti naše platforme u skladu s WCAG 2.1 smjernicama 
              i najboljim praksama web pristupačnosti.
            </p>
          </CardContent>
        </Card>

        {/* Accessibility Features */}
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Značajke Pristupačnosti
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {accessibilityFeatures.map((feature, index) => (
            <Card key={index} className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Keyboard Navigation */}
        <Card className="border-border bg-card mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-primary" />
              Navigacija Tipkovnicom
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Naša platforma je u potpunosti navigabilna pomoću tipkovnice. Evo glavnih prečaca:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {keyboardShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <kbd className="px-3 py-1.5 bg-background border border-border rounded text-sm font-mono">
                    {shortcut.key}
                  </kbd>
                  <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* WCAG Compliance */}
        <h2 className="text-2xl font-bold text-foreground mb-6">
          WCAG Usklađenost
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {wcagCompliance.map((level, index) => (
            <Card key={index} className="border-border bg-card">
              <CardContent className="p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mx-auto mb-4">
                  {level.level}
                </div>
                <h3 className="font-semibold text-foreground mb-4">{level.title}</h3>
                <ul className="space-y-2">
                  {level.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Browser and Assistive Technology Support */}
        <Card className="border-border bg-card mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Podržane Tehnologije
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium text-foreground mb-3">Preglednici</h4>
                <ul className="space-y-2">
                  {["Chrome (najnovija verzija)", "Firefox (najnovija verzija)", "Safari (najnovija verzija)", "Edge (najnovija verzija)"].map((browser, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      {browser}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-3">Asistivne Tehnologije</h4>
                <ul className="space-y-2">
                  {["NVDA", "JAWS", "VoiceOver (macOS/iOS)", "TalkBack (Android)"].map((tech, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Prijavite Problem s Pristupačnošću
            </h3>
            <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
              Ako naiđete na bilo kakvu prepreku u pristupačnosti ili imate prijedloge za poboljšanje, 
              molimo vas da nas kontaktirate. Vaše povratne informacije su nam iznimno važne.
            </p>
            <a
              href="mailto:accessibility@idss.ba"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              accessibility@idss.ba
            </a>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Accessibility;
