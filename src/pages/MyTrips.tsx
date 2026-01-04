import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const getStatusLabel = (status: string) => {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "planning":
      return "In Planning";
    case "completed":
      return "Completed";
    default:
      return status;
  }
};

const MyTrips = () => {
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
        title: "Error",
        description: "Failed to load your trips.",
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
        title: "Trip Deleted",
        description: "The trip has been removed.",
      });
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the trip.",
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
          name: `${trip.name} (Copy)`,
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
        title: "Trip Duplicated",
        description: "A copy of the trip has been created.",
      });
      fetchTrips();
    } catch (error) {
      console.error("Error duplicating trip:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to duplicate the trip.",
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
        title: "Error",
        description: "No plan data available for export.",
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
        title: "Trip is now public",
        description: "Anyone with the link can view this trip.",
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
                <h2 className="text-2xl font-bold mb-2">Sign in to View Your Trips</h2>
                <p className="text-muted-foreground mb-6">
                  Create an account or sign in to save and manage your field trip plans.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to="/auth">
                    <Button>Sign In</Button>
                  </Link>
                  <Link to="/plan-trip">
                    <Button variant="outline">Plan a Trip First</Button>
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
                My <span className="text-primary">Trips</span>
              </h1>
              <p className="text-muted-foreground">
                Manage and track all your field trip plans in one place.
              </p>
            </div>
            <Link to="/plan-trip">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Trip
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
                  <p className="text-sm text-muted-foreground">Upcoming Trips</p>
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
                  <p className="text-sm text-muted-foreground">In Planning</p>
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
                  <p className="text-sm text-muted-foreground">Completed</p>
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
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trips List */}
          <Card className="border-border bg-card">
            <CardHeader>
              <Tabs defaultValue="all" onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All Trips ({trips.length})</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming ({stats.upcoming})</TabsTrigger>
                  <TabsTrigger value="planning">Planning ({stats.planning})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">No trips found</h3>
                  <p className="text-muted-foreground mb-4">
                    Start planning your first field trip adventure!
                  </p>
                  <Link to="/plan-trip">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Trip
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
                              <Badge variant="secondary">Public</Badge>
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
                              {trip.studentCount} students, {trip.chaperones.length} chaperones
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
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/plan-trip?edit=${trip.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Trip
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
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleExportPdf(trip)}
                                disabled={isExporting}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Export PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setTripToDelete(trip.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Trip
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
            <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The trip and all its data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrip} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyTrips;
