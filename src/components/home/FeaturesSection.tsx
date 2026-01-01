import { 
  MapPin, 
  Calendar, 
  ClipboardCheck, 
  Shield, 
  Users, 
  Bell,
  FileText,
  Bus,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: MapPin,
    title: "Destination Discovery",
    description: "Browse curated educational destinations with reviews, ratings, and curriculum alignment details.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Intelligent date selection with conflict detection, weather forecasts, and venue availability.",
  },
  {
    icon: ClipboardCheck,
    title: "Digital Permission Slips",
    description: "Paperless consent forms with e-signatures, automatic reminders, and status tracking.",
  },
  {
    icon: Shield,
    title: "Safety Management",
    description: "Emergency contacts, medical info, headcount tools, and real-time location sharing.",
  },
  {
    icon: Users,
    title: "Chaperone Coordination",
    description: "Volunteer management, background check tracking, and group assignments.",
  },
  {
    icon: Bus,
    title: "Transportation Planning",
    description: "Bus reservations, seating charts, route optimization, and driver coordination.",
  },
  {
    icon: DollarSign,
    title: "Budget Tracking",
    description: "Cost estimates, payment collection, expense tracking, and financial reports.",
  },
  {
    icon: FileText,
    title: "Itinerary Builder",
    description: "Drag-and-drop schedule creation with time buffers, meal planning, and activity details.",
  },
  {
    icon: Bell,
    title: "Communication Hub",
    description: "Announcements, updates, and notifications to parents, students, and staff.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Plan the{" "}
            <span className="text-primary">Perfect Trip</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our comprehensive suite of tools handles every detail, so you can focus on creating meaningful learning experiences.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
