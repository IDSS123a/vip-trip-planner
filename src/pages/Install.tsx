import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Bell, 
  Zap,
  CheckCircle,
  Share,
  PlusSquare,
  MoreVertical,
  ArrowRight
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: WifiOff,
      title: "Radi Offline",
      description: "Pristupite planovima ekskurzija čak i bez internetske veze."
    },
    {
      icon: Zap,
      title: "Brzo Učitavanje",
      description: "Aplikacija se učitava trenutno, bez čekanja na preuzimanje."
    },
    {
      icon: Bell,
      title: "Push Obavijesti",
      description: "Primajte obavijesti o ažuriranjima ekskurzija i dozvolama."
    },
    {
      icon: Smartphone,
      title: "Nativno Iskustvo",
      description: "Osjećaj prave aplikacije na vašem početnom ekranu."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4">
            {isOnline ? (
              <><Wifi className="h-3 w-3 mr-1" /> Online</>
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
            )}
          </Badge>
          
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
                <Download className="h-10 w-10 text-primary-foreground" />
              </div>
              {isInstalled && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Instalirajte <span className="text-primary">IDSS Field Trip</span> Aplikaciju
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Dodajte aplikaciju na početni ekran za brži pristup i rad offline.
          </p>

          {/* Install Status */}
          {isInstalled ? (
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Aplikacija je već instalirana!</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Možete je pronaći na vašem početnom ekranu.
                </p>
              </CardContent>
            </Card>
          ) : deferredPrompt ? (
            <Button size="lg" onClick={handleInstall} className="mb-8">
              <Download className="mr-2 h-5 w-5" />
              Instaliraj Aplikaciju
            </Button>
          ) : isIOS ? (
            <Card className="border-primary/20 bg-primary/5 mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Instalirajte na iOS</CardTitle>
                <CardDescription>Slijedite ove korake za instalaciju:</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">Otvorite izbornik za dijeljenje</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Dodirnite ikonu <Share className="h-4 w-4" /> na dnu ekrana
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    2
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">Dodaj na početni ekran</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Odaberite "Add to Home Screen" <PlusSquare className="h-4 w-4" />
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    3
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">Potvrdite instalaciju</p>
                    <p className="text-sm text-muted-foreground">Dodirnite "Add" u gornjem desnom kutu</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/20 bg-primary/5 mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Instalirajte iz preglednika</CardTitle>
                <CardDescription>Slijedite ove korake za instalaciju:</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">Otvorite izbornik preglednika</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Dodirnite <MoreVertical className="h-4 w-4" /> u gornjem desnom kutu
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    2
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">Instaliraj aplikaciju</p>
                    <p className="text-sm text-muted-foreground">Odaberite "Install app" ili "Add to Home screen"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="border-border bg-card text-center">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mx-auto mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Spremni za planiranje?
            </h3>
            <p className="text-muted-foreground mb-4">
              Započnite s planiranjem vaše sljedeće nezaboravne ekskurzije.
            </p>
            <Link to="/plan-trip">
              <Button>
                Planiraj Ekskurziju
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Install;
