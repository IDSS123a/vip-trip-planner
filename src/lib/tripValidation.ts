import { z } from "zod";

// IDSS School Configuration - All grades and groups
export const IDSS_GROUPS = {
  preschool: {
    id: "preschool",
    name: "Predškolska grupa",
    ageRange: "4-6",
    defaultStudentCount: 15,
    maxStudentsPerChaperone: 5,
    requiresSpecialTransport: true,
    allowedTripTypes: ["day-trip", "educational"],
    maxTripDays: 1,
  },
  grade1: { id: "1", name: "1. razred", ageRange: "6-7", defaultStudentCount: 20, maxStudentsPerChaperone: 8, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "educational", "cultural"], maxTripDays: 2 },
  grade2: { id: "2", name: "2. razred", ageRange: "7-8", defaultStudentCount: 20, maxStudentsPerChaperone: 8, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "educational", "cultural"], maxTripDays: 2 },
  grade3: { id: "3", name: "3. razred", ageRange: "8-9", defaultStudentCount: 20, maxStudentsPerChaperone: 10, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "educational", "cultural"], maxTripDays: 3 },
  grade4: { id: "4", name: "4. razred", ageRange: "9-10", defaultStudentCount: 20, maxStudentsPerChaperone: 10, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "multi-day", "educational", "cultural"], maxTripDays: 3 },
  grade5: { id: "5", name: "5. razred", ageRange: "10-11", defaultStudentCount: 22, maxStudentsPerChaperone: 12, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "multi-day", "educational", "cultural", "sports"], maxTripDays: 5 },
  grade6: { id: "6", name: "6. razred", ageRange: "11-12", defaultStudentCount: 22, maxStudentsPerChaperone: 12, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "multi-day", "educational", "cultural", "sports"], maxTripDays: 5 },
  grade7: { id: "7", name: "7. razred", ageRange: "12-13", defaultStudentCount: 24, maxStudentsPerChaperone: 15, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "multi-day", "educational", "cultural", "sports"], maxTripDays: 7 },
  grade8: { id: "8", name: "8. razred", ageRange: "13-14", defaultStudentCount: 24, maxStudentsPerChaperone: 15, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "multi-day", "educational", "cultural", "sports"], maxTripDays: 7 },
  grade9: { id: "9", name: "9. razred", ageRange: "14-15", defaultStudentCount: 24, maxStudentsPerChaperone: 15, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "multi-day", "educational", "cultural", "sports"], maxTripDays: 10 },
  grade10: { id: "10", name: "10. razred (I. srednja)", ageRange: "15-16", defaultStudentCount: 26, maxStudentsPerChaperone: 18, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "multi-day", "educational", "cultural", "sports"], maxTripDays: 14 },
  grade11: { id: "11", name: "11. razred (II. srednja)", ageRange: "16-17", defaultStudentCount: 26, maxStudentsPerChaperone: 18, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "multi-day", "educational", "cultural", "sports"], maxTripDays: 14 },
  grade12: { id: "12", name: "12. razred (III. srednja)", ageRange: "17-18", defaultStudentCount: 26, maxStudentsPerChaperone: 20, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "multi-day", "educational", "cultural", "sports"], maxTripDays: 14 },
  grade13: { id: "13", name: "13. razred (IV. srednja)", ageRange: "18-19", defaultStudentCount: 26, maxStudentsPerChaperone: 20, requiresSpecialTransport: false, allowedTripTypes: ["day-trip", "multi-day", "educational", "cultural", "sports"], maxTripDays: 21 },
} as const;

// Trip type configurations
export const TRIP_TYPES = {
  "day-trip": {
    id: "day-trip",
    name: "Jednodnevni izlet",
    description: "Polazak i povratak istog dana",
    minDays: 1,
    maxDays: 1,
    requiresAccommodation: false,
    recommendedMaxDistance: 200, // km
  },
  "multi-day": {
    id: "multi-day",
    name: "Višednevna ekskurzija",
    description: "Putovanje s noćenjem",
    minDays: 2,
    maxDays: 21,
    requiresAccommodation: true,
    recommendedMaxDistance: 2000,
  },
  educational: {
    id: "educational",
    name: "Obrazovna ekskurzija",
    description: "Fokus na obrazovni sadržaj (muzeji, institucije)",
    minDays: 1,
    maxDays: 7,
    requiresAccommodation: "optional",
    recommendedMaxDistance: 500,
  },
  cultural: {
    id: "cultural",
    name: "Kulturna ekskurzija",
    description: "Kulturni sadržaji, predstave, izložbe",
    minDays: 1,
    maxDays: 7,
    requiresAccommodation: "optional",
    recommendedMaxDistance: 500,
  },
  sports: {
    id: "sports",
    name: "Sportska ekskurzija",
    description: "Sportske aktivnosti, takmičenja, ski-kursevi",
    minDays: 1,
    maxDays: 14,
    requiresAccommodation: "optional",
    recommendedMaxDistance: 1000,
  },
} as const;

// Transport options
export const TRANSPORT_OPTIONS = {
  bus: {
    id: "bus",
    name: "Autobus",
    description: "Školski ili turistički autobus",
    capacityRange: { min: 20, max: 50 },
    costPerKm: 1.5, // EUR
    speedKmH: 60,
    suitableFor: ["all"],
    requiresDriverAccommodation: true,
  },
  train: {
    id: "train",
    name: "Voz",
    description: "Željeznički prijevoz",
    capacityRange: { min: 1, max: 200 },
    costPerKm: 0.1, // per person
    speedKmH: 80,
    suitableFor: ["all"],
    requiresDriverAccommodation: false,
  },
  mixed: {
    id: "mixed",
    name: "Kombinirani prijevoz",
    description: "Kombinacija autobusa, voza i/ili aviona",
    capacityRange: { min: 1, max: 200 },
    costPerKm: 1.2,
    speedKmH: 70,
    suitableFor: ["all"],
    requiresDriverAccommodation: true,
  },
  plane: {
    id: "plane",
    name: "Avion",
    description: "Zračni prijevoz za daleke destinacije",
    capacityRange: { min: 10, max: 200 },
    costPerKm: 0.5, // per person
    speedKmH: 500,
    suitableFor: ["grade7", "grade8", "grade9", "grade10", "grade11", "grade12", "grade13"],
    requiresDriverAccommodation: false,
    minAge: 12,
  },
  ship: {
    id: "ship",
    name: "Brod/Trajekt",
    description: "Pomorski prijevoz",
    capacityRange: { min: 20, max: 500 },
    costPerKm: 0.3,
    speedKmH: 25,
    suitableFor: ["all"],
    requiresDriverAccommodation: false,
  },
} as const;

// Meal options
export const MEAL_OPTIONS = {
  full_board: { id: "full_board", name: "Puni pansion", description: "Doručak, ručak, večera" },
  half_board: { id: "half_board", name: "Polupansion", description: "Doručak i večera" },
  breakfast_only: { id: "breakfast_only", name: "Samo doručak", description: "Doručak uključen" },
  self_catering: { id: "self_catering", name: "Bez obroka", description: "Učenici sami organizuju obroke" },
  packed_lunch: { id: "packed_lunch", name: "Paket obrok", description: "Pripremljeni obroci za put" },
} as const;

// Accommodation types
export const ACCOMMODATION_TYPES = {
  hotel: { id: "hotel", name: "Hotel", stars: [2, 3, 4, 5], suitableFor: ["all"] },
  hostel: { id: "hostel", name: "Hostel", stars: [1, 2, 3], suitableFor: ["grade5", "grade6", "grade7", "grade8", "grade9", "grade10", "grade11", "grade12", "grade13"] },
  youth_hostel: { id: "youth_hostel", name: "Omladinski hostel", stars: [1, 2, 3], suitableFor: ["all"] },
  apartment: { id: "apartment", name: "Apartman", stars: [2, 3, 4], suitableFor: ["all"] },
  camp: { id: "camp", name: "Kamp", stars: [1, 2, 3], suitableFor: ["grade5", "grade6", "grade7", "grade8", "grade9", "grade10", "grade11", "grade12", "grade13"] },
  mountain_hut: { id: "mountain_hut", name: "Planinska kuća", stars: [1, 2], suitableFor: ["grade3", "grade4", "grade5", "grade6", "grade7", "grade8", "grade9", "grade10", "grade11", "grade12", "grade13"] },
} as const;

// Helper for combined IDSS groups (Pravilnik Član 2)
const COMBINED_GROUPS: Record<string, { primary: keyof typeof IDSS_GROUPS; allowedTripTypes: string[]; maxTripDays: number; maxStudentsPerChaperone: number }> = {
  "5+6": { primary: "grade6", allowedTripTypes: ["day-trip","multi-day","educational","cultural","sports"], maxTripDays: 5, maxStudentsPerChaperone: 12 },
  "7+8": { primary: "grade8", allowedTripTypes: ["day-trip","multi-day","educational","cultural","sports"], maxTripDays: 7, maxStudentsPerChaperone: 15 },
};

// Helper function to calculate minimum required chaperones
export function calculateMinChaperones(gradeLevel: string, studentCount: number): number {
  if (COMBINED_GROUPS[gradeLevel]) {
    return Math.ceil(studentCount / COMBINED_GROUPS[gradeLevel].maxStudentsPerChaperone);
  }
  const gradeKey = gradeLevel === "preschool" ? "preschool" : `grade${gradeLevel}` as keyof typeof IDSS_GROUPS;
  const gradeConfig = IDSS_GROUPS[gradeKey];
  
  if (!gradeConfig) {
    // Default: 1 chaperone per 10 students
    return Math.ceil(studentCount / 10);
  }
  
  return Math.ceil(studentCount / gradeConfig.maxStudentsPerChaperone);
}

// Helper function to calculate trip duration in days
export function calculateTripDays(departureDate: Date, returnDate: Date): number {
  const diffTime = Math.abs(returnDate.getTime() - departureDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both departure and return days
}

// Helper function to validate trip type for grade
export function isTripTypeAllowedForGrade(gradeLevel: string, tripType: string): boolean {
  if (COMBINED_GROUPS[gradeLevel]) {
    return COMBINED_GROUPS[gradeLevel].allowedTripTypes.includes(tripType);
  }
  // "all" i "all+preschool" su rezervisani ISKLJUČIVO za jednodnevni izlet (Pravilnik / Uputstvo).
  if (gradeLevel === "all" || gradeLevel === "all+preschool") {
    return tripType === "day-trip";
  }
  if (gradeLevel === "mixed") return true;
  const gradeKey = gradeLevel === "preschool" ? "preschool" : `grade${gradeLevel}` as keyof typeof IDSS_GROUPS;
  const gradeConfig = IDSS_GROUPS[gradeKey];
  
  if (!gradeConfig) return true; // Allow if grade not found
  
  return gradeConfig.allowedTripTypes.includes(tripType as any);
}

// Helper to get max trip days for a grade
export function getMaxTripDays(gradeLevel: string): number {
  if (COMBINED_GROUPS[gradeLevel]) return COMBINED_GROUPS[gradeLevel].maxTripDays;
  if (gradeLevel === "all" || gradeLevel === "all+preschool") return 1;
  const gradeKey = gradeLevel === "preschool" ? "preschool" : `grade${gradeLevel}` as keyof typeof IDSS_GROUPS;
  const gradeConfig = IDSS_GROUPS[gradeKey];
  return gradeConfig?.maxTripDays || 7;
}

// Comprehensive trip validation schema
export const tripValidationSchema = z.object({
  tripName: z
    .string()
    .max(100, "Naziv putovanja može imati maksimalno 100 karaktera")
    .optional(),
  
  departureCity: z
    .string()
    .min(2, "Polazište mora imati najmanje 2 karaktera")
    .max(100, "Polazište može imati maksimalno 100 karaktera")
    .regex(/^[a-zA-ZčćžšđČĆŽŠĐäöüÄÖÜß\s\-']+$/, "Polazište može sadržavati samo slova, razmake i crtice"),
  
  destinations: z
    .array(z.string().min(2, "Destinacija mora imati najmanje 2 karaktera").max(100))
    .min(1, "Morate dodati barem jednu destinaciju")
    .max(10, "Možete dodati maksimalno 10 destinacija"),
  
  departureAddress: z
    .string()
    .max(200, "Adresa polazišta može imati maksimalno 200 karaktera")
    .optional(),
  
  tripType: z.enum(["day-trip", "multi-day", "educational", "cultural", "sports"], {
    required_error: "Odaberite tip ekskurzije",
  }),
  
  gradeLevel: z
    .string()
    .min(1, "Odaberite razred ili grupu"),
  
  studentCount: z
    .string()
    .min(1, "Unesite broj učenika")
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1;
    }, "Broj učenika mora biti najmanje 1")
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num <= 500;
    }, "Maksimalan broj učenika je 500"),
  
  chaperones: z
    .array(z.string().min(2, "Ime pratitelja mora imati najmanje 2 karaktera").max(100))
    .optional(),
  
  transport: z.enum(["bus", "train", "mixed", "plane", "ship"], {
    required_error: "Odaberite vrstu prijevoza",
  }),
  
  tripDate: z
    .date({
      required_error: "Odaberite datum polaska",
    })
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, "Datum polaska ne može biti u prošlosti")
    .refine((date) => {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 2);
      return date <= maxDate;
    }, "Datum polaska ne može biti više od 2 godine u budućnosti"),
  
  returnDate: z
    .date()
    .optional(),
  
  budgetPerStudent: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === "") return true;
      const num = parseFloat(val.replace(/[^\d.]/g, ""));
      return !isNaN(num) && num >= 0;
    }, "Budžet mora biti pozitivan broj")
    .refine((val) => {
      if (!val || val.trim() === "") return true;
      const num = parseFloat(val.replace(/[^\d.]/g, ""));
      return !isNaN(num) && num <= 10000;
    }, "Budžet po učeniku ne može biti veći od 10,000 EUR"),
  
  educationalFocus: z
    .string()
    .max(500, "Obrazovni fokus može imati maksimalno 500 karaktera")
    .optional(),

  tripPriorities: z
    .string()
    .max(2000, "Važne informacije mogu imati maksimalno 2000 karaktera")
    .optional(),
  
  specialNeeds: z
    .string()
    .max(1000, "Bilješke mogu imati maksimalno 1000 karaktera")
    .optional(),
  
  mealPlan: z.enum(["full_board", "half_board", "breakfast_only", "self_catering", "packed_lunch"]).optional(),
  
  accommodationType: z.enum(["hotel", "hostel", "youth_hostel", "apartment", "camp", "mountain_hut"]).optional(),
  
  emergencyContact: z
    .string()
    .max(200, "Kontakt za hitne slučajeve može imati maksimalno 200 karaktera")
    .optional(),
  
  insuranceIncluded: z.boolean().optional(),
  
  medicalInfo: z
    .string()
    .max(1000, "Medicinske informacije mogu imati maksimalno 1000 karaktera")
    .optional(),
}).superRefine((data, ctx) => {
  // Cross-field validation: Return date must be after or equal to departure date
  if (data.tripDate && data.returnDate) {
    if (data.returnDate < data.tripDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Datum povratka ne može biti prije datuma polaska",
        path: ["returnDate"],
      });
    }
    
    // Check if trip duration exceeds max allowed for grade
    const tripDays = calculateTripDays(data.tripDate, data.returnDate);
    const maxDays = getMaxTripDays(data.gradeLevel);
    
    if (tripDays > maxDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Za odabrani razred, maksimalno trajanje putovanja je ${maxDays} dana`,
        path: ["returnDate"],
      });
    }
  }
  
  // Validate trip type for day-trip (must have same departure and return date or no return date)
  if (data.tripType === "day-trip" && data.returnDate && data.tripDate) {
    const tripDays = calculateTripDays(data.tripDate, data.returnDate);
    if (tripDays > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Za jednodnevni izlet, datum polaska i povratka moraju biti isti",
        path: ["returnDate"],
      });
    }
  }
  
  // Validate multi-day requires return date
  if (data.tripType === "multi-day" && !data.returnDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Za višednevnu ekskurziju morate odabrati datum povratka",
      path: ["returnDate"],
    });
  }
  
  // Validate minimum chaperones
  if (data.gradeLevel && data.studentCount && data.chaperones) {
    const studentNum = parseInt(data.studentCount, 10);
    const minChaperones = calculateMinChaperones(data.gradeLevel, studentNum);
    
    if (data.chaperones.length < minChaperones) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Za ${studentNum} učenika potrebno je najmanje ${minChaperones} pratitelja`,
        path: ["chaperones"],
      });
    }
  }
  
  // Validate trip type allowed for grade
  if (data.gradeLevel && data.tripType) {
    if (!isTripTypeAllowedForGrade(data.gradeLevel, data.tripType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ovaj tip ekskurzije nije dozvoljen za odabrani razred",
        path: ["tripType"],
      });
    }
  }
  
  // Validate plane transport age restriction
  if (data.transport === "plane" && data.gradeLevel) {
    const gradeNum = parseInt(data.gradeLevel, 10);
    if (!isNaN(gradeNum) && gradeNum < 7) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Avionski prijevoz nije dozvoljen za učenike mlađe od 7. razreda",
        path: ["transport"],
      });
    }
  }
});

// Type for validated form data
export type ValidatedTripFormData = z.infer<typeof tripValidationSchema>;

// Validation error messages in Bosnian
export const validationMessages = {
  required: "Ovo polje je obavezno",
  minLength: (min: number) => `Minimalno ${min} karaktera`,
  maxLength: (max: number) => `Maksimalno ${max} karaktera`,
  invalidDate: "Neispravan datum",
  pastDate: "Datum ne može biti u prošlosti",
  invalidNumber: "Unesite ispravan broj",
  positiveNumber: "Broj mora biti pozitivan",
};
