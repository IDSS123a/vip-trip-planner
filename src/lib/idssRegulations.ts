/**
 * IDSS PRAVILNIK - "USTAV"
 * Konstante zasnovane na:
 *  - Pravilnik o planiranju i organizaciji učeničkih ekskurzija (09.03.2026)
 *  - Uputstvo o organizaciji ekskurzija (09.03.2026)
 *  - Formular Saglasnosti roditelja (Prilog 1)
 *
 * IZMJENE OVDJE = IZMJENE PRAVILNIKA. Mijenjaj samo na osnovu nove odluke Školskog odbora.
 */

export const IDSS_SCHOOL = {
  legalName: "P.U. Internationale Deutsche Schule Sarajevo - Međunarodna Njemačka Škola Sarajevo",
  shortName: "Internationale Deutsche Schule Sarajevo",
  acronym: "IDSS",
  address: "Buka 13",
  city: "71 000 Sarajevo",
  country: "Bosna i Hercegovina",
  fullAddress: "Buka 13, 71 000 Sarajevo, Bosna i Hercegovina",
  phone: "+387 33 560 520",
  mobile: "+387 60 345 1275",
  email: "info@idss.ba",
  website: "www.idss.edu.ba",
  websiteUrl: "https://www.idss.edu.ba",
  director: "Davor Mulalić",
  // Bankovni podaci
  bank: {
    name: "SPARKASSE BANK d.d., Sarajevo",
    account: "199 499 002 180 9884",
    iban: "BA39 199 499 002 180 9884",
    swift: "ABSBBA22",
  },
  registration: {
    idNumber: "4202220420007",
    regNumber: "580342",
  },
} as const;

/**
 * Klasifikacija ekskurzija prema Pravilniku, Član 1.
 */
export const EXCURSION_CATEGORIES = {
  oneDay: {
    id: "oneDay",
    label: "Jednodnevna ekskurzija",
    description: "Jednodnevni izleti sa obrazovnim, kulturnim ili sportsko-rekreativnim sadržajima u okviru lokalnog ili šireg područja BiH. Ne zahtijevaju noćenje.",
    nights: 0,
    days: 1,
  },
  domesticMultiDay: {
    id: "domesticMultiDay",
    label: "Višednevna domaća ekskurzija",
    description: "Traje od 2 do 6 dana (do 5 noći) i uključuje jedno ili više noćenja na teritoriji BiH.",
    nightsMax: 5,
    daysMax: 6,
  },
  international: {
    id: "international",
    label: "Međunarodna ekskurzija",
    description: "Putovanja van granica BiH uz dodatne sigurnosne, dokumentacione i administrativne mjere.",
    daysMax: 6,
  },
} as const;

/**
 * Plan ekskurzija po razredima - Pravilnik Član 2 + Uputstvo 3A.
 * Ovo je obavezujući standard.
 */
export interface GradePlan {
  gradeId: string;
  gradeLabel: string;
  groupKey: string; // za rotaciju i historijat
  groupLabel: string;
  destinations: string[]; // primarne dozvoljene destinacije (uključujući rotaciju)
  primaryDestination: string;
  rotationDestinations: string[]; // alternative u rotaciji
  nights: number;
  days: number;
  category: keyof typeof EXCURSION_CATEGORIES;
  categoryLabel: string;
  groupingNote: string;
}

export const IDSS_GRADE_PLANS: Record<string, GradePlan> = {
  "4": {
    gradeId: "4",
    gradeLabel: "4. razred",
    groupKey: "4",
    groupLabel: "4. razred",
    destinations: ["Konjic", "Ajdinovići"],
    primaryDestination: "Konjic",
    rotationDestinations: ["Ajdinovići"],
    nights: 1,
    days: 2,
    category: "oneDay",
    categoryLabel: "Lokalna",
    groupingNote: "Samostalna grupa. Ajdinovići samo uz odluku Školskog odbora.",
  },
  "5": {
    gradeId: "5",
    gradeLabel: "5. razred",
    groupKey: "5+6",
    groupLabel: "5. + 6. razred (spojena grupa)",
    destinations: ["Mostar", "Blagaj", "Trebinje"],
    primaryDestination: "Mostar",
    rotationDestinations: ["Blagaj", "Trebinje"],
    nights: 2,
    days: 3,
    category: "domesticMultiDay",
    categoryLabel: "Lokalna / regionalna",
    groupingNote: "Spaja se sa 6. razredom. Obavezna 2-godišnja rotacija (Mostar ↔ Blagaj/Trebinje).",
  },
  "6": {
    gradeId: "6",
    gradeLabel: "6. razred",
    groupKey: "5+6",
    groupLabel: "5. + 6. razred (spojena grupa)",
    destinations: ["Mostar", "Blagaj", "Trebinje"],
    primaryDestination: "Mostar",
    rotationDestinations: ["Blagaj", "Trebinje"],
    nights: 2,
    days: 3,
    category: "domesticMultiDay",
    categoryLabel: "Lokalna / regionalna",
    groupingNote: "Spaja se sa 5. razredom. Obavezna 2-godišnja rotacija (Mostar ↔ Blagaj/Trebinje).",
  },
  "7": {
    gradeId: "7",
    gradeLabel: "7. razred",
    groupKey: "7+8",
    groupLabel: "7. + 8. razred (spojena grupa)",
    destinations: ["Zagreb", "Dubrovnik"],
    primaryDestination: "Zagreb",
    rotationDestinations: ["Dubrovnik"],
    nights: 4,
    days: 5,
    category: "international",
    categoryLabel: "Međunarodna",
    groupingNote: "Spaja se sa 8. razredom. Obavezna 2-godišnja rotacija (Zagreb ↔ Dubrovnik).",
  },
  "8": {
    gradeId: "8",
    gradeLabel: "8. razred",
    groupKey: "7+8",
    groupLabel: "7. + 8. razred (spojena grupa)",
    destinations: ["Zagreb", "Dubrovnik"],
    primaryDestination: "Zagreb",
    rotationDestinations: ["Dubrovnik"],
    nights: 4,
    days: 5,
    category: "international",
    categoryLabel: "Međunarodna",
    groupingNote: "Spaja se sa 7. razredom. Obavezna 2-godišnja rotacija (Zagreb ↔ Dubrovnik).",
  },
  "9": {
    gradeId: "9",
    gradeLabel: "9. razred",
    groupKey: "9",
    groupLabel: "9. razred",
    destinations: ["München"],
    primaryDestination: "München",
    rotationDestinations: [],
    nights: 5,
    days: 6,
    category: "international",
    categoryLabel: "Međunarodna",
    groupingNote: "Samostalna grupa. Inostranstvo (Pravilnik), Uputstvo navodi München.",
  },
};

export const getGradePlan = (gradeLevel?: string): GradePlan | null => {
  if (!gradeLevel) return null;
  return IDSS_GRADE_PLANS[gradeLevel] ?? null;
};

/**
 * Pravilo rotacije - Pravilnik Glava II, Član 4 + Uputstvo 3B.
 * Vraća true ako bi data destinacija prekršila rotaciju.
 */
export const violatesRotation = (
  gradeLevel: string,
  proposedDestinations: string[],
  previousYearDestinations: string[]
): { violates: boolean; conflictDestinations: string[]; message: string } => {
  const plan = getGradePlan(gradeLevel);
  if (!plan || plan.rotationDestinations.length === 0) {
    return { violates: false, conflictDestinations: [], message: "" };
  }

  const prevSet = new Set(previousYearDestinations.map((d) => d.toLowerCase().trim()));
  const conflicts = proposedDestinations.filter((d) => prevSet.has(d.toLowerCase().trim()));

  if (conflicts.length === 0) {
    return { violates: false, conflictDestinations: [], message: "" };
  }

  return {
    violates: true,
    conflictDestinations: conflicts,
    message: `Pravilo rotacije (Pravilnik Glava II, Član 4): grupa "${plan.groupLabel}" je prošle godine bila u: ${conflicts.join(", ")}. Mora se ići na alternativnu lokaciju iz odobrenog ciklusa.`,
  };
};

/**
 * Provjera da li su predložene destinacije usklađene sa Pravilnikom.
 */
export const checkDestinationCompliance = (
  gradeLevel: string,
  proposedDestinations: string[]
): { compliant: boolean; outsideRegulation: string[]; message: string } => {
  const plan = getGradePlan(gradeLevel);
  if (!plan) {
    return { compliant: true, outsideRegulation: [], message: "" };
  }
  const allowed = new Set(plan.destinations.map((d) => d.toLowerCase()));
  const outside = proposedDestinations.filter((d) => {
    const lower = d.toLowerCase();
    return !Array.from(allowed).some((a) => lower.includes(a) || a.includes(lower));
  });

  if (outside.length === 0) {
    return { compliant: true, outsideRegulation: [], message: "" };
  }

  return {
    compliant: false,
    outsideRegulation: outside,
    message: `Sljedeće destinacije nisu u Pravilniku za ${plan.gradeLabel}: ${outside.join(", ")}. Pravilnik propisuje: ${plan.destinations.join(", ")}.`,
  };
};

/**
 * Dnevni raspored za višednevne ekskurzije - Uputstvo 5.1.
 */
export const IDSS_DAILY_SCHEDULE = [
  { time: "07:00", activity: "Buđenje" },
  { time: "07:00–08:00", activity: "Lična higijena i sređivanje soba" },
  { time: "08:00–09:00", activity: "Doručak" },
  { time: "09:00–13:00", activity: "Jutarnje aktivnosti (obrazovne i sportske)" },
  { time: "13:00–14:00", activity: "Ručak" },
  { time: "14:00–18:00", activity: "Popodnevne aktivnosti (obilazak, radionice)" },
  { time: "18:00–19:00", activity: "Večera" },
  { time: "19:00–21:30", activity: "Večernje aktivnosti (kultura, zabava, razgovori)" },
  { time: "21:30–22:00", activity: "Priprema za spavanje" },
  { time: "22:00", activity: "Obavezno gašenje svjetla i mir u sobama" },
] as const;

/**
 * Pravila ponašanja u smještaju - Uputstvo 5.2.
 */
export const IDSS_ACCOMMODATION_RULES = [
  "Nakon 22:00 strogo zabranjeno napuštanje soba.",
  "Održavanje reda i čistoće u sobama je obavezno.",
  "Zabranjeno je glasno puštanje muzike ili stvaranje buke.",
  "Zabranjen unos alkohola, cigareta i drugih sredstava ovisnosti.",
  "Zabranjeni opasni predmeti (noževi, upaljači) i energetska pića.",
  "Vrijedne predmete (nakit, skupi uređaji) ne donositi - škola ne odgovara.",
] as const;

/**
 * Pravila u prijevozu - Pravilnik Član 15.
 */
export const IDSS_TRANSPORT_RULES = [
  "Isključivo licencirani autobus s ispravnim sigurnosnim pojasevima na svim sjedištima.",
  "Klimatizacija obavezna.",
  "Sigurnosni pojas vezan tokom cijele vožnje.",
  "Zabranjeno ustajanje, hodanje i konzumacija hrane/pića tokom vožnje (osim odobrenih pauza).",
  "Pauze najmanje svakih 2 sata vožnje.",
  "Lista putnika i kontakt vozača kod razrednika.",
] as const;

/**
 * Pravila plaćanja - Uputstvo 4.
 */
export const IDSS_PAYMENT_RULES = {
  oneTimeOnly: true,
  installmentsAllowed: false,
  minDaysBeforeDeparture: 14,
  rules: [
    "Plaćanje isključivo jednokratno i u cijelosti.",
    "Plaćanje u ratama NIJE PRIHVATLJIVO.",
    "Uplata najkasnije 14 dana prije polaska.",
    "Neizvršavanje finansijskih obaveza isključuje učenika sa liste.",
    "Povrat u slučaju otkazivanja samo u predviđenom roku, umanjen za stvarne nenadoknadive troškove.",
  ],
  bankInstructions: `Račun: ${IDSS_SCHOOL.bank.account} | IBAN: ${IDSS_SCHOOL.bank.iban} | SWIFT: ${IDSS_SCHOOL.bank.swift} | Banka: ${IDSS_SCHOOL.bank.name}`,
} as const;

/**
 * Komunikacijski protokol - Uputstvo 11.
 */
export const IDSS_COMMUNICATION_PROTOCOL = {
  parentChannel: "Viber grupa razreda",
  parentContactWindow: "19:00 – 20:00 (svaki dan tokom ekskurzije)",
  internalChannel: "Viber grupa nastavnika",
  morningBriefing: "07:30",
  rules: [
    "Sva obavještenja i dnevni izvještaji isključivo putem Viber grupa.",
    "Roditelji kontaktiraju razrednika u terminu 19:00–20:00.",
    "Hitni slučajevi: jasan protokol za brzu reakciju i komunikaciju.",
  ],
} as const;

/**
 * Termin održavanja ekskurzija - Pravilnik Član 3.
 */
export const IDSS_TIMING = {
  grades5to9Window: "Treća sedmica maja tekuće školske godine",
  approvalDeadline: "Kraj februara iste školske godine",
  grade4Window: "Prilagođen uzrastu, definisan godišnjim planom",
} as const;
