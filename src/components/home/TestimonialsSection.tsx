import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    content: "Platforma je u potpunosti pojednostavila planiranje ekskurzija. Ono što je nekad trajalo sedmicama sada se obavi za par sati. Generisanje saglasnosti roditelja prema Prilogu 1 nam je uštedjelo puno vremena.",
    author: "Amina Hadžić",
    role: "Razredna nastavnica, 5. razred",
    school: "Internationale Deutsche Schule Sarajevo",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60",
    rating: 5,
  },
  {
    id: 2,
    content: "Kao direktor imam potpuni uvid u sve ekskurzije škole. Sigurnosne funkcije i ažuriranja u realnom vremenu daju mi mir svaki put kad učenici napuste školu.",
    author: "Davor Mulalić",
    role: "Direktor",
    school: "Internationale Deutsche Schule Sarajevo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60",
    rating: 5,
  },
  {
    id: 3,
    content: "Baza preporučenih destinacija prema IDSS Pravilniku pomaže mi da otkrijem izvanredne edukativne prilike. Angažovanost mojih učenika je primjetno porasla.",
    author: "Selma Begović",
    role: "Predmetni nastavnik prirodnih nauka",
    school: "Internationale Deutsche Schule Sarajevo",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=60",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Iskustva <span className="text-primary">Nastavnika</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Pogledajte šta nastavnici i uprava IDSS škole kažu o svojim iskustvima.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card 
              key={testimonial.id} 
              className="border-border bg-card hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-6 space-y-6">
                {/* Quote Icon */}
                <div className="flex items-center justify-between">
                  <Quote className="h-10 w-10 text-primary/20" />
                  <div className="flex gap-0.5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-primary fill-primary" />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <p className="text-foreground leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                    <AvatarFallback>{testimonial.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-sm text-primary">{testimonial.school}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
