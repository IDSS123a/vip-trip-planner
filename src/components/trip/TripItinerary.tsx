import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Clock, 
  Bus, 
  Hotel, 
  Utensils, 
  Ticket, 
  FileText, 
  Download, 
  Printer, 
  Share2,
  Route,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Coffee,
  Camera,
  Sparkles,
  Train,
  ShieldCheck
} from "lucide-react";
import TripRouteMap from "./TripRouteMap";

interface Activity {
  time: string;
  description: string;
  type: "travel" | "meal" | "activity" | "accommodation" | "free_time";
  location: string;
  notes?: string;
}

interface DayItinerary {
  day: number;
  title: string;
  activities: Activity[];
}

interface Costs {
  transport: number;
  accommodation: number;
  meals: number;
  entry_fees: number;
  activity_fees: number;
  local_transport: number;
  contingency: number;
  total: number;
}

interface TripPlan {
  id: number;
  type: "Budget" | "Balanced" | "Premium";
  route: string;
  reliability: number;
  days: number;
  distance_km: number;
  travel_hours: number;
  cost_per_student: number;
  costs: Costs;
  why_this_fits: string;
  accommodation_info: string;
  itinerary: DayItinerary[];
}

interface RouteCoordinate {
  city: string;
  lat: number;
  lng: number;
  order: number;
}

interface EducationalResource {
  city: string;
  sites: string[];
}

interface TripPlansData {
  plans: TripPlan[];
  route_coordinates: RouteCoordinate[];
  educational_resources: EducationalResource[];
}

interface TripItineraryProps {
  plansData: TripPlansData | null;
  isLoading: boolean;
  error: string | null;
  chaperones: string[];
}

const getActivityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "travel": return Bus;
    case "meal": return Utensils;
    case "activity": return Camera;
    case "accommodation": return Hotel;
    case "free_time": return Coffee;
    default: return MapPin;
  }
};

const getReliabilityColor = (reliability: number) => {
  if (reliability >= 80) return "text-green-500";
  if (reliability >= 60) return "text-yellow-500";
  return "text-red-500";
};

const TripItinerary = ({ plansData, isLoading, error, chaperones }: TripItineraryProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <div>
            <p className="font-medium">Generiranje 3 opcije plana putovanja...</p>
            <p className="text-sm text-muted-foreground">AI analizira vaše podatke i kreira detaljne planove</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 rounded-lg border border-destructive/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Greška pri generiranju planova</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plansData || !plansData.plans || plansData.plans.length === 0) {
    return (
      <div className="p-6 bg-muted rounded-lg text-center">
        <p className="text-muted-foreground">Nema generiranih planova. Popunite formular i kliknite "Generiši 3 Plana".</p>
      </div>
    );
  }

  const { plans, route_coordinates, educational_resources } = plansData;

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Generiši i Snimi (html)
        </Button>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Generiši Predložak (Offline)
        </Button>
        <Button variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Note */}
      <p className="text-sm text-muted-foreground italic">
        Napomena: aplikacija koristi GeoNames (geokodiranje), Wikidata (POI) i OpenRouteService (rute/POI).
      </p>

      {/* 3 Plan Options */}
      <Tabs defaultValue="1" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          {plans.map((plan) => (
            <TabsTrigger key={plan.id} value={String(plan.id)} className="gap-2">
              <Badge variant={plan.type === "Budget" ? "secondary" : plan.type === "Balanced" ? "default" : "outline"} className="text-xs">
                {plan.type}
              </Badge>
              <span className="hidden sm:inline">{plan.cost_per_student} EUR</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {plans.map((plan) => (
          <TabsContent key={plan.id} value={String(plan.id)} className="space-y-6">
            {/* Plan Header Card */}
            <Card className="border-primary/20 overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-border">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={plan.type === "Budget" ? "secondary" : plan.type === "Balanced" ? "default" : "outline"}>
                        Option {plan.id}
                      </Badge>
                      <span className="text-sm text-muted-foreground">— {plan.type}</span>
                    </div>
                    <CardTitle className="text-xl">{plan.route}</CardTitle>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`flex items-center gap-1 ${getReliabilityColor(plan.reliability)}`}>
                        <ShieldCheck className="h-4 w-4" />
                        Reliability: {plan.reliability}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">Snimi</Button>
                    <Button size="sm" variant="outline">Export</Button>
                    <Button size="sm" variant="outline">Share to Map</Button>
                    <Button size="sm" variant="outline">Aktiviraj GPS</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Days</p>
                      <p className="font-semibold">{plan.days}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Route className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="font-semibold">{plan.distance_km.toFixed(2)} km</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Travel</p>
                      <p className="font-semibold">{plan.travel_hours.toFixed(1)} h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cost per Student</p>
                      <p className="font-semibold text-primary">{plan.cost_per_student} EUR</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            {route_coordinates && route_coordinates.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Ruta Putovanja ({route_coordinates.length} tačaka)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TripRouteMap
                    departureCity={route_coordinates[0]?.city || "Sarajevo"}
                    destinationCity={route_coordinates[route_coordinates.length - 1]?.city || ""}
                    routeCoordinates={route_coordinates}
                  />
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Itinerary */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold">Itinerary:</h3>
                {plan.itinerary.map((day) => (
                  <Card key={day.day}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Badge variant="default" className="rounded-full">
                          {day.day}
                        </Badge>
                        Day {day.day}: {day.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {day.activities.map((activity, idx) => {
                          const Icon = getActivityIcon(activity.type);
                          return (
                            <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex-shrink-0 text-sm text-muted-foreground font-mono w-28">
                                {activity.time}
                              </div>
                              <div className="flex-shrink-0 p-1.5 rounded-full bg-secondary">
                                <Icon className="h-3.5 w-3.5 text-secondary-foreground" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm">{activity.description}</p>
                                {activity.location && (
                                  <p className="text-xs text-muted-foreground mt-1">📍 {activity.location}</p>
                                )}
                                {activity.notes && (
                                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {activity.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Itinerary Costs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Transport:</span>
                      </div>
                      <span className="font-medium">{plan.costs.transport.toLocaleString()} EUR</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Hotel className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Accommodation:</span>
                      </div>
                      <span className="font-medium">{plan.costs.accommodation.toLocaleString()} EUR</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Meals:</span>
                      </div>
                      <span className="font-medium">{plan.costs.meals.toLocaleString()} EUR</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Entry Fees:</span>
                      </div>
                      <span className="font-medium">{plan.costs.entry_fees.toLocaleString()} EUR</span>
                    </div>
                    <Separator />
                    <div className="text-sm font-medium text-muted-foreground mt-2">Extras & Contingency:</div>
                    <div className="flex justify-between items-center pl-4">
                      <span className="text-sm">Activity Fees:</span>
                      <span className="font-medium">{plan.costs.activity_fees.toLocaleString()} EUR</span>
                    </div>
                    <div className="flex justify-between items-center pl-4">
                      <span className="text-sm">Local Transport:</span>
                      <span className="font-medium">{plan.costs.local_transport.toLocaleString()} EUR</span>
                    </div>
                    <div className="flex justify-between items-center pl-4">
                      <span className="text-sm">Contingency (5%):</span>
                      <span className="font-medium">{plan.costs.contingency.toLocaleString()} EUR</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between items-center bg-primary/10 p-3 rounded-lg">
                      <span className="font-semibold">Total Trip Cost:</span>
                      <span className="font-bold text-lg text-primary">{plan.costs.total.toLocaleString()} EUR</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Why This Fits */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Why this fits:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{plan.why_this_fits}</p>
                  </CardContent>
                </Card>

                {/* Teachers */}
                {chaperones && chaperones.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Teachers:
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{chaperones.join(", ")}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Accommodation Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Hotel className="h-4 w-4" />
                      Accommodation:
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{plan.accommodation_info}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Educational Resources */}
            {educational_resources && educational_resources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">EDUCATIONAL RESOURCES & KEY SITES</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {educational_resources.map((resource, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <p className="font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {resource.city}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {resource.sites.map((site, sIdx) => (
                            <li key={sIdx} className="text-sm text-muted-foreground flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {site}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TripItinerary;
