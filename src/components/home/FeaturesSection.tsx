import { 
  MapPin, 
  Calendar, 
  ClipboardCheck, 
  Shield, 
  Users, 
  Bell,
  FileText,
  Bus,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: MapPin,
    title: "Otkrijte Destinacije",
    description: "Pregledajte obrazovne destinacije s recenzijama, ocjenama i detaljima o usklađenosti s nastavnim planom.",
  },
  {
    icon: Calendar,
    title: "Pametno Zakazivanje",
    description: "Inteligentni odabir datuma s detekcijom konflikata, vremenskom prognozom i dostupnošću lokacija.",
  },
  {
    icon: ClipboardCheck,
    title: "Digitalne Dozvole",
    description: "Elektronski obrasci za pristanak s e-potpisima, automatskim podsjećanjima i praćenjem statusa.",
  },
  {
    icon: Shield,
    title: "Upravljanje Sigurnošću",
    description: "Hitni kontakti, medicinske informacije, alati za prebrojavanje i dijeljenje lokacije u realnom vremenu.",
  },
  {
    icon: Users,
    title: "Koordinacija Pratitelja",
    description: "Upravljanje volonterima, praćenje provjera i raspodjela grupa.",
  },
  {
    icon: Bus,
    title: "Planiranje Prijevoza",
    description: "Rezervacije autobusa, raspored sjedenja, optimizacija rute i koordinacija vozača.",
  },
  {
    icon: DollarSign,
    title: "Praćenje Budžeta",
    description: "Procjena troškova, prikupljanje uplata, praćenje rashoda i financijski izvještaji.",
  },
  {
    icon: FileText,
    title: "Graditelj Itinerera",
    description: "Drag-and-drop kreiranje rasporeda s vremenskim rezervama, planiranjem obroka i detaljima aktivnosti.",
  },
  {
    icon: Bell,
    title: "Centar za Komunikaciju",
    description: "Obavijesti, ažuriranja i notifikacije roditeljima, učenicima i osoblju.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Sve Što Vam Treba za{" "}
            <span className="text-primary">Savršenu Ekskurziju</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Naš sveobuhvatni skup alata brine o svakom detalju, tako da se možete fokusirati na kreiranje smislenih obrazovnih iskustava.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
