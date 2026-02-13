import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TripItinerary from "@/components/trip/TripItinerary";
import TripRouteMap from "@/components/trip/TripRouteMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTripStorage } from "@/hooks/useTripStorage";
import { usePdfExport } from "@/hooks/usePdfExport";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Bus, 
  Download, 
  Printer, 
  ArrowLeft,
  GraduationCap,
  FileText,
  AlertCircle
} from "lucide-react";

const SharedTrip = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const { loadTripByShareId, isLoading } = useTripStorage();
  const { exportToPdf, isExporting } = usePdfExport();
  const [trip, setTrip] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrip = async () => {
      if (!shareId) {
        setError("Nevažeći link");
        return;
      }

      const loadedTrip = await loadTripByShareId(shareId);
      if (loadedTrip) {
        setTrip(loadedTrip);
      } else {
        setError("Plan putovanja nije pronađen ili nije javno dostupan.");
      }
    };

    loadTrip();
  }, [shareId]);

  const handleExportPdf = (planIndex: number) => {
    if (!trip || !trip.plansData?.plans?.[planIndex]) return;

    exportToPdf({
      tripName: trip.name,
      departureCity: trip.departureCity,
      destinations: trip.destinations,
      departureDate: trip.departureDate,
      returnDate: trip.returnDate,
      gradeLevel: trip.gradeLevel,
      studentCount: trip.studentCount,
      chaperones: trip.chaperones,
      plan: trip.plansData.plans[planIndex],
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-8">
          <div className="container max-w-7xl space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-[400px]" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-16">
          <div className="container max-w-xl text-center">
            <div className="p-6 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Plan nije dostupan</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link to="/plan-trip">
                <Button className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Kreiraj Novi Plan
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Podijeljeni Plan</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {trip.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {trip.departureCity} → {trip.destinations?.join(" → ")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button 
                className="gap-2" 
                onClick={() => handleExportPdf(0)}
                disabled={isExporting}
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          {/* Trip Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Datumi</p>
                    <p className="font-medium text-sm">
                      {trip.departureDate || "TBD"} - {trip.returnDate || "TBD"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Razred</p>
                    <p className="font-medium text-sm">{trip.gradeLevel || "TBD"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Učenici</p>
                    <p className="font-medium text-sm">{trip.studentCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Bus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prevoz</p>
                    <p className="font-medium text-sm capitalize">{trip.transport}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chaperones */}
          {trip.chaperones && trip.chaperones.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Pratitelji:</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {trip.chaperones.join(", ")}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Map */}
          {trip.plansData?.route_coordinates && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Ruta Putovanja
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TripRouteMap
                  departureCity={trip.departureCity}
                  destinationCity={trip.destinations?.[trip.destinations.length - 1] || ""}
                  routeCoordinates={trip.plansData.route_coordinates}
                />
              </CardContent>
            </Card>
          )}

          {/* Plans */}
          <TripItinerary
            plansData={trip.plansData}
            isLoading={false}
            error={null}
            chaperones={trip.chaperones || []}
            tripName={trip.name}
            departureCity={trip.departureCity}
            destinations={trip.destinations}
            departureDate={trip.departureDate}
            returnDate={trip.returnDate}
            gradeLevel={trip.gradeLevel}
            studentCount={trip.studentCount}
            onExportPdf={(planIdx) => handleExportPdf(planIdx)}
          />

          {/* Back button */}
          <div className="pt-4">
            <Link to="/plan-trip">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kreiraj Svoj Plan
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SharedTrip;
