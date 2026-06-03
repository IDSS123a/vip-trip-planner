import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
      title: t("contactPage.sentTitle"),
      description: t("contactPage.sentDesc"),
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
              {t("contactPage.title1")} <span className="text-primary">{t("contactPage.title2")}</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("contactPage.subtitle")}
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
                    <h3 className="font-semibold text-foreground mb-1">{t("contactPage.writeUs")}</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      {t("contactPage.writeUsDesc")}
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
                    <h3 className="font-semibold text-foreground mb-1">{t("contactPage.callUs")}</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      {t("contactPage.callUsHours")}
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
                    <h3 className="font-semibold text-foreground mb-1">{t("contactPage.visitUs")}</h3>
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
                    <h3 className="font-semibold text-foreground mb-1">{t("contactPage.workingHours")}</h3>
                    <p className="text-muted-foreground text-sm whitespace-pre-line">
                      {t("contactPage.workingHoursValue")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">{t("contactPage.sendMessage")}</CardTitle>
                  <CardDescription>
                    {t("contactPage.sendDesc")}
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
                              <FormLabel>{t("contactPage.nameLabel")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("contactPage.namePh")} {...field} />
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
                              <FormLabel>{t("contactPage.emailLabel")}</FormLabel>
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
                              <FormLabel>{t("contactPage.phoneLabel")}</FormLabel>
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
                              <FormLabel>{t("contactPage.subjectLabel")}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("contactPage.subjectPh")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="general">{t("contactPage.subjGeneral")}</SelectItem>
                                  <SelectItem value="trip-planning">{t("contactPage.subjPlanning")}</SelectItem>
                                  <SelectItem value="technical">{t("contactPage.subjTechnical")}</SelectItem>
                                  <SelectItem value="billing">{t("contactPage.subjBilling")}</SelectItem>
                                  <SelectItem value="partnership">{t("contactPage.subjPartnership")}</SelectItem>
                                  <SelectItem value="feedback">{t("contactPage.subjFeedback")}</SelectItem>
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
                            <FormLabel>{t("contactPage.messageLabel")}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t("contactPage.messagePh")}
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
                        {t("contactPage.sendBtn")}
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
              {t("contactPage.faqTitle1")} <span className="text-primary">{t("contactPage.faqTitle2")}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: HelpCircle,
                  question: t("contactPage.faq1Q"),
                  answer: t("contactPage.faq1A"),
                },
                {
                  icon: FileQuestion,
                  question: t("contactPage.faq2Q"),
                  answer: t("contactPage.faq2A"),
                },
                {
                  icon: MessageSquare,
                  question: t("contactPage.faq3Q"),
                  answer: t("contactPage.faq3A"),
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
