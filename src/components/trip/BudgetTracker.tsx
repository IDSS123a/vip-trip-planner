import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Bus, Hotel, Utensils, Ticket, Camera, MapPin, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Costs {
  transport: number;
  accommodation: number;
  meals: number;
  entry_fees: number;
  activity_fees: number;
  local_transport: number;
  contingency: number;
  total: number;
}

interface BudgetTrackerProps {
  costs?: Costs;
  costPerStudent?: number;
  studentCount?: number;
  budgetPerStudent?: number;
}

const BudgetTracker = ({ costs, costPerStudent, studentCount, budgetPerStudent }: BudgetTrackerProps) => {
  const { t } = useTranslation();
  if (!costs) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {t("budget.chartHint")}
        </CardContent>
      </Card>
    );
  }
  const total = costs.total || 1;
  const rows = [
    { key: "transport", label: t("budget.transport"), value: costs.transport, Icon: Bus },
    { key: "accommodation", label: t("budget.accommodation"), value: costs.accommodation, Icon: Hotel },
    { key: "meals", label: t("budget.meals"), value: costs.meals, Icon: Utensils },
    { key: "entry_fees", label: t("budget.entryFees"), value: costs.entry_fees, Icon: Ticket },
    { key: "activity_fees", label: t("budget.activities"), value: costs.activity_fees, Icon: Camera },
    { key: "local_transport", label: t("budget.localTransport"), value: costs.local_transport, Icon: MapPin },
    { key: "contingency", label: t("budget.contingency"), value: costs.contingency, Icon: Shield },
  ];
  const overBudget =
    budgetPerStudent && costPerStudent ? costPerStudent > budgetPerStudent : false;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5 text-primary" />
          {t("budget.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground">{t("budget.total")}</p>
            <p className="text-2xl font-bold">{total} {t("budget.currency")}</p>
            {studentCount ? (
              <p className="text-xs text-muted-foreground">{studentCount} {t("budget.students")} × {t("budget.perStudent").toLowerCase()}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t("budget.perStudent")}</p>
            <p className={`text-2xl font-bold ${overBudget ? "text-destructive" : "text-primary"}`}>
              {costPerStudent ?? Math.round(total / Math.max(studentCount || 1, 1))} {t("budget.currency")}
            </p>
            {budgetPerStudent ? (
              <p className="text-xs text-muted-foreground">{t("budget.budgetLimit")}: {budgetPerStudent} {t("budget.currency")}</p>
            ) : null}
          </div>
        </div>

        {budgetPerStudent ? (
          <div
            className={`flex items-start gap-2 rounded-md border p-2 text-xs ${
              overBudget
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-primary/30 bg-primary/5 text-primary"
            }`}
            role={overBudget ? "alert" : undefined}
          >
            {overBudget ? (
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            )}
            <span>{overBudget ? t("budget.overBudgetWarning") : t("budget.withinBudget")}</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("budget.noBudgetSet")}</p>
        )}

        <p className="text-xs font-semibold text-foreground">{t("budget.perCategory")}</p>
        <div className="space-y-3">
          {rows.map(({ key, label, value, Icon }) => {
            const pct = Math.round((value / total) * 100);
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {label}
                  </span>
                  <span className="tabular-nums">{value} {t("budget.currency")} · {pct}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetTracker;