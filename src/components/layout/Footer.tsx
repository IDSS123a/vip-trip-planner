import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import idssLogo from "@/assets/idss-logo.png";
import { IDSS_SCHOOL } from "@/lib/idssRegulations";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary p-1.5">
                <img src={idssLogo} alt="IDSS Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">IDSS Ekskurzije</span>
                <span className="text-xs text-muted-foreground">Planer Putovanja</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              Internationale Deutsche Schule Sarajevo - Planiranje nezaboravnih obrazovnih iskustava.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Brzi Linkovi</h4>
            <ul className="space-y-2">
              {[
                { name: "Planiraj Ekskurziju", href: "/plan-trip" },
                { name: "Moje Ekskurzije", href: "/my-trips" },
                { name: "Destinacije", href: "/destinations" },
                { name: "Sigurnosne Smjernice", href: "/safety-guidelines" },
                { name: "FAQ", href: "/faq" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Resursi</h4>
            <ul className="space-y-2">
              {[
                { name: "Vodič za Nastavnike", href: "/teacher-guide" },
                { name: "Portal za Roditelje", href: "/parent-portal" },
                { name: "Hitni Postupci", href: "/emergency-procedures" },
                { name: "Pristupačnost", href: "/accessibility" },
                { name: "Politika Privatnosti", href: "/privacy-policy" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Kontakt</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                {IDSS_SCHOOL.email}
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>
                  {IDSS_SCHOOL.phone}
                  <br />
                  <span className="text-xs">mob {IDSS_SCHOOL.mobile}</span>
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>{IDSS_SCHOOL.address}<br />{IDSS_SCHOOL.city}<br />{IDSS_SCHOOL.country}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-primary font-semibold">Web:</span>
                <a href={IDSS_SCHOOL.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{IDSS_SCHOOL.website}</a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground mb-6">
          <div>
            <span className="font-semibold text-foreground">Direktor:</span> {IDSS_SCHOOL.director}
            <br />
            <span className="font-semibold text-foreground">ID broj:</span> {IDSS_SCHOOL.registration.idNumber}
            {" · "}
            <span className="font-semibold text-foreground">REG broj:</span> {IDSS_SCHOOL.registration.regNumber}
          </div>
          <div className="md:text-right">
            <span className="font-semibold text-foreground">{IDSS_SCHOOL.bank.name}</span>
            <br />
            IBAN: {IDSS_SCHOOL.bank.iban} · SWIFT: {IDSS_SCHOOL.bank.swift}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Internationale Deutsche Schule Sarajevo. Sva prava zadržana.
          </p>
          <div className="flex items-center gap-4">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
              <a
                key={index}
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
