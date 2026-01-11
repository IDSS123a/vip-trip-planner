import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">IDSS Field Trip</span>
                <span className="text-xs text-muted-foreground">Planer Ekskurzija</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              Internationale Deutsche Schule Sarajevo - Planiranje nezaboravnih obrazovnih iskustava.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2">
              {["Plan a Trip", "My Trips", "Destinations", "Safety Guidelines", "FAQ"].map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Resources</h4>
            <ul className="space-y-2">
              {["Teacher Guide", "Parent Portal", "Emergency Procedures", "Accessibility", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item}
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
                info@idss.ba
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                +387 33 560 520
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>Buka 13<br />71000 Sarajevo, BiH</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} IDSS Superior Field Trip Planner. All rights reserved.
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
