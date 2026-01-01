import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, MapPin, Users, Clock, DollarSign, Bus, ClipboardCheck, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const tripSchema = z.object({
  tripName: z.string().min(3, "Trip name must be at least 3 characters").max(100),
  destination: z.string().min(1, "Please select a destination"),
  tripDate: z.date({ required_error: "Please select a date" }),
  returnDate: z.date().optional(),
  gradeLevel: z.string().min(1, "Please select a grade level"),
  studentCount: z.string().min(1, "Please enter estimated student count"),
  chaperoneCount: z.string().min(1, "Please enter chaperone count"),
  transportationType: z.string().min(1, "Please select transportation type"),
  budgetPerStudent: z.string().optional(),
  specialRequirements: z.string().max(500).optional(),
  objectives: z.string().min(10, "Please describe learning objectives").max(500),
});

type TripFormData = z.infer<typeof tripSchema>;

const destinations = [
  { id: "museum-history", name: "Natural History Museum", category: "Science" },
  { id: "space-center", name: "Space & Aviation Center", category: "STEM" },
  { id: "historical-village", name: "Historical Village", category: "History" },
  { id: "botanical-gardens", name: "Botanical Gardens", category: "Nature" },
  { id: "zoo", name: "City Zoo", category: "Nature" },
  { id: "art-museum", name: "Art Museum", category: "Arts" },
  { id: "aquarium", name: "Marine Aquarium", category: "Science" },
  { id: "custom", name: "Custom Destination", category: "Other" },
];

const PlanTrip = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      tripName: "",
      destination: "",
      gradeLevel: "",
      studentCount: "",
      chaperoneCount: "",
      transportationType: "",
      budgetPerStudent: "",
      specialRequirements: "",
      objectives: "",
    },
  });

  const onSubmit = (data: TripFormData) => {
    console.log(data);
    toast({
      title: "Trip Created Successfully!",
      description: "Your field trip has been saved. You can now manage it from My Trips.",
    });
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const steps = [
    { number: 1, title: "Basic Info", icon: MapPin },
    { number: 2, title: "Logistics", icon: Bus },
    { number: 3, title: "Details", icon: ClipboardCheck },
    { number: 4, title: "Review", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12">
        <div className="container max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Plan Your <span className="text-primary">Field Trip</span>
            </h1>
            <p className="text-muted-foreground">
              Complete the form below to create your educational adventure.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      currentStep >= step.number
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-1 w-16 md:w-24 lg:w-32 mx-2",
                        currentStep > step.number ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            <Progress value={(currentStep / 4) * 100} className="h-2" />
          </div>

          {/* Form */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">{steps[currentStep - 1].title}</CardTitle>
              <CardDescription>
                {currentStep === 1 && "Tell us about your trip destination and when you'd like to go."}
                {currentStep === 2 && "Set up transportation and group details."}
                {currentStep === 3 && "Add learning objectives and special requirements."}
                {currentStep === 4 && "Review your trip details before submitting."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Step 1: Basic Info */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="tripName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trip Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 5th Grade Museum Adventure" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="destination"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destination</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a destination" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {destinations.map((dest) => (
                                  <SelectItem key={dest.id} value={dest.id}>
                                    <div className="flex items-center gap-2">
                                      {dest.name}
                                      <Badge variant="secondary" className="text-xs">
                                        {dest.category}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="tripDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Trip Date</FormLabel>
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
                                      {field.value ? format(field.value, "PPP") : "Pick a date"}
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

                        <FormField
                          control={form.control}
                          name="gradeLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grade Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select grade" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="k">Kindergarten</SelectItem>
                                  <SelectItem value="1-2">1st - 2nd Grade</SelectItem>
                                  <SelectItem value="3-5">3rd - 5th Grade</SelectItem>
                                  <SelectItem value="6-8">6th - 8th Grade</SelectItem>
                                  <SelectItem value="9-12">9th - 12th Grade</SelectItem>
                                  <SelectItem value="mixed">Mixed Grades</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Logistics */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="studentCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Students</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input type="number" placeholder="25" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="chaperoneCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Chaperones</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input type="number" placeholder="5" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Recommended ratio: 1 chaperone per 5 students
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="transportationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transportation</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select transportation type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="school-bus">School Bus</SelectItem>
                                <SelectItem value="charter-bus">Charter Bus</SelectItem>
                                <SelectItem value="public-transit">Public Transit</SelectItem>
                                <SelectItem value="walking">Walking Distance</SelectItem>
                                <SelectItem value="parent-drivers">Parent Drivers</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="budgetPerStudent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Per Student (Optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="number" placeholder="25.00" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Include admission, transportation, and meals
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 3: Details */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="objectives"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Learning Objectives</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the educational goals and curriculum connections for this trip..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              What do you want students to learn or experience?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="specialRequirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Special Requirements (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any accessibility needs, dietary restrictions, or special accommodations..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 4: Review */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div className="rounded-lg border border-border p-6 space-y-4">
                        <h3 className="font-semibold text-lg text-foreground">Trip Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Trip Name</p>
                            <p className="font-medium text-foreground">{form.watch("tripName") || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Destination</p>
                            <p className="font-medium text-foreground">
                              {destinations.find(d => d.id === form.watch("destination"))?.name || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="font-medium text-foreground">
                              {form.watch("tripDate") ? format(form.watch("tripDate"), "PPP") : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Grade Level</p>
                            <p className="font-medium text-foreground">{form.watch("gradeLevel") || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Students</p>
                            <p className="font-medium text-foreground">{form.watch("studentCount") || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Chaperones</p>
                            <p className="font-medium text-foreground">{form.watch("chaperoneCount") || "—"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Learning Objectives</p>
                          <p className="font-medium text-foreground">{form.watch("objectives") || "—"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    {currentStep < 4 ? (
                      <Button type="button" onClick={nextStep}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="submit">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Create Trip
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlanTrip;
