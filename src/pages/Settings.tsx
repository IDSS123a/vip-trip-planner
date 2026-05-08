import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, User, Shield, Smartphone, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLanguageChange = async (lang: string) => {
    await i18n.changeLanguage(lang);
    try { localStorage.setItem("idss-language", lang); } catch { /* noop */ }
    if (user) {
      await supabase.from("profiles").update({ preferred_language: lang }).eq("user_id", user.id);
    }
    toast({ title: t("settings.languageUpdated") });
  };

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
              {t("settings.loginRequired")}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("settings.loginRequiredDesc")}
            </p>
            <Button asChild>
              <Link to="/auth">{t("nav.login")}</Link>
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
                <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
                <p className="text-muted-foreground">{t("settings.subtitle")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Profile Info */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {t("settings.profileInfo")}
                </CardTitle>
                <CardDescription>
                  {t("settings.profileDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("settings.fullName")}</p>
                      <p className="text-muted-foreground">{profile?.fullName || t("settings.notSet")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("settings.email")}</p>
                      <p className="text-muted-foreground">{profile?.email || t("settings.notSet")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("settings.school")}</p>
                      <p className="text-muted-foreground">{profile?.schoolName || t("settings.notSet")}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Language */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {t("settings.languageTitle")}
                </CardTitle>
                <CardDescription>{t("settings.languageDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={(i18n.language || "bs").startsWith("en") ? "en" : "bs"} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bs">{t("common.bosnian")}</SelectItem>
                    <SelectItem value="en">{t("common.english")}</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <NotificationSettings />

            {/* App Settings */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  {t("settings.appSection")}
                </CardTitle>
                <CardDescription>{t("settings.appDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" asChild>
                    <Link to="/install">
                      <Smartphone className="mr-2 h-4 w-4" />
                      {t("settings.installApp")}
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
                  {t("settings.securityTitle")}
                </CardTitle>
                <CardDescription>{t("settings.securityDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">{t("settings.changePassword")}</p>
                    <Button variant="outline" asChild>
                      <Link to="/auth">
                        {t("settings.changePassword")}
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
