import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import TripPlannerForm from "@/components/trip/TripPlannerForm";
import TripRouteMap from "@/components/trip/TripRouteMap";
import TripItinerary from "@/components/trip/TripItinerary";
import { MapPin, FileText, Route, Sparkles } from "lucide-react";

const tripSchema = z.object({
  tripName: z.string().min(3, "Naziv mora imati najmanje 3 karaktera").max(100),
  departureCity: z.string().min(1, "Unesite grad polaska"),
  destinationCity: z.string().min(1, "Unesite grad odredišta"),
  departureAddress: z.string().optional(),
  destinationAddress: z.string().optional(),
  schoolType: z.string().min(1, "Odaberite vrstu škole"),
  studentCount: z.string().min(1, "Unesite broj učenika"),
  teacherCount: z.string().min(1, "Unesite broj nastavnika"),
  numberOfDays: z.string().min(1, "Odaberite broj dana"),
  tripDate: z.date().optional(),
  returnDate: z.date().optional(),
  budgetPerStudent: z.string().optional(),
  educationalObjectives: z.string().max(500).optional(),
  tripDescription: z.string().max(1000).optional(),
});

type TripFormData = z.infer<typeof tripSchema>;

const PlanTrip = () => {
  const [activeTab, setActiveTab] = useState("form");
  const [showItinerary, setShowItinerary] = useState(false);
  const { toast } = useToast();

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      tripName: "",
      departureCity: "Sarajevo",
      destinationCity: "",
      departureAddress: "",
      destinationAddress: "",
      schoolType: "",
      studentCount: "30",
      teacherCount: "3",
      numberOfDays: "3",
      budgetPerStudent: "",
      educationalObjectives: "",
      tripDescription: "",
    },
  });

  const watchedValues = form.watch();

  const onSubmit = (data: TripFormData) => {
    console.log(data);
    setShowItinerary(true);
    setActiveTab("itinerary");
    toast({
      title: "Plan Putovanja Generiran!",
      description: "Vaš plan putovanja je uspješno kreiran. Možete ga pregledati, urediti i preuzeti.",
    });
  };

  const handleGeneratePlan = () => {
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container max-w-7xl">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Route className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                IDSS — Superior Field Trip Planner
              </h1>
            </div>
            <p className="text-muted-foreground">
              Planirajte školske ekskurzije, izlete i putovanja uz napredne alate za generiranje plana puta
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="form" className="gap-2">
                <FileText className="h-4 w-4" />
                Formular
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <MapPin className="h-4 w-4" />
                Karta
              </TabsTrigger>
              <TabsTrigger value="itinerary" className="gap-2" disabled={!showItinerary}>
                <Route className="h-4 w-4" />
                Plan Puta
              </TabsTrigger>
            </TabsList>

            {/* Form Tab */}
            <TabsContent value="form" className="space-y-6">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <TripPlannerForm form={form} />
                      
                      {/* Generate Button */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Generiši Plan Putovanja
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="lg"
                          onClick={() => setActiveTab("map")}
                          className="gap-2"
                        >
                          <MapPin className="h-4 w-4" />
                          Prikaži na Karti
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Live Map Preview */}
              {(watchedValues.departureCity || watchedValues.destinationCity) && (
                <Card className="border-border">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Pregled Rute
                    </h3>
                    <TripRouteMap 
                      departureCity={watchedValues.departureCity || "Sarajevo"}
                      destinationCity={watchedValues.destinationCity || "Budapest"}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Map Tab */}
            <TabsContent value="map" className="space-y-6">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Interaktivna Karta Putovanja
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Vizualizirajte rutu od {watchedValues.departureCity || "polazišta"} do {watchedValues.destinationCity || "odredišta"}
                    </p>
                  </div>
                  <TripRouteMap 
                    departureCity={watchedValues.departureCity || "Sarajevo"}
                    destinationCity={watchedValues.destinationCity || "Budapest"}
                  />
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("form")}
                >
                  Nazad na Formular
                </Button>
                <Button onClick={handleGeneratePlan} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generiši Plan Putovanja
                </Button>
              </div>
            </TabsContent>

            {/* Itinerary Tab */}
            <TabsContent value="itinerary" className="space-y-6">
              {showItinerary && (
                <TripItinerary formData={watchedValues} />
              )}
              
              <div className="flex gap-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("form")}
                >
                  Uredi Podatke
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("map")}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Prikaži Kartu
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlanTrip;
