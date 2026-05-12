import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import sarajevoImg from "@/assets/dest-sarajevo.jpg";
import plitviceImg from "@/assets/dest-plitvice.jpg";
import mostarImg from "@/assets/dest-mostar.jpg";
import munichImg from "@/assets/dest-munich.jpg";

const DestinationsSection = () => {
  const { t } = useTranslation();
  const destinations = [
    { id: 1, name: "Sarajevo – Stari Grad", category: t("home.catHistory"), rating: 4.9, reviews: 328, duration: t("home.destinationsHours34"), grades: "1-9", image: sarajevoImg, featured: true },
    { id: 2, name: "Plitvička Jezera", category: t("home.catNature"), rating: 4.8, reviews: 256, duration: t("home.destinationsFullDay"), grades: "5-9", image: plitviceImg, featured: true },
    { id: 3, name: "Mostar – Stari Most", category: t("home.catCulture"), rating: 4.7, reviews: 189, duration: t("home.destinationsFullDay"), grades: "3-9", image: mostarImg, featured: false },
    { id: 4, name: "München – Deutsches Museum", category: t("home.catScience"), rating: 4.8, reviews: 412, duration: t("home.destinationsMultiDay"), grades: "9", image: munichImg, featured: false },
  ];
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("home.destinationsTitle1")} <span className="text-primary">{t("home.destinationsTitle2")}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {t("home.destinationsSubtitle")}
            </p>
          </div>
          <Link to="/destinations">
            <Button variant="outline" className="group">
              {t("home.destinationsAll")}
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
                  loading="lazy"
                  width={800}
                  height={576}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                    {destination.category}
                  </Badge>
                  {destination.featured && (
                    <Badge className="bg-primary text-primary-foreground">{t("home.destinationsRecommended")}</Badge>
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
                  <span>{t("home.destinationsGrades")} {destination.grades}</span>
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
