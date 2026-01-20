import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, User, Bell, Shield, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Settings = () => {
  const { isAuthenticated, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <div className="max-w-3xl mx-auto">
            <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8" />
            <div className="h-64 bg-muted animate-pulse rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
              <SettingsIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Prijavite se za pristup postavkama
            </h1>
            <p className="text-muted-foreground mb-6">
              Morate biti prijavljeni kako biste pristupili postavkama vašeg računa.
            </p>
            <Button asChild>
              <Link to="/auth">Prijava</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <SettingsIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Postavke</h1>
                <p className="text-muted-foreground">Upravljajte vašim postavkama i preferencijama</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Profile Info */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informacije o Profilu
                </CardTitle>
                <CardDescription>
                  Vaši podaci o računu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Ime i Prezime</p>
                      <p className="text-muted-foreground">{profile?.fullName || "Nije postavljeno"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Email</p>
                      <p className="text-muted-foreground">{profile?.email || "Nije postavljeno"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Škola</p>
                      <p className="text-muted-foreground">{profile?.schoolName || "Nije postavljeno"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <NotificationSettings />

            {/* App Settings */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Aplikacija
                </CardTitle>
                <CardDescription>
                  Postavke aplikacije i instalacija
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Instalirajte aplikaciju na vaš uređaj za brži pristup i rad offline.
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/install">
                      <Smartphone className="mr-2 h-4 w-4" />
                      Instaliraj Aplikaciju
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Sigurnost
                </CardTitle>
                <CardDescription>
                  Upravljanje sigurnošću vašeg računa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Promjena Lozinke</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Da biste promijenili lozinku, koristite opciju za resetiranje lozinke na stranici za prijavu.
                    </p>
                    <Button variant="outline" asChild>
                      <Link to="/auth">
                        Promijeni Lozinku
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
