import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import DailyTimeline from "@/components/trip/DailyTimeline";
import BudgetTracker from "@/components/trip/BudgetTracker";
import ChecklistTemplates from "@/components/trip/ChecklistTemplates";
import { useTripStorage } from "@/hooks/useTripStorage";
import { usePdfExport } from "@/hooks/usePdfExport";
import { MapPin, FileText, Route, Sparkles, Download, Printer, Save, Share2, Clock, DollarSign, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { tripValidationSchema, type ValidatedTripFormData } from "@/lib/tripValidation";
import type { Student } from "@/components/trip/StudentListInput";
import { getGradePlan, violatesRotation } from "@/lib/idssRegulations";
import { useTranslation } from "react-i18next";

interface TripPlansData {
  plans: any[];
  route_coordinates: any[];
  educational_resources: any[];
}

const PlanTrip = () => {
  const { t, i18n } = useTranslation();
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
  const [rotationOverride, setRotationOverride] = useState(false);
  const [rotationOverrideReason, setRotationOverrideReason] = useState("");
  const location = useLocation();
  
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
      tripPriorities: "",
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

  // Pre-popuni razred ako je korisnik došao iz kataloga (/destinations)
  useEffect(() => {
    const preset = (location.state as { presetGradeLevel?: string } | null)?.presetGradeLevel;
    if (preset && !form.getValues("gradeLevel")) {
      form.setValue("gradeLevel", preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const onSubmit = async (data: ValidatedTripFormData) => {
    // Rotation guard: ako je rotacija prekršena a override nije potvrđen, blokiraj.
    const plan = getGradePlan(data.gradeLevel);
    if (plan && plan.rotationDestinations.length > 0 && previousYearDestination) {
      const rot = violatesRotation(data.gradeLevel, data.destinations, [previousYearDestination]);
      if (rot.violates && (!rotationOverride || rotationOverrideReason.trim().length < 10)) {
        toast({
          variant: "destructive",
          title: "Pravilo rotacije prekršeno",
          description: rotationOverride
            ? "Unesite obrazloženje override-a (najmanje 10 karaktera)."
            : rot.message,
        });
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setActiveTab("itinerary");

    try {
      // Debug log removed for production

      const { data: responseData, error: functionError } = await supabase.functions.invoke('generate-trip-plans', {
        body: {
          departureCity: data.departureCity,
          departureAddress: data.departureAddress,
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
          tripPriorities: data.tripPriorities || "",
          mealPlan: data.mealPlan || undefined,
          accommodationType: data.accommodationType || undefined,
          medicalInfo: data.medicalInfo || undefined,
          previousYearDestination: previousYearDestination || undefined,
          language: (i18n.language || "bs").startsWith("en") ? "en" : "bs",
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
        title: t("planToasts.generatedTitle"),
        description: t("planToasts.generatedDesc"),
      });
    } catch (err) {
      console.error("Error generating plans:", err);
      const errorMessage = err instanceof Error ? err.message : t("planToasts.generationFailed");
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: t("toasts.errorTitle"),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = () => {
    form.handleSubmit(onSubmit, onInvalid)();
  };

  // RHF invalid handler — surface a clear, actionable toast that lists the
  // exact fields the user needs to complete before plan generation can run.
  const onInvalid = (errors: Record<string, any>) => {
    setActiveTab("form");
    const fieldLabels: Record<string, string> = {
      departureCity: t("planTripExtra.fldDeparture", "Polazište"),
      destinations: t("planTripExtra.fldDestinations", "Destinacije"),
      tripType: t("planTripExtra.fldTripType", "Tip ekskurzije"),
      gradeLevel: t("planTripExtra.fldGrade", "Razred"),
      studentCount: t("planTripExtra.fldStudents", "Broj učenika"),
      transport: t("planTripExtra.fldTransport", "Prijevoz"),
      tripDate: t("planTripExtra.fldDeparture2", "Datum polaska"),
      returnDate: t("planTripExtra.fldReturn", "Datum povratka"),
      chaperones: t("planTripExtra.fldChaperones", "Pratitelji"),
    };
    const lines = Object.entries(errors)
      .slice(0, 5)
      .map(([k, v]: any) => `• ${fieldLabels[k] || k}: ${v?.message || "obavezno"}`);
    toast({
      variant: "destructive",
      title: t("planTripExtra.fixFormTitle", "Plan nije moguće generirati"),
      description: lines.join("\n") || t("planTripExtra.fixFormDesc", "Molimo popunite obavezna polja označena crveno."),
    });
  };

  const handleSaveTrip = async () => {
    if (!plansData) {
      toast({
        variant: "destructive",
        title: t("toasts.errorTitle"),
        description: t("planToasts.needPlanFirst"),
      });
      return;
    }

    // Consent gate: ako su učenici uneseni, sve saglasnosti moraju biti predate prije finalizacije.
    if (students.length > 0) {
      const pending = students.filter(s => s.consentStatus !== "submitted");
      if (pending.length > 0) {
        toast({
          variant: "destructive",
          title: t("planToasts.consentMissingTitle", { count: pending.length }),
          description: t("planToasts.consentMissingDesc"),
        });
        return;
      }
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

        // Loguj realizaciju u trip_history (za buduću rotaciju)
        try {
          const planRef = getGradePlan(data.gradeLevel);
          if (planRef) {
            const today = new Date();
            const sy = today.getMonth() >= 7 // August onwards = nova školska godina
              ? `${today.getFullYear()}/${today.getFullYear() + 1}`
              : `${today.getFullYear() - 1}/${today.getFullYear()}`;
            const noteParts: string[] = [];
            if (rotationOverride && rotationOverrideReason.trim()) {
              noteParts.push(`OVERRIDE rotacije: ${rotationOverrideReason.trim()}`);
            }
            await supabase.from("trip_history").insert({
              grade_group: planRef.groupKey,
              school_year: sy,
              destination: data.destinations[0] ?? "",
              trip_id: savedTrip.id,
              realized_at: data.tripDate ? format(data.tripDate, "yyyy-MM-dd") : null,
              notes: noteParts.join(" | ") || null,
            });
          }
        } catch (e) {
          console.warn("Could not log trip_history:", e);
        }
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
        title: t("planToasts.publicTitle"),
        description: t("planToasts.publicDesc"),
      });
    }
  };

  const handleExportPdf = () => {
    if (!plansData?.plans?.[selectedPlanIndex]) {
      toast({
        variant: "destructive",
        title: t("toasts.errorTitle"),
        description: t("planToasts.selectPlanForExport"),
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
                {t("planTrip.pageTitle")}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {t("planTrip.pageSubtitle")}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 max-w-3xl">
              <TabsTrigger value="form" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{t("planTrip.tabForm")}</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">{t("planTrip.tabMap")}</span>
              </TabsTrigger>
              <TabsTrigger value="itinerary" className="gap-2">
                <Route className="h-4 w-4" />
                <span className="hidden sm:inline">{t("planTrip.tabItinerary")}</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">{t("planTrip.tabTimeline")}</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">{t("planTrip.tabBudget")}</span>
              </TabsTrigger>
              <TabsTrigger value="checklist" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">{t("planTrip.tabChecklist")}</span>
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
                        rotationOverride={rotationOverride}
                        onRotationOverrideChange={setRotationOverride}
                        rotationOverrideReason={rotationOverrideReason}
                        onRotationOverrideReasonChange={setRotationOverrideReason}
                      />
                      
                      <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="gap-2"
                          disabled={isLoading}
                        >
                          <Sparkles className="h-4 w-4" />
                          {isLoading ? t("common.generating") : t("planTripExtra.generateLive")}
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
                              toast({ title: t("planToasts.templateSavedTitle"), description: t("planToasts.templateSavedDesc") });
                            } catch { toast({ variant: "destructive", title: t("toasts.errorTitle"), description: t("planToasts.templateSaveFail") }); }
                          }}
                        >
                          <FileText className="h-4 w-4" />
                          {t("planTripExtra.generateOffline")}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="lg"
                          className="gap-2"
                          onClick={() => {
                            try {
                              const saved = localStorage.getItem('idss-offline-template');
                              if (!saved) { toast({ variant: "destructive", title: t("toasts.noDataTitle"), description: t("planToasts.noSavedTemplates") }); return; }
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
                              toast({ title: t("planToasts.dataLoadedTitle"), description: t("planToasts.dataLoadedDesc") });
                            } catch { toast({ variant: "destructive", title: t("toasts.errorTitle"), description: t("planToasts.dataLoadFail") }); }
                          }}
                        >
                          <Download className="h-4 w-4" />
                          {t("planTripExtra.loadBrowserSaves")}
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
                                toast({ title: t("planToasts.fileLoadedTitle"), description: t("planToasts.fileLoadedDesc") });
                              } catch { toast({ variant: "destructive", title: t("toasts.errorTitle"), description: t("planToasts.invalidFile") }); }
                            };
                            reader.readAsText(file);
                          };
                          input.click();
                        }}>
                          <Download className="h-4 w-4" />
                          {t("planTripExtra.loadFromFile")}
                        </Button>
                        <Button type="button" variant="outline" className="gap-2" onClick={handlePrint}>
                          <Printer className="h-4 w-4" />
                          {t("planTripExtra.print")}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="gap-2"
                          onClick={handleExportPdf}
                          disabled={!plansData || isExporting}
                        >
                          <Download className="h-4 w-4" />
                          {isExporting ? t("planTripExtra.exporting") : t("planTripExtra.downloadPdf")}
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
                      {t("planTripExtra.routePreview")}
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
                      {t("planTripExtra.interactiveMap")}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("planTripExtra.visualizeRoute")}: {watchedValues.departureCity || t("planTripExtra.departurePlaceholder")} → {destinations.join(" → ") || t("planTripExtra.destinationsPlaceholder")}
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
                  {t("planTripExtra.backToForm")}
                </Button>
                <Button onClick={handleGeneratePlan} className="gap-2" disabled={isLoading}>
                  <Sparkles className="h-4 w-4" />
                  {t("planTripExtra.generate3Plans")}
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
                    {isSaving ? t("planTripExtra.saving") : savedTripId ? t("planTripExtra.updatePlan") : t("planTripExtra.savePlan")}
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
                    {isExporting ? t("planTripExtra.exporting") : t("planTripExtra.exportPdf")}
                  </Button>

                  <Button variant="outline" className="gap-2" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                    {t("planTripExtra.print")}
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
                tripType={watchedValues.tripType}
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
                  {t("planTripExtra.editData")}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("map")}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {t("planTripExtra.showMap")}
                </Button>
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-6">
              <DailyTimeline
                itinerary={plansData?.plans?.[selectedPlanIndex]?.itinerary}
                onChange={(newItinerary) => {
                  if (!plansData) return;
                  const plans = [...plansData.plans];
                  plans[selectedPlanIndex] = { ...plans[selectedPlanIndex], itinerary: newItinerary };
                  setPlansData({ ...plansData, plans });
                }}
              />
            </TabsContent>

            {/* Budget Tab */}
            <TabsContent value="budget" className="space-y-6">
              <BudgetTracker
                costs={plansData?.plans?.[selectedPlanIndex]?.costs}
                costPerStudent={plansData?.plans?.[selectedPlanIndex]?.cost_per_student}
                studentCount={parseInt(watchedValues.studentCount) || undefined}
                budgetPerStudent={watchedValues.budgetPerStudent ? parseInt(watchedValues.budgetPerStudent) : undefined}
              />
            </TabsContent>

            {/* Checklist Tab */}
            <TabsContent value="checklist" className="space-y-6">
              <ChecklistTemplates storageKey={savedTripId ? `idss-checklist-${savedTripId}` : "idss-checklist-default"} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlanTrip;
