import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Mail, Clock } from "lucide-react";

const PrivacyPolicy = () => {
  const lastUpdated = "15. januar 2026.";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Politika Privatnosti
          </h1>
          <p className="text-lg text-muted-foreground">
            Vaša privatnost je naš prioritet. Ovdje objašnjavamo kako prikupljamo, koristimo i štitimo vaše podatke.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Zadnja izmjena: {lastUpdated}
          </p>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Šifrirana Pohrana</h3>
              <p className="text-sm text-muted-foreground">
                Svi podaci su šifrirani i sigurno pohranjeni na zaštićenim serverima.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <Eye className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Kontrola Pristupa</h3>
              <p className="text-sm text-muted-foreground">
                Vi kontrolirate tko može vidjeti vaše podatke i planove ekskurzija.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <Database className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">GDPR Usklađenost</h3>
              <p className="text-sm text-muted-foreground">
                U potpunosti smo usklađeni s europskim propisima o zaštiti podataka.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Policy Sections */}
        <div className="space-y-8 max-w-4xl mx-auto">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>1. Prikupljanje Podataka</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
              <p>Prikupljamo sljedeće vrste podataka:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Podaci o računu:</strong> ime, e-mail adresa, naziv škole pri registraciji.</li>
                <li><strong>Podaci o ekskurzijama:</strong> destinacije, datumi, broj učenika, itinereri koje kreirate.</li>
                <li><strong>Podaci o učenicima:</strong> imena, kontakti roditelja, medicinske napomene (koje vi unosite).</li>
                <li><strong>Tehnički podaci:</strong> IP adresa, vrsta preglednika, vrijeme pristupa za sigurnosne svrhe.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>2. Korištenje Podataka</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
              <p>Vaše podatke koristimo isključivo za:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Omogućavanje funkcionalnosti platforme za planiranje ekskurzija.</li>
                <li>Generiranje dokumentacije (PDF izvještaji, dozvole, liste učenika).</li>
                <li>Slanje obavijesti vezanih uz vaš račun i ekskurzije.</li>
                <li>Poboljšanje korisničkog iskustva i sigurnosti platforme.</li>
              </ul>
              <p className="mt-4">
                <strong>Nikada ne prodajemo vaše podatke trećim stranama.</strong>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>3. Dijeljenje Podataka</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
              <p>Podatke dijelimo samo u sljedećim situacijama:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>S vašim dopuštenjem:</strong> kada eksplicitno podijelite plan ekskurzije putem linka.</li>
                <li><strong>Pravne obaveze:</strong> kada smo zakonski obvezni (sudski nalozi, regulatorna tijela).</li>
                <li><strong>Pružatelji usluga:</strong> sa strogo kontroliranim partnerima za hosting i sigurnost.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>4. Sigurnost Podataka</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
              <p>Primjenjujemo napredne mjere sigurnosti:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>SSL/TLS šifriranje za sve podatke u prijenosu.</li>
                <li>AES-256 šifriranje za podatke u mirovanju.</li>
                <li>Redovite sigurnosne revizije i penetracijska testiranja.</li>
                <li>Stroga kontrola pristupa i autentifikacija.</li>
                <li>Automatsko otkrivanje i zaštita od curenja lozinki.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>5. Vaša Prava</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
              <p>Imate sljedeća prava u vezi vaših podataka:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Pristup:</strong> Možete zatražiti kopiju svih vaših podataka.</li>
                <li><strong>Ispravak:</strong> Možete ažurirati netočne podatke u bilo kojem trenutku.</li>
                <li><strong>Brisanje:</strong> Možete zatražiti trajno brisanje svih vaših podataka.</li>
                <li><strong>Prenosivost:</strong> Možete eksportirati svoje podatke u standardnom formatu.</li>
                <li><strong>Prigovor:</strong> Možete uložiti prigovor na određene obrade podataka.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>6. Kolačići (Cookies)</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
              <p>Koristimo samo neophodne kolačiće za:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Održavanje vaše prijavljene sesije.</li>
                <li>Pamćenje vaših postavki i preferencija.</li>
                <li>Zaštitu od CSRF napada i drugih sigurnosnih prijetnji.</li>
              </ul>
              <p className="mt-4">
                Ne koristimo kolačiće za praćenje ili oglašavanje.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>7. Zadržavanje Podataka</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
              <p>
                Vaše podatke čuvamo dok god imate aktivan račun. Neaktivni računi se brišu nakon 24 mjeseca neaktivnosti, uz prethodnu obavijest.
              </p>
              <p className="mt-4">
                Ekskurzije možete ručno obrisati u bilo kojem trenutku, a brisanje je trenutno i nepovratno.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>8. Kontakt</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
              <p>Za sva pitanja u vezi privatnosti, kontaktirajte nas:</p>
              <div className="flex items-center gap-2 mt-4">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:privacy@idss.ba" className="text-primary hover:underline">
                  privacy@idss.ba
                </a>
              </div>
              <p className="mt-4">
                Odgovaramo na sve upite u roku od 30 dana.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
