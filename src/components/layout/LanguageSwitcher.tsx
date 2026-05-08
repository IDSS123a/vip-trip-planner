import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const LANGS = [
  { code: "bs", labelKey: "common.bosnian", short: "BS" },
  { code: "en", labelKey: "common.english", short: "EN" },
] as const;

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  // Apply lang attribute on <html> for SEO and screen readers.
  useEffect(() => {
    document.documentElement.lang = i18n.language || "bs";
  }, [i18n.language]);

  // On auth, sync preferred_language from profile if available.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("user_id", user.id)
        .maybeSingle();
      const remote = (data as any)?.preferred_language as string | undefined;
      if (remote && remote !== i18n.language) {
        await i18n.changeLanguage(remote);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const change = async (code: string) => {
    await i18n.changeLanguage(code);
    try {
      localStorage.setItem("idss-language", code);
    } catch {
      /* noop */
    }
    if (isAuthenticated && user) {
      await supabase
        .from("profiles")
        .update({ preferred_language: code })
        .eq("user_id", user.id);
    }
  };

  const current = (i18n.language || "bs").slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" aria-label={t("common.language")}>
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => change(l.code)}
            className={i18n.language?.startsWith(l.code) ? "font-semibold" : undefined}
          >
            <span className="mr-2 text-xs opacity-70">{l.short}</span>
            {t(l.labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;