import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TripFormData {
  tripName?: string;
  departureCity?: string;
  destinationCity?: string;
  departureAddress?: string;
  destinationAddress?: string;
  schoolType?: string;
  studentCount?: string;
  teacherCount?: string;
  numberOfDays?: string;
  tripDate?: Date;
  returnDate?: Date;
  budgetPerStudent?: string;
  educationalObjectives?: string;
  tripDescription?: string;
}

interface TripPlannerFormProps {
  form: UseFormReturn<TripFormData>;
}

const TripPlannerForm = ({ form }: TripPlannerFormProps) => {
  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-semibold text-foreground">
          1. Unesite podatke za planiranje ekskurzije
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Popunite sve potrebne informacije za generiranje plana putovanja
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trip Name */}
        <FormField
          control={form.control}
          name="tripName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Naziv Ekskurzije / Izleta</FormLabel>
              <FormControl>
                <Input placeholder="npr. Ekskurzija u Budimpeštu" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* School Type */}
        <FormField
          control={form.control}
          name="schoolType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vrsta Škole (Razredi)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite vrstu škole" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="elementary-lower">Osnovna škola - niži razredi (1-4)</SelectItem>
                  <SelectItem value="elementary-upper">Osnovna škola - viši razredi (5-9)</SelectItem>
                  <SelectItem value="middle-secondary">Middle school/secondary</SelectItem>
                  <SelectItem value="high-school">Srednja škola (1-4)</SelectItem>
                  <SelectItem value="vocational">Stručna škola</SelectItem>
                  <SelectItem value="gymnasium">Gimnazija</SelectItem>
                  <SelectItem value="mixed">Mješoviti razredi</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departure City */}
        <FormField
          control={form.control}
          name="departureCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grad Polaska</FormLabel>
              <FormControl>
                <Input placeholder="npr. Sarajevo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Destination City */}
        <FormField
          control={form.control}
          name="destinationCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grad Odredišta</FormLabel>
              <FormControl>
                <Input placeholder="npr. Budapest" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departure Address */}
        <FormField
          control={form.control}
          name="departureAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresa Polaska (Škola)</FormLabel>
              <FormControl>
                <Input placeholder="Ulica i broj, poštanski broj" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Destination Address */}
        <FormField
          control={form.control}
          name="destinationAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresa Odredišta</FormLabel>
              <FormControl>
                <Input placeholder="Hotel ili početna lokacija" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Student Count */}
        <FormField
          control={form.control}
          name="studentCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Broj Učenika</FormLabel>
              <FormControl>
                <Input type="number" placeholder="30" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Teacher Count */}
        <FormField
          control={form.control}
          name="teacherCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Broj Nastavnika</FormLabel>
              <FormControl>
                <Input type="number" placeholder="3" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Number of Days */}
        <FormField
          control={form.control}
          name="numberOfDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Broj Dana</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Dani" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1 dan</SelectItem>
                  <SelectItem value="2">2 dana</SelectItem>
                  <SelectItem value="3">3 dana</SelectItem>
                  <SelectItem value="4">4 dana</SelectItem>
                  <SelectItem value="5">5 dana</SelectItem>
                  <SelectItem value="6">6 dana</SelectItem>
                  <SelectItem value="7">7 dana</SelectItem>
                </SelectContent>
              </Select>
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
              <FormLabel>Budžet po Učeniku (€)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="150" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trip Date */}
        <FormField
          control={form.control}
          name="tripDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Datum Polaska</FormLabel>
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
                    disabled={(date) => date < new Date()}
                    initialFocus
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
              <FormLabel>Datum Povratka</FormLabel>
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
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Educational Objectives */}
      <FormField
        control={form.control}
        name="educationalObjectives"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Edukativni Ciljevi</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Kulturno uzdizanje, obrazovanje, uživanje..."
                className="min-h-[80px] resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Trip Description */}
      <FormField
        control={form.control}
        name="tripDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Opis Putovanja / Napomene</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Npr. Ova ekskurzija uključuje posetu muzeju, šetnju centrom, vožnju brodom..."
                className="min-h-[100px] resize-none"
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
