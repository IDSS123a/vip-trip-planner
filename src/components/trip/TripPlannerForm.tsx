import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TripFormData {
  tripName?: string;
  departureCity?: string;
  destinations?: string[];
  departureAddress?: string;
  tripType?: string;
  gradeLevel?: string;
  studentCount?: string;
  chaperones?: string[];
  transport?: string;
  tripDate?: Date;
  returnDate?: Date;
  budgetPerStudent?: string;
  educationalFocus?: string;
  specialNeeds?: string;
}

interface TripPlannerFormProps {
  form: UseFormReturn<TripFormData>;
}

const TripPlannerForm = ({ form }: TripPlannerFormProps) => {
  const [newDestination, setNewDestination] = useState("");
  const [newChaperone, setNewChaperone] = useState("");

  const destinations = form.watch("destinations") || [];
  const chaperones = form.watch("chaperones") || [];

  const addDestination = () => {
    if (newDestination.trim()) {
      const current = form.getValues("destinations") || [];
      form.setValue("destinations", [...current, newDestination.trim()]);
      setNewDestination("");
    }
  };

  const removeDestination = (index: number) => {
    const current = form.getValues("destinations") || [];
    form.setValue("destinations", current.filter((_, i) => i !== index));
  };

  const addChaperone = () => {
    if (newChaperone.trim()) {
      const current = form.getValues("chaperones") || [];
      form.setValue("chaperones", [...current, newChaperone.trim()]);
      setNewChaperone("");
    }
  };

  const removeChaperone = (index: number) => {
    const current = form.getValues("chaperones") || [];
    form.setValue("chaperones", current.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-semibold text-foreground">
          1. Unesite podatke za planiranje ekskurzije
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Popunite sve potrebne informacije za generiranje 3 detaljne opcije plana putovanja
        </p>
      </div>

      {/* Row 1: Departure City and Destinations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departure City */}
        <FormField
          control={form.control}
          name="departureCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Polazna tačka (ostavite prazno za IDSS)</FormLabel>
              <FormControl>
                <Input placeholder="npr. Sarajevo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Destinations - Multi-stop */}
        <FormItem>
          <FormLabel>Ruta Putovanja (Destinacije)</FormLabel>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Unesite destinaciju"
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDestination())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addDestination}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {destinations.map((dest, index) => (
                <Badge key={index} variant="secondary" className="gap-1 pr-1">
                  {dest}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeDestination(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Dodajte jednu ili više destinacija u redoslijedu posjete
            </p>
          </div>
        </FormItem>
      </div>

      {/* Row 2: Trip Type, Grade Level, Search Scope */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Trip Type */}
        <FormField
          control={form.control}
          name="tripType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tip ekskurzije</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite tip" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="day-trip">Jednodnevni izlet</SelectItem>
                  <SelectItem value="multi-day">Višednevna ekskurzija</SelectItem>
                  <SelectItem value="educational">Obrazovna ekskurzija</SelectItem>
                  <SelectItem value="cultural">Kulturna ekskurzija</SelectItem>
                  <SelectItem value="sports">Sportska ekskurzija</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Grade Level */}
        <FormField
          control={form.control}
          name="gradeLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Razred</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[...Array(13)].map((_, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {i + 1}. razred
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Student Count */}
        <FormField
          control={form.control}
          name="studentCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Broj učenika</FormLabel>
              <FormControl>
                <Input type="number" placeholder="14" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 3: Chaperones, Transport */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chaperones - Multi-input */}
        <FormItem>
          <FormLabel>Pratitelji (imena)</FormLabel>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Ime i prezime pratitelja"
                value={newChaperone}
                onChange={(e) => setNewChaperone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChaperone())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addChaperone}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {chaperones.map((chap, index) => (
                <Badge key={index} variant="secondary" className="gap-1 pr-1">
                  {chap}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeChaperone(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        </FormItem>

        {/* Transport */}
        <FormField
          control={form.control}
          name="transport"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prevoz</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite prevoz" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="train">Voz</SelectItem>
                  <SelectItem value="mixed">Mješovito (Bus + Voz)</SelectItem>
                  <SelectItem value="plane">Avion</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 4: Dates and Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Trip Date */}
        <FormField
          control={form.control}
          name="tripDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Datum polaska</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "yyyy-MM-dd") : "Odaberite datum"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Return Date */}
        <FormField
          control={form.control}
          name="returnDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Datum povratka</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "yyyy-MM-dd") : "Odaberite datum"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Budget per Student */}
        <FormField
          control={form.control}
          name="budgetPerStudent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budžet (opcionalno)</FormLabel>
              <FormControl>
                <Input placeholder="npr. 500 EUR" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 5: Educational Focus */}
      <FormField
        control={form.control}
        name="educationalFocus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Obrazovni fokus</FormLabel>
            <FormControl>
              <Input 
                placeholder="kulturno nasljeđe, obrazovanje, zabava..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Row 6: Special Needs */}
      <FormField
        control={form.control}
        name="specialNeeds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trip Notes (Alergije, Posebne Potrebe)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="npr. dva studenta imaju alergije na orašaste plodove..."
                className="min-h-[80px] resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default TripPlannerForm;
