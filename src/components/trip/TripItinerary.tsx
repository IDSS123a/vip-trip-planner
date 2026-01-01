import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  Calendar
} from "lucide-react";

interface TripFormData {
  tripName?: string;
  departureCity?: string;
  destinationCity?: string;
  departureAddress?: string;
  destinationAddress?: string;
  schoolType?: string;
  studentCount?: string;
  teacherCount?: string;
  numberOfDays?: string;
  tripDate?: Date;
  returnDate?: Date;
  budgetPerStudent?: string;
  educationalObjectives?: string;
  tripDescription?: string;
}

interface TripItineraryProps {
  formData: TripFormData;
}

const TripItinerary = ({ formData }: TripItineraryProps) => {
  const studentCount = parseInt(formData.studentCount) || 30;
  const teacherCount = parseInt(formData.teacherCount) || 3;
  const totalPeople = studentCount + teacherCount;
  const numberOfDays = parseInt(formData.numberOfDays) || 3;
  const budgetPerStudent = parseFloat(formData.budgetPerStudent) || 150;

  // Calculate estimated costs
  const transportCost = numberOfDays <= 1 ? 25 : 45 * Math.ceil(numberOfDays / 2);
  const accommodationCost = numberOfDays > 1 ? (numberOfDays - 1) * 35 : 0;
  const mealsCost = numberOfDays * 15;
  const entrancesCost = 20;
  const insuranceCost = 5;
  const guideCost = 10;
  const totalCostPerStudent = transportCost + accommodationCost + mealsCost + entrancesCost + insuranceCost + guideCost;

  // Generate itinerary based on number of days
  const generateItinerary = () => {
    const itinerary = [];
    
    for (let day = 1; day <= numberOfDays; day++) {
      if (day === 1) {
        itinerary.push({
          day,
          title: `Dan ${day} - Polazak i dolazak`,
          activities: [
            { time: "06:00", description: `Okupljanje ispred škole (${formData.departureAddress || formData.departureCity})`, icon: MapPin },
            { time: "06:30", description: "Polazak autobusa prema odredištu", icon: Bus },
            { time: "09:00", description: "Pauza za doručak i odmor", icon: Utensils },
            { time: "12:00", description: `Dolazak u ${formData.destinationCity}, smještaj prtljage`, icon: Hotel },
            { time: "13:00", description: "Ručak u lokalnom restoranu", icon: Utensils },
            { time: "14:30", description: "Razgledanje centra grada uz vodiča", icon: MapPin },
            { time: "17:00", description: "Slobodno vrijeme za učenike", icon: Users },
            { time: "19:00", description: "Večera i priprema za noćenje", icon: Utensils },
          ]
        });
      } else if (day === numberOfDays) {
        itinerary.push({
          day,
          title: `Dan ${day} - Povratak`,
          activities: [
            { time: "08:00", description: "Doručak u hotelu", icon: Utensils },
            { time: "09:30", description: "Odjava iz smještaja, pakiranje", icon: Hotel },
            { time: "10:00", description: "Posjet suvenirnicama i kupovina", icon: MapPin },
            { time: "11:30", description: "Polazak prema domu", icon: Bus },
            { time: "13:00", description: "Pauza za ručak na putu", icon: Utensils },
            { time: "16:00", description: `Očekivani dolazak u ${formData.departureCity}`, icon: MapPin },
          ]
        });
      } else {
        itinerary.push({
          day,
          title: `Dan ${day} - Edukativni program`,
          activities: [
            { time: "08:00", description: "Doručak u hotelu", icon: Utensils },
            { time: "09:30", description: "Posjet muzeju/kulturnoj instituciji", icon: Ticket },
            { time: "12:00", description: "Edukativna radionica", icon: FileText },
            { time: "13:30", description: "Ručak", icon: Utensils },
            { time: "15:00", description: "Posjet povijesnim znamenitostima", icon: MapPin },
            { time: "17:30", description: "Slobodno vrijeme i rekreacija", icon: Users },
            { time: "19:00", description: "Večera i večernji program", icon: Utensils },
          ]
        });
      }
    }
    
    return itinerary;
  };

  const itinerary = generateItinerary();

  // Calculate distance (mock calculation based on cities)
  const getEstimatedDistance = () => {
    const distances: Record<string, Record<string, number>> = {
      'sarajevo': { 'budapest': 520, 'zagreb': 400, 'belgrade': 290, 'vienna': 680 },
      'zagreb': { 'budapest': 345, 'sarajevo': 400, 'vienna': 350, 'belgrade': 390 },
      'belgrade': { 'budapest': 380, 'sarajevo': 290, 'zagreb': 390, 'vienna': 600 },
    };
    
    const dep = formData.departureCity.toLowerCase();
    const dest = formData.destinationCity.toLowerCase();
    
    return distances[dep]?.[dest] || 450;
  };

  const distance = getEstimatedDistance();
  const travelTime = Math.round(distance / 80); // Assuming 80 km/h average

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
          <Download className="h-4 w-4" />
          Učitaj Browser Save
        </Button>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Učitaj iz Filea
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

      {/* Trip Overview Card */}
      <Card className="border-primary/20">
        <CardHeader className="bg-primary/5 border-b border-border">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Badge variant="secondary" className="mb-2">Opcija 1</Badge>
              <CardTitle className="text-xl">
                {formData.departureCity} → {formData.destinationCity} — {formData.tripName || 'Plan Putovanja'}
              </CardTitle>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Distance & Time */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Route className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Udaljenost</p>
                <p className="font-semibold">{distance} km • ~{travelTime}h vožnje</p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trajanje</p>
                <p className="font-semibold">{numberOfDays} {numberOfDays === 1 ? 'dan' : 'dana'}</p>
              </div>
            </div>

            {/* Group Size */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grupa</p>
                <p className="font-semibold">{studentCount} učenika + {teacherCount} nastavnika</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Itinerary */}
        <div className="lg:col-span-2 space-y-4">
          {itinerary.map((dayPlan) => (
            <Card key={dayPlan.day}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="default" className="rounded-full">
                    Dan {dayPlan.day}
                  </Badge>
                  {dayPlan.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dayPlan.activities.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-16 text-sm text-muted-foreground font-medium">
                        {activity.time}
                      </div>
                      <div className="flex-shrink-0 p-1.5 rounded-full bg-secondary">
                        <activity.icon className="h-3.5 w-3.5 text-secondary-foreground" />
                      </div>
                      <p className="text-sm text-foreground">{activity.description}</p>
                    </div>
                  ))}
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
                Trošak po Učeniku
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Transport</span>
                </div>
                <span className="font-medium">{transportCost} €</span>
              </div>
              <Separator />
              {accommodationCost > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Hotel className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Smještaj</span>
                    </div>
                    <span className="font-medium">{accommodationCost} €</span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Ishrana</span>
                </div>
                <span className="font-medium">{mealsCost} €</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Ulaznice</span>
                </div>
                <span className="font-medium">{entrancesCost} €</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Osiguranje</span>
                </div>
                <span className="font-medium">{insuranceCost} €</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Vodič</span>
                </div>
                <span className="font-medium">{guideCost} €</span>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between items-center bg-primary/10 p-3 rounded-lg">
                <span className="font-semibold">Ukupno po učeniku</span>
                <span className="font-bold text-lg text-primary">{totalCostPerStudent} €</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stavke po Kategoriji</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ukupan budžet grupe</span>
                <span className="font-medium">{totalCostPerStudent * totalPeople} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Troškovi učenika</span>
                <span className="font-medium">{totalCostPerStudent * studentCount} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Troškovi nastavnika</span>
                <span className="font-medium">{totalCostPerStudent * teacherCount} €</span>
              </div>
            </CardContent>
          </Card>

          {formData.educationalObjectives && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Edukativni Ciljevi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {formData.educationalObjectives}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripItinerary;
