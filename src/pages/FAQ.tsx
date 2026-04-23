import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const faqCategories = [
  {
    title: "Opća Pitanja",
    faqs: [
      {
        question: "Što je IDSS Ekskurzije – Planer Putovanja?",
        answer: "IDSS Ekskurzije – Planer Putovanja je digitalna platforma za planiranje školskih ekskurzija. Omogućuje nastavnicima da kreiraju detaljne planove putovanja, upravljaju dozvolama roditelja, prate budžet i koordiniraju sve aspekte ekskurzije na jednom mjestu.",
      },
      {
        question: "Je li korištenje platforme besplatno?",
        answer: "Da, platforma je potpuno besplatna za nastavnike i škole. Nema skrivenih troškova niti potrebe za kreditnom karticom.",
      },
      {
        question: "Mogu li koristiti platformu na mobilnom uređaju?",
        answer: "Da, platforma je u potpunosti responzivna i može se koristiti na bilo kojem uređaju - računalu, tabletu ili pametnom telefonu.",
      },
      {
        question: "Kako mogu započeti s korištenjem platforme?",
        answer: "Jednostavno se registrirajte s vašom e-mail adresom, a zatim možete odmah početi planirati svoju prvu ekskurziju. Platforma će vas voditi kroz svaki korak procesa.",
      },
    ],
  },
  {
    title: "Planiranje Ekskurzija",
    faqs: [
      {
        question: "Koliko unaprijed trebam planirati ekskurziju?",
        answer: "Preporučujemo planiranje najmanje 4-6 tjedana unaprijed za jednodnevne ekskurzije, i 2-3 mjeseca za višednevne. To daje dovoljno vremena za prikupljanje dozvola, organizaciju prijevoza i potvrdu rezervacija.",
      },
      {
        question: "Mogu li kreirati više varijanti plana ekskurzije?",
        answer: "Da, sustav automatski generira tri varijante plana (Regular, Middle, VIP) s različitim razinama usluge i cijenama, tako da možete odabrati onu koja najbolje odgovara vašem budžetu i potrebama.",
      },
      {
        question: "Kako se izračunava minimalni broj pratitelja?",
        answer: "Broj pratitelja se automatski izračunava prema pravilima škole i uzrastu učenika. Općenito, mlađi učenici zahtijevaju više pratitelja (1:4 za predškolce do 1:10 za srednju školu).",
      },
      {
        question: "Mogu li dijeliti plan ekskurzije s roditeljima?",
        answer: "Da, svaki plan ima jedinstveni link za dijeljenje. Roditelji mogu pregledati itinerer, mapu rute i sve relevantne informacije bez potrebe za prijavom.",
      },
    ],
  },
  {
    title: "Dozvole i Dokumentacija",
    faqs: [
      {
        question: "Kako funkcioniraju digitalne dozvole?",
        answer: "Platforma omogućuje generiranje PDF obrazaca za dozvole roditelja koje možete distribuirati putem e-maila ili ispisati. Obrazac uključuje sve potrebne informacije o ekskurziji i prostor za potpis.",
      },
      {
        question: "Mogu li generirati listu učenika?",
        answer: "Da, možete unijeti podatke o učenicima (ime, spol, kontakt roditelja, medicinske napomene) i generirati PDF listu za potrebe prebrojavanja i hitnih situacija.",
      },
      {
        question: "Je li moguće eksportirati dokumentaciju?",
        answer: "Da, svu dokumentaciju možete eksportirati u PDF formatu - uključujući itinerer, listu učenika, dozvole roditelja i kompletnu dokumentaciju ekskurzije.",
      },
    ],
  },
  {
    title: "Sigurnost i Privatnost",
    faqs: [
      {
        question: "Kako su zaštićeni podaci o učenicima?",
        answer: "Svi podaci su šifrirani i pohranjeni na sigurnim serverima. Pristup podacima imaju samo ovlašteni nastavnici, a svi podaci se obrađuju u skladu s GDPR propisima.",
      },
      {
        question: "Tko ima pristup mojim podacima?",
        answer: "Samo vi i osobe s kojima eksplicitno podijelite pristup mogu vidjeti vaše planove ekskurzija. Administratori škole mogu imati pregled nad ekskurzijama svoje škole.",
      },
      {
        question: "Mogu li obrisati svoje podatke?",
        answer: "Da, možete u bilo kojem trenutku obrisati svoje ekskurzije i osobne podatke. Brisanje je trajno i nepovratno.",
      },
    ],
  },
  {
    title: "Tehnička Podrška",
    faqs: [
      {
        question: "Što ako naiđem na tehničke probleme?",
        answer: "Kontaktirajte nas putem e-maila na info@idss.ba ili koristite kontakt obrazac na stranici. Naš tim za podršku odgovara u roku od 24 sata.",
      },
      {
        question: "Podržava li platforma sve preglednike?",
        answer: "Da, platforma radi na svim modernim preglednicima - Chrome, Firefox, Safari, Edge. Preporučujemo korištenje najnovije verzije preglednika za najbolje iskustvo.",
      },
      {
        question: "Mogu li raditi offline?",
        answer: "Trenutno platforma zahtijeva internetsku vezu. Međutim, možete preuzeti PDF dokumentaciju za offline pristup tijekom ekskurzije.",
      },
    ],
  },
];

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Često Postavljana Pitanja
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Pronađite odgovore na najčešća pitanja o našoj platformi za planiranje ekskurzija.
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pretražite pitanja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {filteredCategories.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="border-border bg-card">
              <CardHeader>
                <CardTitle>{category.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.faqs.map((faq, faqIndex) => (
                    <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nema pronađenih pitanja
            </h3>
            <p className="text-muted-foreground">
              Pokušajte s drugim pojmom za pretraživanje ili nas kontaktirajte direktno.
            </p>
          </div>
        )}

        {/* Contact CTA */}
        <Card className="border-primary/20 bg-primary/5 mt-12">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Niste pronašli odgovor?
            </h3>
            <p className="text-muted-foreground mb-4">
              Naš tim za podršku rado će vam pomoći s bilo kojim pitanjem.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Kontaktirajte Nas
            </a>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
