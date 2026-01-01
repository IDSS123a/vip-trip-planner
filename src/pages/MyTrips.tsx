import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  MapPin, 
  Users, 
  MoreVertical, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Bus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sample trip data
const sampleTrips = [
  {
    id: 1,
    name: "Natural History Museum Visit",
    destination: "Natural History Museum",
    date: "2026-01-15",
    status: "upcoming",
    students: 28,
    chaperones: 6,
    permissionProgress: 85,
    gradeLevel: "5th Grade",
  },
  {
    id: 2,
    name: "Space Center Adventure",
    destination: "Space & Aviation Center",
    date: "2026-02-20",
    status: "planning",
    students: 32,
    chaperones: 7,
    permissionProgress: 25,
    gradeLevel: "6th Grade",
  },
  {
    id: 3,
    name: "Fall Nature Walk",
    destination: "Botanical Gardens",
    date: "2025-10-10",
    status: "completed",
    students: 24,
    chaperones: 5,
    permissionProgress: 100,
    gradeLevel: "3rd Grade",
  },
  {
    id: 4,
    name: "Historical Downtown Tour",
    destination: "Historical Village",
    date: "2025-11-05",
    status: "completed",
    students: 30,
    chaperones: 6,
    permissionProgress: 100,
    gradeLevel: "4th Grade",
  },
];

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
  const [activeTab, setActiveTab] = useState("all");

  const filteredTrips = sampleTrips.filter((trip) => {
    if (activeTab === "all") return true;
    return trip.status === activeTab;
  });

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
                  <p className="text-2xl font-bold text-foreground">
                    {sampleTrips.filter((t) => t.status === "upcoming").length}
                  </p>
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
                  <p className="text-2xl font-bold text-foreground">
                    {sampleTrips.filter((t) => t.status === "planning").length}
                  </p>
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
                  <p className="text-2xl font-bold text-foreground">
                    {sampleTrips.filter((t) => t.status === "completed").length}
                  </p>
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
                  <p className="text-2xl font-bold text-foreground">
                    {sampleTrips.reduce((acc, t) => acc + t.students, 0)}
                  </p>
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
                  <TabsTrigger value="all">All Trips</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="planning">Planning</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {filteredTrips.length === 0 ? (
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
                  {filteredTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors gap-4"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg text-foreground">
                            {trip.name}
                          </h3>
                          <Badge variant="outline" className={getStatusColor(trip.status)}>
                            {getStatusLabel(trip.status)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {trip.destination}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(trip.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {trip.students} students, {trip.chaperones} chaperones
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {trip.status !== "completed" && (
                          <div className="w-32">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Permissions</span>
                              <span className="font-medium text-foreground">{trip.permissionProgress}%</span>
                            </div>
                            <Progress value={trip.permissionProgress} className="h-2" />
                          </div>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="mr-2 h-4 w-4" />
                              Manage Roster
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Bus className="mr-2 h-4 w-4" />
                              Transportation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Cancel Trip
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyTrips;
