import { MapPin, ClipboardList, Users, PartyPopper } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MapPin,
    title: "Odaberite Destinaciju",
    description: "Pregledajte preporučene obrazovne lokacije prema IDSS Pravilniku ili dodajte vlastitu sa svim potrebnim detaljima.",
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "Isplanirajte Detalje",
    description: "Postavite datume, kreirajte itinerere, organizirajte prijevoz i budžet — sve na jednom mjestu.",
  },
  {
    number: "03",
    icon: Users,
    title: "Prikupite Saglasnosti",
    description: "Generišite saglasnosti roditelja prema Prilogu 1 IDSS Pravilnika i sigurno upravljajte medicinskim podacima.",
  },
  {
    number: "04",
    icon: PartyPopper,
    title: "Uživajte u Ekskurziji",
    description: "Koristite mobilne alate za prebrojavanje učenika, hitne kontakte i ažuriranja u realnom vremenu.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Kako <span className="text-primary">Funkcioniše</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Četiri jednostavna koraka za besprijekorno planiranje IDSS ekskurzija.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  {/* Step Number */}
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <step.icon className="h-8 w-8" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {step.number}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
