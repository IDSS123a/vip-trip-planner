import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Plus, X, AlertTriangle, Info, Users, MapPin, Hotel } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { 
  IDSS_GROUPS, 
  TRIP_TYPES, 
  TRANSPORT_OPTIONS,
  MEAL_OPTIONS,
  ACCOMMODATION_TYPES,
  calculateMinChaperones,
  calculateTripDays,
  isTripTypeAllowedForGrade,
  getMaxTripDays,
  type ValidatedTripFormData 
} from "@/lib/tripValidation";

interface TripPlannerFormProps {
  form: UseFormReturn<ValidatedTripFormData>;
}

const TripPlannerForm = ({ form }: TripPlannerFormProps) => {
  const [newDestination, setNewDestination] = useState("");
  const [newChaperone, setNewChaperone] = useState("");

  const destinations = form.watch("destinations") || [];
  const chaperones = form.watch("chaperones") || [];
  const gradeLevel = form.watch("gradeLevel");
  const studentCount = form.watch("studentCount");
  const tripType = form.watch("tripType");
  const tripDate = form.watch("tripDate");
  const returnDate = form.watch("returnDate");
  const transport = form.watch("transport");

  // Calculate validation info
  const validationInfo = useMemo(() => {
    const info: {
      minChaperones: number;
      maxTripDays: number;
      tripDays: number | null;
      warnings: string[];
      allowedTripTypes: string[];
    } = {
      minChaperones: 1,
      maxTripDays: 7,
      tripDays: null,
      warnings: [],
      allowedTripTypes: Object.keys(TRIP_TYPES),
    };

    if (gradeLevel && studentCount) {
      const studentNum = parseInt(studentCount, 10);
      if (!isNaN(studentNum)) {
        info.minChaperones = calculateMinChaperones(gradeLevel, studentNum);
        info.maxTripDays = getMaxTripDays(gradeLevel);
        
        // Get allowed trip types for grade
        if (gradeLevel === "5+6" || gradeLevel === "7+8") {
          info.allowedTripTypes = ["day-trip","multi-day","educational","cultural","sports"];
        } else {
          const gradeKey = gradeLevel === "preschool" ? "preschool" : `grade${gradeLevel}` as keyof typeof IDSS_GROUPS;
          const gradeConfig = IDSS_GROUPS[gradeKey];
          if (gradeConfig) {
            info.allowedTripTypes = [...gradeConfig.allowedTripTypes];
          }
        }
      }
    }

    if (tripDate && returnDate) {
      info.tripDays = calculateTripDays(tripDate, returnDate);
      
      if (info.tripDays > info.maxTripDays) {
        info.warnings.push(`Trajanje putovanja (${info.tripDays} dana) prelazi maksimum za ovaj razred (${info.maxTripDays} dana)`);
      }
    }

    if (tripType === "day-trip" && info.tripDays && info.tripDays > 1) {
      info.warnings.push("Za jednodnevni izlet, datum polaska i povratka moraju biti isti");
    }

    if (tripType === "multi-day" && !returnDate && tripDate) {
      info.warnings.push("Za višednevnu ekskurziju morate odabrati datum povratka");
    }

    if (chaperones.length > 0 && chaperones.length < info.minChaperones) {
      info.warnings.push(`Potrebno je najmanje ${info.minChaperones} pratitelja za ${studentCount} učenika`);
    }

    if (gradeLevel && tripType && !isTripTypeAllowedForGrade(gradeLevel, tripType)) {
      info.warnings.push("Odabrani tip ekskurzije nije dozvoljen za ovaj razred");
    }

    if (transport === "plane" && gradeLevel) {
      const gradeNum = parseInt(gradeLevel, 10);
      if (!isNaN(gradeNum) && gradeNum < 7) {
        info.warnings.push("Avionski prijevoz nije dozvoljen za učenike mlađe od 7. razreda");
      }
    }

    return info;
  }, [gradeLevel, studentCount, tripType, tripDate, returnDate, chaperones.length, transport]);

  // Pre-popuni studentCount SAMO jednom kad se odabere razred i polje je prazno.
  // NAMJERNO ne stavljamo studentCount u dependency array — inače bi se effect
  // okidao na svaki tipkani znak i ponovo upisivao default vrijednost preko korisnikovog unosa.
  useEffect(() => {
    if (!gradeLevel) return;
    // "Cijela škola" i "Cijela škola + Predškolska grupa" su ISKLJUČIVO za jednodnevni izlet —
    // automatski namjesti tripType da korisnik ne može pogriješiti.
    if (gradeLevel === "all" || gradeLevel === "all+preschool") {
      const currentType = form.getValues("tripType");
      if (currentType !== "day-trip") {
        form.setValue("tripType", "day-trip", { shouldValidate: true });
      }
    }
    const current = form.getValues("studentCount");
    if (current && current.trim() !== "") return; // korisnik je već nešto upisao — ne diraj
    const combined: Record<string, number> = {
      "5+6": 44,
      "7+8": 48,
      "all": 250,            // procjena cijele škole IDSS
      "all+preschool": 280,  // cijela škola + predškolska grupa
    };
    if (combined[gradeLevel]) {
      form.setValue("studentCount", String(combined[gradeLevel]), { shouldValidate: false });
      return;
    }
    const gradeKey = gradeLevel === "preschool" ? "preschool" : `grade${gradeLevel}` as keyof typeof IDSS_GROUPS;
    const gradeConfig = IDSS_GROUPS[gradeKey];
    if (gradeConfig) {
      form.setValue("studentCount", String(gradeConfig.defaultStudentCount), { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeLevel]);

  const addDestination = () => {
    const trimmed = newDestination.trim();
    if (trimmed && trimmed.length >= 2 && trimmed.length <= 100) {
      const current = form.getValues("destinations") || [];
      if (current.length < 10) {
        form.setValue("destinations", [...current, trimmed]);
        setNewDestination("");
        form.trigger("destinations");
      }
    }
  };

  const removeDestination = (index: number) => {
    const current = form.getValues("destinations") || [];
    form.setValue("destinations", current.filter((_, i) => i !== index));
    form.trigger("destinations");
  };

  // Redoslijed destinacija je zaključan: zadnja unesena destinacija = konačna (s noćenjima).
  // Ako korisnik želi drugačiji redoslijed, mora ukloniti destinaciju i ponovo je dodati na pravom mjestu.

  const addChaperone = () => {
    const trimmed = newChaperone.trim();
    if (trimmed && trimmed.length >= 2 && trimmed.length <= 100) {
      const current = form.getValues("chaperones") || [];
      form.setValue("chaperones", [...current, trimmed]);
      setNewChaperone("");
    }
  };

  const removeChaperone = (index: number) => {
    const current = form.getValues("chaperones") || [];
    form.setValue("chaperones", current.filter((_, i) => i !== index));
  };

  // Grade options for IDSS
  const gradeOptions = [
    { value: "preschool", label: "Predškolska grupa (4-6 god.)" },
    { value: "1", label: "1. razred (Grundschule)" },
    { value: "2", label: "2. razred (Grundschule)" },
    { value: "3", label: "3. razred (Grundschule)" },
    { value: "4", label: "4. razred (Grundschule)" },
    { value: "5", label: "5. razred (Orientierungsstufe)" },
    { value: "6", label: "6. razred (Orientierungsstufe)" },
    { value: "7", label: "7. razred (Sekundarstufe I)" },
    { value: "8", label: "8. razred (Sekundarstufe I)" },
    { value: "9", label: "9. razred (Sekundarstufe I)" },
    { value: "10", label: "10. razred (Sekundarstufe II)" },
    { value: "11", label: "11. razred (Sekundarstufe II)" },
    { value: "12", label: "12. razred (Sekundarstufe II)" },
    { value: "13", label: "13. razred (Abitur)" },
    { value: "5+6", label: "Spojena grupa: 5. + 6. razred (Pravilnik)" },
    { value: "7+8", label: "Spojena grupa: 7. + 8. razred (Pravilnik)" },
    { value: "mixed", label: "Mješovita grupa (više razreda)" },
    { value: "all", label: "Cijela škola (samo jednodnevni izlet)" },
    { value: "all+preschool", label: "Cijela škola + Predškolska grupa (samo jednodnevni izlet)" },
  ];

  // Predefinisane tačke okupljanja u Sarajevu
  const meetingPointPresets = [
    { value: "IDSS, Buka 13, 71 000 Sarajevo, Bosna i Hercegovina", label: "IDSS — Buka 13 (škola)" },
    { value: "Zemaljski muzej BiH, Zmaja od Bosne 3, 71 000 Sarajevo", label: "Zemaljski muzej BiH" },
    { value: "Vijećnica, Obala Kulina bana 1, 71 000 Sarajevo", label: "Vijećnica" },
    { value: "Glavna autobuska stanica, Put života 8, 71 000 Sarajevo", label: "Autobuska stanica Sarajevo" },
    { value: "Željeznička stanica Sarajevo, Put života 2, 71 000 Sarajevo", label: "Željeznička stanica Sarajevo" },
    { value: "BBI Centar, Trg djece Sarajeva 1, 71 000 Sarajevo", label: "BBI Centar" },
  ];

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

      {/* Validation Warnings */}
      {validationInfo.warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-1">Provjerite sljedeće prije generiranja plana:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validationInfo.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Trip Name (Optional) */}
      <FormField
        control={form.control}
        name="tripName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Naziv putovanja (opcionalno)</FormLabel>
            <FormControl>
              <Input 
                placeholder="npr. Maturalna ekskurzija Beč 2025" 
                maxLength={100}
                {...field} 
              />
            </FormControl>
            <FormDescription>
              Ako ne unesete naziv, automatski će se generirati iz rute
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Row 1: Departure City and Destinations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departure City */}
        <FormField
          control={form.control}
          name="departureCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Polazište *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Sarajevo" 
                  maxLength={100}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Grad polaska (npr. Sarajevo)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Destinations - Multi-stop */}
        <FormField
          control={form.control}
          name="destinations"
          render={() => (
            <FormItem>
              <FormLabel>Ruta Putovanja (Destinacije) *</FormLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Unesite destinaciju"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDestination())}
                    maxLength={100}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={addDestination}
                    disabled={destinations.length >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-col gap-2 min-h-[32px]">
                  {destinations.map((dest, index) => {
                    const isFinal = index === destinations.length - 1;
                    return (
                      <Badge
                        key={index}
                        variant={isFinal ? "default" : "secondary"}
                        className={cn(
                          "gap-2 pr-1 items-center justify-between w-full py-2 px-3",
                          isFinal && "ring-2 ring-primary/40"
                        )}
                      >
                        <span className="flex items-center gap-2 text-left">
                          {isFinal ? (
                            <Hotel className="h-3.5 w-3.5" aria-label="Konačna destinacija" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5" aria-label="Međustanica" />
                          )}
                          <span className="text-xs opacity-70">{index + 1}.</span>
                          <span className="font-medium">{dest}</span>
                          {isFinal ? (
                            <span className="text-[10px] uppercase tracking-wide opacity-90 ml-1">
                              Konačna · noćenja
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-wide opacity-70 ml-1">
                              Međustanica · bez noćenja
                            </span>
                          )}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 hover:bg-transparent"
                          onClick={() => removeDestination(index)}
                          aria-label={`Ukloni ${dest}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
                <FormDescription>
                  Dodajte destinacije TAČNO redoslijedom posjete. <strong>Zadnja unesena destinacija</strong> automatski postaje konačna (sva noćenja se planiraju tu). Redoslijed je zaključan — za izmjenu uklonite i ponovo dodajte. (maks. 10)
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Tačka okupljanja (adresa polazišta) */}
      <FormField
        control={form.control}
        name="departureAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tačka okupljanja (adresa polazišta) *</FormLabel>
            <div className="space-y-2">
              <Select
                onValueChange={(v) => field.onChange(v)}
                value={meetingPointPresets.find(p => p.value === field.value)?.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite predefinisanu tačku okupljanja" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {meetingPointPresets.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormControl>
                <Input
                  placeholder="ili unesite drugu adresu okupljanja"
                  maxLength={200}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
            </div>
            <FormDescription>
              Tačno mjesto okupljanja učenika prije polaska. Default: ispred IDSS škole, Buka 13.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Row 2: Grade Level, Student Count, Trip Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Grade Level */}
        <FormField
          control={form.control}
          name="gradeLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Razred/Grupa *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite razred" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {gradeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
              <FormLabel>Broj učenika *</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  placeholder="npr. 22"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    // Dozvoli prazan unos i čisto numeričke vrijednosti, bez agresivne validacije dok korisnik tipka.
                    const v = e.target.value;
                    if (v === "" || /^\d+$/.test(v)) {
                      field.onChange(v);
                    }
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>
                {studentCount && parseInt(studentCount, 10) > 0
                  ? `Min. pratitelja za ${studentCount} učenika: ${validationInfo.minChaperones}`
                  : "Unesite broj učenika između 1 i 500"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Trip Type */}
        <FormField
          control={form.control}
          name="tripType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tip ekskurzije *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite tip" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TRIP_TYPES).map((type) => {
                    const isAllowed = validationInfo.allowedTripTypes.includes(type.id);
                    return (
                      <SelectItem 
                        key={type.id} 
                        value={type.id}
                        disabled={!isAllowed}
                      >
                        <div className="flex flex-col">
                          <span>{type.name}</span>
                          {!isAllowed && (
                            <span className="text-xs text-muted-foreground">(nije dozvoljeno za ovaj razred)</span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 3: Dates and Transport */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Trip Date */}
        <FormField
          control={form.control}
          name="tripDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Datum polaska *</FormLabel>
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
                      {field.value ? format(field.value, "dd.MM.yyyy") : "Odaberite datum"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date);
                      // Auto-set return date for day trips
                      if (tripType === "day-trip" && date) {
                        form.setValue("returnDate", date);
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const maxDate = new Date();
                      maxDate.setFullYear(maxDate.getFullYear() + 2);
                      return date < today || date > maxDate;
                    }}
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
              <FormLabel>
                Datum povratka {tripType === "multi-day" ? "*" : "(opcionalno)"}
              </FormLabel>
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
                      {field.value ? format(field.value, "dd.MM.yyyy") : "Odaberite datum"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      const minDate = tripDate || new Date();
                      minDate.setHours(0, 0, 0, 0);
                      const maxDate = new Date(minDate);
                      maxDate.setDate(maxDate.getDate() + validationInfo.maxTripDays - 1);
                      return date < minDate || date > maxDate;
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {validationInfo.tripDays && (
                <FormDescription>
                  Trajanje: {validationInfo.tripDays} {validationInfo.tripDays === 1 ? "dan" : validationInfo.tripDays < 5 ? "dana" : "dana"}
                  {" "}(maks. {validationInfo.maxTripDays})
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Transport */}
        <FormField
          control={form.control}
          name="transport"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vrsta prijevoza *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite prijevoz" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TRANSPORT_OPTIONS).map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        <span>{option.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 4: Chaperones and Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chaperones */}
        <FormField
          control={form.control}
          name="chaperones"
          render={() => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pratitelji (min. {validationInfo.minChaperones})
              </FormLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ime i prezime pratitelja"
                    value={newChaperone}
                    onChange={(e) => setNewChaperone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChaperone())}
                    maxLength={100}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addChaperone}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {chaperones.map((chap, index) => (
                    <Badge 
                      key={index} 
                      variant={index < validationInfo.minChaperones ? "default" : "secondary"} 
                      className="gap-1 pr-1"
                    >
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
                {chaperones.length < validationInfo.minChaperones && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Potrebno još {validationInfo.minChaperones - chaperones.length} pratitelja
                  </p>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Budget */}
        <FormField
          control={form.control}
          name="budgetPerStudent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budžet po učeniku (EUR)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min={0}
                  max={10000}
                  step={10}
                  placeholder="npr. 500" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Opcionalno - za optimizaciju plana prema budžetu
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 5: Meal Plan and Accommodation (for multi-day) */}
      {(tripType === "multi-day" || (validationInfo.tripDays && validationInfo.tripDays > 1)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="mealPlan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan obroka</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite plan obroka" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(MEAL_OPTIONS).map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex flex-col">
                          <span>{option.name}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accommodationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vrsta smještaja</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite smještaj" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(ACCOMMODATION_TYPES).map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Row 6: Educational Focus */}
      <FormField
        control={form.control}
        name="tripPriorities"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Važne informacije za planiranje puta (USTAVAN input)</FormLabel>
            <FormControl>
              <Textarea
                placeholder={
                  "Unesite konkretne zahtjeve koji MORAJU biti ispoštovani u planu. Primjeri:\n" +
                  "• Jednodnevni izlet — polazak u 07:00 (dogovoreno s prevoznikom), planirani povratak do 19:00\n" +
                  "• BEZ ZADRŽAVANJA na međustanicama — što prije stići na odredišnu destinaciju\n" +
                  "• Obavezna pauza za ručak između 12:30 i 13:30\n" +
                  "• Povratak najkasnije do 21:00 zbog roditeljskog sastanka"
                }
                className="min-h-[120px] resize-y"
                maxLength={2000}
                {...field}
              />
            </FormControl>
            <FormDescription>
              Sve što unesete ovdje postaje <strong>obavezujući (ustavan) input</strong> za AI generator plana —
              vrijeme polaska/povratka, obavezne ili zabranjene pauze, prioriteti rute, itd.
              Bit će doslovno preneseno u sva 3 generirana plana.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="educationalFocus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Obrazovni fokus</FormLabel>
            <FormControl>
              <Input 
                placeholder="npr. njemačka kultura, historija, umjetnost, STEM..."
                maxLength={500}
                {...field}
              />
            </FormControl>
            <FormDescription>
              Navedite obrazovne ciljeve ili teme koje želite pokriti
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Row 7: Special Needs and Medical Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="specialNeeds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Posebne potrebe i napomene</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="npr. alergije, invalidska kolica, posebna dijeta..."
                  className="min-h-[80px] resize-none"
                  maxLength={1000}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="medicalInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medicinske informacije</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="npr. lijekovi, kronične bolesti, hitni kontakti..."
                  className="min-h-[80px] resize-none"
                  maxLength={1000}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Emergency Contact */}
      <FormField
        control={form.control}
        name="emergencyContact"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kontakt za hitne slučajeve</FormLabel>
            <FormControl>
              <Input 
                placeholder="Ime, telefon, odnos (npr. Dr. Müller, +387 33 560 520, Direktor)"
                maxLength={200}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Summary Card */}
      {(destinations.length > 0 || gradeLevel || tripDate) && (
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {gradeLevel && (
                <div>
                  <span className="text-muted-foreground">Razred:</span>{" "}
                  <strong>{gradeOptions.find(g => g.value === gradeLevel)?.label.split(" ")[0]}</strong>
                </div>
              )}
              {studentCount && (
                <div>
                  <span className="text-muted-foreground">Učenika:</span>{" "}
                  <strong>{studentCount}</strong>
                </div>
              )}
              {chaperones.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Pratitelja:</span>{" "}
                  <strong>{chaperones.length}/{validationInfo.minChaperones}</strong>
                </div>
              )}
              {validationInfo.tripDays && (
                <div>
                  <span className="text-muted-foreground">Trajanje:</span>{" "}
                  <strong>{validationInfo.tripDays} dana</strong>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TripPlannerForm;
