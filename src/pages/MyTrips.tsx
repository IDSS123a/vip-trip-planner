import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import EmailShareDialog from "@/components/trip/EmailShareDialog";
import ShareTripDialog from "@/components/trip/ShareTripDialog";
import { 
  Calendar, 
  MapPin, 
  Users, 
  MoreVertical, 
  Plus, 
  Clock, 
  CheckCircle2,
  FileText,
  Bus,
  Trash2,
  Copy,
  Edit,
  Download,
  Loader2,
  LogIn
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePdfExport } from "@/hooks/usePdfExport";

interface Trip {
  id: string;
  name: string;
  departureCity: string;
  destinations: string[];
  departureDate: string | null;
  returnDate: string | null;
  gradeLevel: string | null;
  studentCount: number;
  chaperones: string[];
  transport: string;
  plansData: any;
  selectedPlanId: number;
  isPublic: boolean;
  shareId: string;
  createdAt: string;
  updatedAt: string;
}

const getStatusFromDate = (departureDate: string | null): "upcoming" | "planning" | "completed" => {
  if (!departureDate) return "planning";
  const tripDate = new Date(departureDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (tripDate < today) return "completed";
  return "upcoming";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "upcoming":
      return "bg-primary/10 text-primary border-primary/20";
    case "planning":
      return "bg-accent text-accent-foreground border-accent";
    case "completed":
      return "bg-muted text-muted-foreground border-muted";
    default:
      return "bg-muted text-muted-foreground border-muted";
  }
};

const MyTrips = () => {
  const { t } = useTranslation();
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "upcoming":
        return t("myTrips.statusUpcoming");
      case "planning":
        return t("myTrips.statusPlanning");
      case "completed":
        return t("myTrips.statusCompleted");
      default:
        return status;
    }
  };
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { exportToPdf, isExporting } = usePdfExport();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchTrips();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedTrips: Trip[] = (data || []).map((trip) => ({
        id: trip.id,
        name: trip.name,
        departureCity: trip.departure_city,
        destinations: trip.destinations || [],
        departureDate: trip.departure_date,
        returnDate: trip.return_date,
        gradeLevel: trip.grade_level,
        studentCount: trip.student_count || 0,
        chaperones: trip.chaperones || [],
        transport: trip.transport || "bus",
        plansData: trip.plans_data,
        selectedPlanId: trip.selected_plan_id || 1,
        isPublic: trip.is_public || false,
        shareId: trip.share_id,
        createdAt: trip.created_at,
        updatedAt: trip.updated_at,
      }));

      setTrips(mappedTrips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast({
        variant: "destructive",
        title: t("toasts.errorTitle"),
        description: t("myTrips.toastFetchFail"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;

    try {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", tripToDelete);

      if (error) throw error;

      setTrips(trips.filter((t) => t.id !== tripToDelete));
      toast({
        title: t("myTrips.toastDeletedTitle"),
        description: t("myTrips.toastDeletedDesc"),
      });
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        variant: "destructive",
        title: t("toasts.errorTitle"),
        description: t("myTrips.toastDeleteFail"),
      });
    } finally {
      setTripToDelete(null);
    }
  };

  const handleDuplicateTrip = async (trip: Trip) => {
    setIsDuplicating(trip.id);
    try {
      const { data, error } = await supabase
        .from("trips")
        .insert({
          user_id: user?.id,
          name: `${trip.name} (${t("myTrips.copySuffix")})`,
          departure_city: trip.departureCity,
          destinations: trip.destinations,
          departure_date: null,
          return_date: null,
          grade_level: trip.gradeLevel,
          student_count: trip.studentCount,
          chaperones: trip.chaperones,
          transport: trip.transport,
          plans_data: trip.plansData,
          selected_plan_id: trip.selectedPlanId,
          is_public: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t("myTrips.toastDuplicatedTitle"),
        description: t("myTrips.toastDuplicatedDesc"),
      });
      fetchTrips();
    } catch (error) {
      console.error("Error duplicating trip:", error);
      toast({
        variant: "destructive",
        title: t("toasts.errorTitle"),
        description: t("myTrips.toastDuplicateFail"),
      });
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleExportPdf = (trip: Trip) => {
    const selectedPlan = trip.plansData?.plans?.[trip.selectedPlanId - 1];
    if (!selectedPlan) {
      toast({
        variant: "destructive",
        title: t("toasts.errorTitle"),
        description: t("myTrips.toastNoPlanData"),
      });
      return;
    }

    exportToPdf({
      tripName: trip.name,
      departureCity: trip.departureCity,
      destinations: trip.destinations,
      departureDate: trip.departureDate || undefined,
      returnDate: trip.returnDate || undefined,
      gradeLevel: trip.gradeLevel || undefined,
      studentCount: trip.studentCount,
      chaperones: trip.chaperones,
      plan: selectedPlan,
    });
  };

  const handleMakePublic = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from("trips")
        .update({ is_public: true })
        .eq("id", tripId);

      if (error) throw error;

      setTrips(trips.map((t) => (t.id === tripId ? { ...t, isPublic: true } : t)));
      toast({
        title: t("myTrips.toastPublicTitle"),
        description: t("myTrips.toastPublicDesc"),
      });
    } catch (error) {
      console.error("Error making trip public:", error);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    const status = getStatusFromDate(trip.departureDate);
    if (activeTab === "all") return true;
    return status === activeTab;
  });

  const stats = {
    upcoming: trips.filter((t) => getStatusFromDate(t.departureDate) === "upcoming").length,
    planning: trips.filter((t) => getStatusFromDate(t.departureDate) === "planning").length,
    completed: trips.filter((t) => getStatusFromDate(t.departureDate) === "completed").length,
    totalStudents: trips.reduce((acc, t) => acc + t.studentCount, 0),
  };

  // Show login prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-12">
          <div className="container max-w-lg">
            <Card className="border-border">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <LogIn className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">{t("myTrips.loginPromptTitle")}</h2>
                <p className="text-muted-foreground mb-6">
                  {t("myTrips.loginPromptDesc")}
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to="/auth">
                    <Button>{t("myTrips.loginBtn")}</Button>
                  </Link>
                  <Link to="/plan-trip">
                    <Button variant="outline">{t("myTrips.planFirstBtn")}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12">
        <div className="container">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {t("myTrips.titlePrefix")} <span className="text-primary">{t("myTrips.titleHighlight")}</span>
              </h1>
              <p className="text-muted-foreground">
                {t("myTrips.subtitle")}
              </p>
            </div>
            <Link to="/plan-trip">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("myTrips.newTrip")}
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-border bg-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.upcoming}</p>
                  <p className="text-sm text-muted-foreground">{t("myTrips.statUpcoming")}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <Clock className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.planning}</p>
                  <p className="text-sm text-muted-foreground">{t("myTrips.statPlanning")}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">{t("myTrips.statCompleted")}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
                  <p className="text-sm text-muted-foreground">{t("myTrips.statTotalStudents")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trips List */}
          <Card className="border-border bg-card">
            <CardHeader>
              <Tabs defaultValue="all" onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">{t("myTrips.tabAll")} ({trips.length})</TabsTrigger>
                  <TabsTrigger value="upcoming">{t("myTrips.tabUpcoming")} ({stats.upcoming})</TabsTrigger>
                  <TabsTrigger value="planning">{t("myTrips.tabPlanning")} ({stats.planning})</TabsTrigger>
                  <TabsTrigger value="completed">{t("myTrips.tabCompleted")} ({stats.completed})</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTrips.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t("myTrips.emptyTitle")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t("myTrips.emptyDesc")}
                  </p>
                  <Link to="/plan-trip">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("myTrips.createNew")}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTrips.map((trip) => {
                    const status = getStatusFromDate(trip.departureDate);
                    return (
                      <div
                        key={trip.id}
                        className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors gap-4"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg text-foreground">
                              {trip.name}
                            </h3>
                            <Badge variant="outline" className={getStatusColor(status)}>
                              {getStatusLabel(status)}
                            </Badge>
                            {trip.isPublic && (
                              <Badge variant="secondary">{t("myTrips.publicBadge")}</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {trip.destinations.join(" → ") || trip.departureCity}
                            </div>
                            {trip.departureDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(trip.departureDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {trip.studentCount} {t("myTrips.studentsCount")}, {trip.chaperones.length} {t("myTrips.chaperonesCount")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Bus className="h-4 w-4" />
                              {trip.transport}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <ShareTripDialog
                            shareId={trip.shareId}
                            tripName={trip.name}
                            isPublic={trip.isPublic}
                            onMakePublic={() => handleMakePublic(trip.id)}
                          />
                          
                          <EmailShareDialog
                            tripId={trip.id}
                            tripName={trip.name}
                            disabled={!trip.isPublic}
                          />

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/trip/${trip.shareId}`}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  {t("myTrips.viewDetails")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/plan-trip?edit=${trip.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t("myTrips.editTrip")}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDuplicateTrip(trip)}
                                disabled={isDuplicating === trip.id}
                              >
                                {isDuplicating === trip.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Copy className="mr-2 h-4 w-4" />
                                )}
                                {t("myTrips.duplicate")}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleExportPdf(trip)}
                                disabled={isExporting}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                {t("myTrips.exportPdfMenu")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setTripToDelete(trip.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("myTrips.deleteTrip")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!tripToDelete} onOpenChange={() => setTripToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("myTrips.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("myTrips.deleteConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrip} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyTrips;
