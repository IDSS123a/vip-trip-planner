import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, HelpCircle, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Ime mora imati najmanje 2 znaka").max(100),
  email: z.string().email("Unesite ispravnu email adresu"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Odaberite temu"),
  message: z.string().min(10, "Poruka mora imati najmanje 10 znakova").max(1000),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactFormData) => {
    toast({
      title: "Poruka poslana!",
      description: "Odgovorit ćemo vam u roku od 24 sata.",
    });
    form.reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12">
        <div className="container">
          {/* Page Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Kontakt s <span className="text-primary">Nama</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Imate pitanja o planiranju ekskurzije? Naš tim vam stoji na raspolaganju za podršku.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Pišite nam</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      Odgovorit ćemo u roku od 24 sata
                    </p>
                    <a href="mailto:info@idss.ba" className="text-primary hover:underline">
                      info@idss.ba
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Pozovite nas</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      Pon-Pet, 08:00 – 16:00
                    </p>
                    <a href="tel:+38733560520" className="text-primary hover:underline">
                      +387 33 560 520
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Posjetite nas</h3>
                    <p className="text-muted-foreground text-sm">
                      Internationale Deutsche Schule Sarajevo<br />
                      Buka 13, 71 000 Sarajevo<br />
                      Bosna i Hercegovina
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Radno vrijeme</h3>
                    <p className="text-muted-foreground text-sm">
                      Ponedjeljak – Petak: 08:00 – 16:00<br />
                      Subota – Nedjelja: zatvoreno
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Pošaljite nam Poruku</CardTitle>
                  <CardDescription>
                    Ispunite obrazac ispod i odgovorit ćemo vam u najkraćem mogućem roku.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ime i Prezime</FormLabel>
                              <FormControl>
                                <Input placeholder="Ime Prezime" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Adresa</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="vase.ime@idss.ba" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon (Opcionalno)</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="+387 33 560 520" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tema</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Odaberite temu" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="general">Opšti upit</SelectItem>
                                  <SelectItem value="trip-planning">Pomoć pri planiranju</SelectItem>
                                  <SelectItem value="technical">Tehnička podrška</SelectItem>
                                  <SelectItem value="billing">Pitanje o naplati</SelectItem>
                                  <SelectItem value="partnership">Saradnja</SelectItem>
                                  <SelectItem value="feedback">Povratne informacije</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Poruka</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Kako vam možemo pomoći?"
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" size="lg" className="w-full md:w-auto">
                        <Send className="mr-2 h-4 w-4" />
                        Pošalji Poruku
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              Često Postavljana <span className="text-primary">Pitanja</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: HelpCircle,
                  question: "Kako da počnem?",
                  answer: "Kreirajte račun i koristite čarobnjaka za planiranje da biste za nekoliko minuta postavili prvu ekskurziju.",
                },
                {
                  icon: FileQuestion,
                  question: "Postoji li besplatna verzija?",
                  answer: "Da! Aplikacija je besplatna za sve nastavnike i osoblje IDSS škole.",
                },
                {
                  icon: MessageSquare,
                  question: "Mogu li roditelji pratiti ekskurziju?",
                  answer: "Roditelji dobijaju ažuriranja u realnom vremenu putem portala za roditelje.",
                },
              ].map((faq, index) => (
                <Card key={index} className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <faq.icon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">{faq.question}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
