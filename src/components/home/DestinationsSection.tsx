import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, ArrowRight } from "lucide-react";

const destinations = [
  {
    id: 1,
    name: "Sarajevo – Stari Grad",
    category: "Historija",
    rating: 4.9,
    reviews: 328,
    duration: "3-4 sata",
    grades: "1-9",
    image: "https://images.unsplash.com/photo-1544894079-e81a9eb1da8b?w=800&auto=format&fit=crop&q=60",
    featured: true,
  },
  {
    id: 2,
    name: "Plitvička Jezera",
    category: "Priroda",
    rating: 4.8,
    reviews: 256,
    duration: "Cjelodnevno",
    grades: "5-9",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=60",
    featured: true,
  },
  {
    id: 3,
    name: "Mostar – Stari Most",
    category: "Kultura",
    rating: 4.7,
    reviews: 189,
    duration: "Cjelodnevno",
    grades: "3-9",
    image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&auto=format&fit=crop&q=60",
    featured: false,
  },
  {
    id: 4,
    name: "München – Deutsches Museum",
    category: "Nauka",
    rating: 4.8,
    reviews: 412,
    duration: "Višednevno",
    grades: "9",
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=60",
    featured: false,
  },
];

const DestinationsSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Popularne <span className="text-primary">Destinacije</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Pregledajte destinacije usklađene s IDSS Pravilnikom o organizaciji ekskurzija.
            </p>
          </div>
          <Link to="/destinations">
            <Button variant="outline" className="group">
              Sve Destinacije
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((destination) => (
            <Card 
              key={destination.id} 
              className="group overflow-hidden border-border bg-card hover:shadow-xl transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                    {destination.category}
                  </Badge>
                  {destination.featured && (
                    <Badge className="bg-primary text-primary-foreground">Preporučeno</Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                  {destination.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-primary fill-primary" />
                    <span className="font-medium text-foreground">{destination.rating}</span>
                    <span>({destination.reviews})</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {destination.duration}
                  </div>
                  <span>Razredi {destination.grades}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DestinationsSection;
