import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  Filter,
  SlidersHorizontal,
  Heart,
  ExternalLink
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const allDestinations = [
  {
    id: 1,
    name: "Natural History Museum",
    category: "Science",
    rating: 4.9,
    reviews: 328,
    duration: "3-4 hours",
    grades: "K-12",
    distance: 12,
    price: 15,
    image: "https://images.unsplash.com/photo-1544894079-e81a9eb1da8b?w=800&auto=format&fit=crop&q=60",
    featured: true,
    description: "Explore fossils, gems, and interactive exhibits about Earth's history.",
    amenities: ["Cafeteria", "Gift Shop", "Wheelchair Accessible", "Guided Tours"],
  },
  {
    id: 2,
    name: "Space & Aviation Center",
    category: "STEM",
    rating: 4.8,
    reviews: 256,
    duration: "4-5 hours",
    grades: "3-12",
    distance: 25,
    price: 22,
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=60",
    featured: true,
    description: "Interactive space exploration exhibits and real aircraft displays.",
    amenities: ["IMAX Theater", "Simulator", "Cafeteria", "Parking"],
  },
  {
    id: 3,
    name: "Historical Village",
    category: "History",
    rating: 4.7,
    reviews: 189,
    duration: "2-3 hours",
    grades: "2-8",
    distance: 8,
    price: 10,
    image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&auto=format&fit=crop&q=60",
    featured: false,
    description: "Step back in time with living history demonstrations and authentic buildings.",
    amenities: ["Picnic Area", "Gift Shop", "Guided Tours"],
  },
  {
    id: 4,
    name: "Botanical Gardens",
    category: "Nature",
    rating: 4.8,
    reviews: 412,
    duration: "2-4 hours",
    grades: "K-12",
    distance: 15,
    price: 8,
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=60",
    featured: false,
    description: "Beautiful gardens featuring native and exotic plant species.",
    amenities: ["Restrooms", "Café", "Wheelchair Accessible", "Educational Programs"],
  },
  {
    id: 5,
    name: "City Zoo",
    category: "Nature",
    rating: 4.6,
    reviews: 534,
    duration: "4-6 hours",
    grades: "K-12",
    distance: 18,
    price: 18,
    image: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&auto=format&fit=crop&q=60",
    featured: true,
    description: "Home to over 500 species with educational programs and animal encounters.",
    amenities: ["Cafeteria", "Gift Shop", "Stroller Rental", "Train Ride"],
  },
  {
    id: 6,
    name: "Art Museum",
    category: "Arts",
    rating: 4.5,
    reviews: 178,
    duration: "2-3 hours",
    grades: "K-12",
    distance: 5,
    price: 12,
    image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&auto=format&fit=crop&q=60",
    featured: false,
    description: "World-class collection spanning classical to contemporary art.",
    amenities: ["Café", "Gift Shop", "Audio Tours", "Workshops"],
  },
  {
    id: 7,
    name: "Marine Aquarium",
    category: "Science",
    rating: 4.7,
    reviews: 445,
    duration: "3-4 hours",
    grades: "K-12",
    distance: 22,
    price: 25,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=60",
    featured: true,
    description: "Discover ocean life with interactive exhibits and touch tanks.",
    amenities: ["Cafeteria", "4D Theater", "Gift Shop", "Behind-the-Scenes Tours"],
  },
  {
    id: 8,
    name: "Science Discovery Center",
    category: "STEM",
    rating: 4.8,
    reviews: 367,
    duration: "3-5 hours",
    grades: "K-8",
    distance: 10,
    price: 16,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60",
    featured: false,
    description: "Hands-on experiments and demonstrations in physics, chemistry, and biology.",
    amenities: ["Cafeteria", "Planetarium", "Birthday Parties", "STEM Labs"],
  },
];

const categories = ["All", "Science", "STEM", "History", "Nature", "Arts"];

const Destinations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 30]);
  const [favorites, setFavorites] = useState<number[]>([]);

  const filteredDestinations = allDestinations.filter((dest) => {
    const matchesSearch = dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || dest.category === selectedCategory;
    const matchesPrice = dest.price >= priceRange[0] && dest.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Explore <span className="text-primary">Destinations</span>
            </h1>
            <p className="text-muted-foreground">
              Discover educator-approved venues perfect for your next field trip.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Destinations</SheetTitle>
                    <SheetDescription>
                      Refine your search with additional filters.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-6">
                    <div className="space-y-4">
                      <Label>Price Range (per student)</Label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={30}
                        step={1}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Grade Levels</Label>
                      <div className="space-y-2">
                        {["Elementary (K-5)", "Middle School (6-8)", "High School (9-12)"].map((grade) => (
                          <div key={grade} className="flex items-center space-x-2">
                            <Checkbox id={grade} />
                            <label htmlFor={grade} className="text-sm text-foreground">
                              {grade}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Amenities</Label>
                      <div className="space-y-2">
                        {["Cafeteria", "Gift Shop", "Wheelchair Accessible", "Guided Tours"].map((amenity) => (
                          <div key={amenity} className="flex items-center space-x-2">
                            <Checkbox id={amenity} />
                            <label htmlFor={amenity} className="text-sm text-foreground">
                              {amenity}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-6">
            Showing {filteredDestinations.length} destinations
          </p>

          {/* Destinations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDestinations.map((destination) => (
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
                      <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFavorite(destination.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-background/90 backdrop-blur hover:bg-background transition-colors"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        favorites.includes(destination.id)
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                </div>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {destination.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {destination.description}
                  </p>
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
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {destination.distance} mi
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-lg font-bold text-primary">
                      ${destination.price}<span className="text-sm font-normal text-muted-foreground">/student</span>
                    </span>
                    <Button size="sm">
                      View Details
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Destinations;
