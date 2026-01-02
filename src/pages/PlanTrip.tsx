import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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
import { MapPin, FileText, Route, Sparkles, Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const tripSchema = z.object({
  tripName: z.string().optional(),
  departureCity: z.string().min(1, "Unesite grad polaska"),
  destinations: z.array(z.string()).min(1, "Dodajte barem jednu destinaciju"),
  departureAddress: z.string().optional(),
  tripType: z.string().min(1, "Odaberite tip ekskurzije"),
  gradeLevel: z.string().min(1, "Odaberite razred"),
  studentCount: z.string().min(1, "Unesite broj učenika"),
  chaperones: z.array(z.string()).optional(),
  transport: z.string().min(1, "Odaberite prevoz"),
  tripDate: z.date().optional(),
  returnDate: z.date().optional(),
  budgetPerStudent: z.string().optional(),
  educationalFocus: z.string().optional(),
  specialNeeds: z.string().optional(),
});

type TripFormData = z.infer<typeof tripSchema>;

interface TripPlansData {
  plans: any[];
  route_coordinates: any[];
  educational_resources: any[];
}

const PlanTrip = () => {
  const [activeTab, setActiveTab] = useState("form");
  const [plansData, setPlansData] = useState<TripPlansData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      tripName: "",
      departureCity: "Sarajevo",
      destinations: [],
      departureAddress: "",
      tripType: "",
      gradeLevel: "",
      studentCount: "14",
      chaperones: [],
      transport: "bus",
      budgetPerStudent: "",
      educationalFocus: "",
      specialNeeds: "",
    },
  });

  const watchedValues = form.watch();
  const destinations = watchedValues.destinations || [];
  const chaperones = watchedValues.chaperones || [];

  const onSubmit = async (data: TripFormData) => {
    setIsLoading(true);
    setError(null);
    setActiveTab("itinerary");

    try {
      console.log("Generating trip plans with data:", data);

      const { data: responseData, error: functionError } = await supabase.functions.invoke('generate-trip-plans', {
        body: {
          departureCity: data.departureCity,
          destinations: data.destinations,
          tripType: data.tripType,
          gradeLevel: data.gradeLevel,
          studentCount: parseInt(data.studentCount) || 14,
          chaperones: data.chaperones || [],
          transport: data.transport,
          departureDate: data.tripDate ? format(data.tripDate, "yyyy-MM-dd") : "",
          returnDate: data.returnDate ? format(data.returnDate, "yyyy-MM-dd") : "",
          budget: data.budgetPerStudent ? parseInt(data.budgetPerStudent) : undefined,
          educationalFocus: data.educationalFocus || "",
          specialNeeds: data.specialNeeds || "",
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      console.log("Received plans data:", responseData);
      setPlansData(responseData);

      toast({
        title: "3 Plana Putovanja Generirana!",
        description: "Vaši planovi putovanja su uspješno kreirani. Pregledajte Budget, Balanced i Premium opcije.",
      });
    } catch (err) {
      console.error("Error generating plans:", err);
      const errorMessage = err instanceof Error ? err.message : "Greška pri generiranju planova";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Greška",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
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
              Generates 3 verified plans & full cost estimates across multiple countries.
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
              <TabsTrigger value="itinerary" className="gap-2">
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
                      
                      {/* Generate Buttons */}
                      <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="gap-2"
                          disabled={isLoading}
                        >
                          <Sparkles className="h-4 w-4" />
                          Generate 3 Plans (Live)
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="lg"
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Generate Templates (Offline)
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="lg"
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Load Browser Saves
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button type="button" variant="outline" className="gap-2">
                          <Download className="h-4 w-4" />
                          Load from File
                        </Button>
                        <Button type="button" variant="outline" className="gap-2">
                          <Printer className="h-4 w-4" />
                          Print
                        </Button>
                        <Button type="button" variant="outline" className="gap-2">
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Live Map Preview */}
              {(watchedValues.departureCity || destinations.length > 0) && (
                <Card className="border-border">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Pregled Rute
                    </h3>
                    <TripRouteMap 
                      departureCity={watchedValues.departureCity || "Sarajevo"}
                      destinationCity={destinations[destinations.length - 1] || ""}
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
                      Vizualizirajte rutu: {watchedValues.departureCity || "Polazište"} → {destinations.join(" → ") || "Destinacije"}
                    </p>
                  </div>
                  <TripRouteMap 
                    departureCity={watchedValues.departureCity || "Sarajevo"}
                    destinationCity={destinations[destinations.length - 1] || "Budapest"}
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
                <Button onClick={handleGeneratePlan} className="gap-2" disabled={isLoading}>
                  <Sparkles className="h-4 w-4" />
                  Generiši 3 Plana Putovanja
                </Button>
              </div>
            </TabsContent>

            {/* Itinerary Tab */}
            <TabsContent value="itinerary" className="space-y-6">
              <TripItinerary 
                plansData={plansData}
                isLoading={isLoading}
                error={error}
                chaperones={chaperones}
              />
              
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
