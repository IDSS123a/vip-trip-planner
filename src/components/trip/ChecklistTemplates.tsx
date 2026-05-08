import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ClipboardList } from "lucide-react";

interface ChecklistTemplatesProps {
  storageKey?: string;
}

const TEMPLATES: Record<string, string[]> = {
  packing: ["clothes", "shoes", "toiletries", "medicine", "water", "snacks", "charger", "cash", "flashlight"],
  documents: ["passport", "idCard", "consent", "insurance", "medicalNote", "contactList"],
  safety: ["firstAid", "whistle", "headcount", "meetingPoint", "emergencyPhone"],
};

const ChecklistTemplates = ({ storageKey = "idss-checklist-default" }: ChecklistTemplatesProps) => {
  const { t } = useTranslation();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {/* noop */}
  }, [storageKey]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(checked)); } catch {/* noop */}
  }, [checked, storageKey]);

  const totals = useMemo(() => {
    const all = Object.values(TEMPLATES).flat();
    const done = all.filter((k) => checked[k]).length;
    return { all: all.length, done, pct: Math.round((done / all.length) * 100) };
  }, [checked]);

  const renderList = (items: string[]) => (
    <ul className="space-y-2">
      {items.map((k) => (
        <li key={k} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
          <Checkbox
            id={`chk-${k}`}
            checked={!!checked[k]}
            onCheckedChange={(v) => setChecked((prev) => ({ ...prev, [k]: !!v }))}
          />
          <label htmlFor={`chk-${k}`} className="text-sm cursor-pointer flex-1">
            {t(`checklist.items.${k}`)}
          </label>
        </li>
      ))}
    </ul>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-5 w-5 text-primary" />
          {t("checklist.title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("checklist.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{t("checklist.progress")}</span>
            <span className="tabular-nums">{totals.done}/{totals.all} · {totals.pct}%</span>
          </div>
          <Progress value={totals.pct} className="h-1.5" />
        </div>
        <Tabs defaultValue="packing">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="packing">{t("checklist.packing")}</TabsTrigger>
            <TabsTrigger value="documents">{t("checklist.documents")}</TabsTrigger>
            <TabsTrigger value="safety">{t("checklist.safety")}</TabsTrigger>
          </TabsList>
          <TabsContent value="packing" className="pt-3">{renderList(TEMPLATES.packing)}</TabsContent>
          <TabsContent value="documents" className="pt-3">{renderList(TEMPLATES.documents)}</TabsContent>
          <TabsContent value="safety" className="pt-3">{renderList(TEMPLATES.safety)}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ChecklistTemplates;