import { 
  MapPin, 
  Calendar, 
  ClipboardCheck, 
  Shield, 
  Users, 
  Bell,
  FileText,
  Bus,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

const FeaturesSection = () => {
  const { t } = useTranslation();
  const features = [
    { icon: MapPin, title: t("features.f1Title"), description: t("features.f1Desc") },
    { icon: Calendar, title: t("features.f2Title"), description: t("features.f2Desc") },
    { icon: ClipboardCheck, title: t("features.f3Title"), description: t("features.f3Desc") },
    { icon: Shield, title: t("features.f4Title"), description: t("features.f4Desc") },
    { icon: Users, title: t("features.f5Title"), description: t("features.f5Desc") },
    { icon: Bus, title: t("features.f6Title"), description: t("features.f6Desc") },
    { icon: DollarSign, title: t("features.f7Title"), description: t("features.f7Desc") },
    { icon: FileText, title: t("features.f8Title"), description: t("features.f8Desc") },
    { icon: Bell, title: t("features.f9Title"), description: t("features.f9Desc") },
  ];
  return (
    <section className="py-20 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("home.featuresTitle1")}{" "}
            <span className="text-primary">{t("home.featuresTitle2")}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("home.featuresSubtitle")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
