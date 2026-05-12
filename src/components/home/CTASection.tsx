import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const CTASection = () => {
  const { t } = useTranslation();
  const benefits = [
    t("home.ctaBenefit1"),
    t("home.ctaBenefit2"),
    t("home.ctaBenefit3"),
    t("home.ctaBenefit4"),
  ];
  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-foreground rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary-foreground rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="container relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Content */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              {t("home.ctaHeadline")}
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl">
              {t("home.ctaSubheadline")}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-primary-foreground/90">
                  <CheckCircle className="h-5 w-5 text-primary-foreground" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Card */}
          <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {t("home.ctaCardTitle")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("home.ctaCardSubtitle")}
            </p>
            <div className="space-y-4">
              <Link to="/plan-trip" className="block">
                <Button size="lg" className="w-full group">
                  {t("home.ctaCardButton")}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <p className="text-center text-sm text-muted-foreground">
                {t("home.ctaHaveAccount")}{" "}
                <Link to="/auth" className="text-primary hover:underline font-medium">
                  {t("home.ctaSignIn")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
