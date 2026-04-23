import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import ShareTripDialog from "@/components/trip/ShareTripDialog";
import IdssComplianceBanner from "@/components/trip/IdssComplianceBanner";
import { useTripStorage } from "@/hooks/useTripStorage";
import { usePdfExport } from "@/hooks/usePdfExport";
import { MapPin, FileText, Route, Sparkles, Download, Printer, Save, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { tripValidationSchema, type ValidatedTripFormData } from "@/lib/tripValidation";
import type { Student } from "@/components/trip/StudentListInput";

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
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [previousYearDestination, setPreviousYearDestination] = useState("");
  
  const { toast } = useToast();
  const { saveTrip, updateTrip, makePublic, isSaving } = useTripStorage();
  const { exportToPdf, isExporting } = usePdfExport();

  const form = useForm<ValidatedTripFormData>({
    resolver: zodResolver(tripValidationSchema),
    defaultValues: {
      tripName: "",
      departureCity: "Sarajevo",
      destinations: [],
      departureAddress: "IDSS, Buka 13, 71 000 Sarajevo, Bosna i Hercegovina",
      tripType: undefined,
      gradeLevel: "",
      studentCount: "",
      chaperones: [],
      transport: undefined,
      tripDate: undefined,
      returnDate: undefined,
      budgetPerStudent: "",
      educationalFocus: "",
      specialNeeds: "",
      mealPlan: undefined,
      accommodationType: undefined,
      emergencyContact: "",
      insuranceIncluded: false,
      medicalInfo: "",
    },
    mode: "onChange", // Validate on every change for real-time feedback
  });

  const watchedValues = form.watch();
  const destinations = watchedValues.destinations || [];
  const chaperones = watchedValues.chaperones || [];

  const onSubmit = async (data: ValidatedTripFormData) => {
    setIsLoading(true);
    setError(null);
    setActiveTab("itinerary");

    try {
      // Debug log removed for production

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
          previousYearDestination: previousYearDestination || undefined,
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (responseData.error) {
        throw new Error(responseData.error);
      }

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

  const handleSaveTrip = async () => {
    if (!plansData) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Prvo generirajte plan putovanja.",
      });
      return;
    }

    const data = form.getValues();
    const tripName = data.tripName || `${data.departureCity} → ${data.destinations.join(" → ")}`;

    if (savedTripId) {
      // Update existing trip
      const success = await updateTrip(savedTripId, {
        name: tripName,
        departureCity: data.departureCity,
        destinations: data.destinations,
        departureDate: data.tripDate ? format(data.tripDate, "yyyy-MM-dd") : undefined,
        returnDate: data.returnDate ? format(data.returnDate, "yyyy-MM-dd") : undefined,
        gradeLevel: data.gradeLevel,
        studentCount: parseInt(data.studentCount) || 14,
        chaperones: data.chaperones || [],
        transport: data.transport,
        educationalFocus: data.educationalFocus,
        specialNeeds: data.specialNeeds,
        plansData: plansData,
        selectedPlanId: selectedPlanIndex + 1,
      });
    } else {
      // Save new trip
      const savedTrip = await saveTrip({
        name: tripName,
        departureCity: data.departureCity,
        destinations: data.destinations,
        departureDate: data.tripDate ? format(data.tripDate, "yyyy-MM-dd") : undefined,
        returnDate: data.returnDate ? format(data.returnDate, "yyyy-MM-dd") : undefined,
        gradeLevel: data.gradeLevel,
        studentCount: parseInt(data.studentCount) || 14,
        chaperones: data.chaperones || [],
        transport: data.transport,
        educationalFocus: data.educationalFocus,
        specialNeeds: data.specialNeeds,
        plansData: plansData,
        selectedPlanId: selectedPlanIndex + 1,
      });

      if (savedTrip) {
        setSavedTripId(savedTrip.id);
        setShareId(savedTrip.shareId);
      }
    }
  };

  const handleMakePublic = async () => {
    if (!savedTripId) return;

    const newShareId = await makePublic(savedTripId);
    if (newShareId) {
      setShareId(newShareId);
      setIsPublic(true);
      toast({
        title: "Plan je sada javno dostupan!",
        description: "Možete podijeliti link s drugima.",
      });
    }
  };

  const handleExportPdf = () => {
    if (!plansData?.plans?.[selectedPlanIndex]) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Odaberite plan za export.",
      });
      return;
    }

    const data = form.getValues();
    exportToPdf({
      tripName: data.tripName || `${data.departureCity} → ${data.destinations.join(" → ")}`,
      departureCity: data.departureCity,
      destinations: data.destinations,
      departureDate: data.tripDate ? format(data.tripDate, "yyyy-MM-dd") : undefined,
      returnDate: data.returnDate ? format(data.returnDate, "yyyy-MM-dd") : undefined,
      gradeLevel: data.gradeLevel,
      studentCount: parseInt(data.studentCount) || 14,
      chaperones: data.chaperones || [],
      plan: plansData.plans[selectedPlanIndex],
    });
  };

  const handlePrint = () => {
    window.print();
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
                IDSS — Planer Ekskurzija
              </h1>
            </div>
            <p className="text-muted-foreground">
              Generira 3 verificirana plana i kompletne procjene troškova za više zemalja.
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
                      <IdssComplianceBanner
                        gradeLevel={watchedValues.gradeLevel}
                        destinations={destinations}
                        previousYearDestination={previousYearDestination}
                        onPreviousYearChange={setPreviousYearDestination}
                      />
                      
                      <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="gap-2"
                          disabled={isLoading}
                        >
                          <Sparkles className="h-4 w-4" />
                          {isLoading ? "Generiranje..." : "Generate 3 Plans (Live)"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="lg"
                          className="gap-2"
                          onClick={() => {
                            const data = form.getValues();
                            try {
                              localStorage.setItem('idss-offline-template', JSON.stringify(data));
                              toast({ title: "Predložak spremljen!", description: "Podaci su spremljeni za offline korištenje." });
                            } catch { toast({ variant: "destructive", title: "Greška", description: "Nije moguće spremiti predložak." }); }
                          }}
                        >
                          <FileText className="h-4 w-4" />
                          Generate Templates (Offline)
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="lg"
                          className="gap-2"
                          onClick={() => {
                            try {
                              const saved = localStorage.getItem('idss-offline-template');
                              if (!saved) { toast({ variant: "destructive", title: "Nema podataka", description: "Nema spremljenih predložaka u pregledniku." }); return; }
                              const data = JSON.parse(saved);
                              if (data.tripName) form.setValue('tripName', data.tripName);
                              if (data.departureCity) form.setValue('departureCity', data.departureCity);
                              if (data.destinations) form.setValue('destinations', data.destinations);
                              if (data.gradeLevel) form.setValue('gradeLevel', data.gradeLevel);
                              if (data.studentCount) form.setValue('studentCount', data.studentCount);
                              if (data.chaperones) form.setValue('chaperones', data.chaperones);
                              if (data.transport) form.setValue('transport', data.transport);
                              if (data.educationalFocus) form.setValue('educationalFocus', data.educationalFocus);
                              if (data.specialNeeds) form.setValue('specialNeeds', data.specialNeeds);
                              if (data.budgetPerStudent) form.setValue('budgetPerStudent', data.budgetPerStudent);
                              if (data.plansData) setPlansData(data.plansData);
                              toast({ title: "Podaci učitani!", description: "Spremljeni podaci su uspješno učitani." });
                            } catch { toast({ variant: "destructive", title: "Greška", description: "Nije moguće učitati podatke." }); }
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Load Browser Saves
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button type="button" variant="outline" className="gap-2" onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.json';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              try {
                                const data = JSON.parse(ev.target?.result as string);
                                if (data.tripName) form.setValue('tripName', data.tripName);
                                if (data.departureCity) form.setValue('departureCity', data.departureCity);
                                if (data.destinations) form.setValue('destinations', data.destinations);
                                if (data.gradeLevel) form.setValue('gradeLevel', data.gradeLevel);
                                if (data.studentCount) form.setValue('studentCount', data.studentCount);
                                if (data.chaperones) form.setValue('chaperones', data.chaperones);
                                if (data.plansData) setPlansData(data.plansData);
                                toast({ title: "Učitano!", description: "Podaci su učitani iz datoteke." });
                              } catch { toast({ variant: "destructive", title: "Greška", description: "Neispravna datoteka." }); }
                            };
                            reader.readAsText(file);
                          };
                          input.click();
                        }}>
                          <Download className="h-4 w-4" />
                          Load from File
                        </Button>
                        <Button type="button" variant="outline" className="gap-2" onClick={handlePrint}>
                          <Printer className="h-4 w-4" />
                          Print
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="gap-2"
                          onClick={handleExportPdf}
                          disabled={!plansData || isExporting}
                        >
                          <Download className="h-4 w-4" />
                          {isExporting ? "Exporting..." : "Download PDF"}
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
                      allDestinations={destinations}
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
                    routeCoordinates={plansData?.route_coordinates}
                    allDestinations={destinations}
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
              {/* Action buttons for saving/sharing */}
              {plansData && (
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleSaveTrip} 
                    className="gap-2"
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Spremanje..." : savedTripId ? "Ažuriraj Plan" : "Spremi Plan"}
                  </Button>
                  
                  <ShareTripDialog
                    shareId={shareId}
                    tripName={watchedValues.tripName || `${watchedValues.departureCity} → ${destinations.join(" → ")}`}
                    isPublic={isPublic}
                    onMakePublic={handleMakePublic}
                    disabled={!savedTripId}
                  />

                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={handleExportPdf}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export PDF"}
                  </Button>

                  <Button variant="outline" className="gap-2" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              )}

              <TripItinerary 
                plansData={plansData}
                isLoading={isLoading}
                error={error}
                chaperones={chaperones}
                tripName={watchedValues.tripName || `${watchedValues.departureCity} → ${destinations.join(" → ")}`}
                departureCity={watchedValues.departureCity}
                destinations={destinations}
                departureDate={watchedValues.tripDate ? format(watchedValues.tripDate, "yyyy-MM-dd") : undefined}
                returnDate={watchedValues.returnDate ? format(watchedValues.returnDate, "yyyy-MM-dd") : undefined}
                gradeLevel={watchedValues.gradeLevel}
                studentCount={parseInt(watchedValues.studentCount) || 20}
                students={students}
                onStudentsChange={setStudents}
                onSave={(planIdx) => {
                  setSelectedPlanIndex(planIdx);
                  handleSaveTrip();
                }}
                onExportPdf={(planIdx) => {
                  setSelectedPlanIndex(planIdx);
                  handleExportPdf();
                }}
                onSwitchToMap={() => setActiveTab("map")}
                selectedPlanIndex={selectedPlanIndex}
                onSelectPlan={setSelectedPlanIndex}
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
