import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, Clock, MapPin, Bus, Utensils, Camera, Hotel, Coffee, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  time: string;
  description: string;
  type: "travel" | "meal" | "activity" | "accommodation" | "free_time";
  location: string;
  notes?: string;
}

interface DayItinerary {
  day: number;
  title: string;
  activities: Activity[];
}

interface DailyTimelineProps {
  itinerary?: DayItinerary[];
  onChange?: (itinerary: DayItinerary[]) => void;
}

const ICONS: Record<Activity["type"], React.ComponentType<{ className?: string }>> = {
  travel: Bus,
  meal: Utensils,
  activity: Camera,
  accommodation: Hotel,
  free_time: Coffee,
};

function SortableRow({ id, activity, dragLabel, typeLabel }: { id: string; activity: Activity; dragLabel: string; typeLabel: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const Icon = ICONS[activity.type] || MapPin;
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/40"
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label={dragLabel}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-shrink-0 w-16 text-xs font-mono text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {activity.time}
      </div>
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center"
        title={typeLabel}
        aria-label={typeLabel}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{activity.description}</p>
        {activity.location ? (
          <p className="text-xs text-muted-foreground truncate">{activity.location}</p>
        ) : null}
      </div>
    </div>
  );
}

const DailyTimeline = ({ itinerary, onChange }: DailyTimelineProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [days, setDays] = useState<DayItinerary[]>(itinerary || []);
  const [activeDay, setActiveDay] = useState<number>(itinerary?.[0]?.day ?? 1);

  useEffect(() => {
    setDays(itinerary || []);
    if (itinerary?.[0]) setActiveDay(itinerary[0].day);
  }, [itinerary]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const current = useMemo(() => days.find((d) => d.day === activeDay) || days[0], [days, activeDay]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !current) return;
    const oldIndex = current.activities.findIndex((_, i) => `act-${i}` === active.id);
    const newIndex = current.activities.findIndex((_, i) => `act-${i}` === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newActivities = arrayMove(current.activities, oldIndex, newIndex);
    const next = days.map((d) => (d.day === current.day ? { ...d, activities: newActivities } : d));
    setDays(next);
    onChange?.(next);
  };

  if (!days.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {t("timeline.empty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-primary" />
              {t("timeline.title")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{t("timeline.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(activeDay)} onValueChange={(v) => setActiveDay(Number(v))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("timeline.selectDay")} />
              </SelectTrigger>
              <SelectContent>
                {days.map((d) => (
                  <SelectItem key={d.day} value={String(d.day)}>
                    {t("timeline.day")} {d.day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => toast({ title: t("timeline.orderSaved"), description: t("timeline.dragHint") })}
            >
              <Save className="h-4 w-4" />
              {t("timeline.saveOrder")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {current ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="rounded-full">
                {t("timeline.day")} {current.day}
              </Badge>
              <span className="text-sm font-medium">{current.title}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {current.activities.length} {t("timeline.activities")}
              </span>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={current.activities.map((_, i) => `act-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {current.activities.map((a, i) => (
                    <SortableRow
                      key={`act-${i}`}
                      id={`act-${i}`}
                      activity={a}
                      dragLabel={t("timeline.dragHandle")}
                      typeLabel={t(`timeline.activityTypes.${a.type}`)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DailyTimeline;