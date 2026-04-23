import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, Info, RefreshCw } from "lucide-react";
import {
  getGradePlan,
  checkDestinationCompliance,
  violatesRotation,
} from "@/lib/idssRegulations";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  gradeLevel?: string;
  destinations: string[];
  previousYearDestination: string;
  onPreviousYearChange: (value: string) => void;
}

/**
 * Banner preporuka i upozorenja prema IDSS Pravilniku.
 * NE blokira korisnika - samo informira (model "Preporuka + upozorenje").
 */
export const IdssComplianceBanner = ({
  gradeLevel,
  destinations,
  previousYearDestination,
  onPreviousYearChange,
}: Props) => {
  const [autoHistory, setAutoHistory] = useState<string[]>([]);
  const plan = getGradePlan(gradeLevel);

  // Učitaj automatski historijat iz baze (trip_history) za grupu razreda
  useEffect(() => {
    if (!plan) {
      setAutoHistory([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("trip_history")
        .select("destination, school_year")
        .eq("grade_group", plan.groupKey)
        .order("school_year", { ascending: false })
        .limit(2);
      if (!cancelled && data) {
        setAutoHistory(data.map((r) => r.destination));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plan]);

  if (!gradeLevel) return null;
  if (!plan) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Pravilnik IDSS</AlertTitle>
        <AlertDescription>
          Za odabrani razred ne postoji propisana destinacija u Pravilniku. Slobodno planirajte uz uobičajena pravila.
        </AlertDescription>
      </Alert>
    );
  }

  const compliance = checkDestinationCompliance(gradeLevel, destinations);
  const combinedHistory = [
    ...autoHistory,
    ...(previousYearDestination ? [previousYearDestination] : []),
  ];
  const rotation = violatesRotation(gradeLevel, destinations, combinedHistory);

  return (
    <div className="space-y-3">
      <Alert className="border-primary/40 bg-primary/5">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <AlertTitle className="flex items-center gap-2 flex-wrap">
          IDSS Pravilnik – {plan.gradeLabel}
          <Badge variant="secondary" className="text-xs">{plan.categoryLabel}</Badge>
          <Badge variant="outline" className="text-xs">{plan.days} dana / {plan.nights} noći</Badge>
        </AlertTitle>
        <AlertDescription className="space-y-2 text-sm">
          <div>
            <strong>Propisane destinacije:</strong> {plan.destinations.join(", ")}
          </div>
          <div className="text-muted-foreground text-xs">{plan.groupingNote}</div>
        </AlertDescription>
      </Alert>

      {!compliance.compliant && destinations.length > 0 && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/5">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Preporuka: destinacija van Pravilnika</AlertTitle>
          <AlertDescription className="text-sm">{compliance.message}</AlertDescription>
        </Alert>
      )}

      {plan.rotationDestinations.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <RefreshCw className="h-4 w-4 text-primary" />
            Rotacija (Pravilnik Glava II, Član 4)
          </div>
          {autoHistory.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Automatski iz baze (zadnje godine): <strong>{autoHistory.join(", ")}</strong>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="prev-year-dest" className="text-xs">
              Prošlogodišnja destinacija (ručni unos / override)
            </Label>
            <div className="flex gap-2">
              <Input
                id="prev-year-dest"
                value={previousYearDestination}
                onChange={(e) => onPreviousYearChange(e.target.value)}
                placeholder={`npr. ${plan.primaryDestination}`}
                className="text-sm"
              />
              {previousYearDestination && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onPreviousYearChange("")}
                >
                  Očisti
                </Button>
              )}
            </div>
          </div>
          {rotation.violates && (
            <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/5 mt-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-xs">{rotation.message}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default IdssComplianceBanner;