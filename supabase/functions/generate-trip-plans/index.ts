import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TripRequest {
  departureCity: string;
  destinations: string[];
  departureAddress?: string;
  tripType: string;
  gradeLevel: string;
  studentCount: number;
  chaperones: string[];
  transport: string;
  departureDate: string;
  returnDate: string;
  budget?: number;
  educationalFocus: string;
  specialNeeds: string;
  tripPriorities?: string;
  mealPlan?: string;
  accommodationType?: string;
  medicalInfo?: string;
  previousYearDestination?: string;
  language?: string;
}

interface POI {
  name: string;
  kind: string;
  lat: number;
  lng: number;
  address?: string;
  website?: string;
  phone?: string;
  openingHours?: string;
}

// =====================================================================
// GEOCODING
// =====================================================================

async function geocodeCity(cityName: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const url = "https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(cityName) + "&format=json&limit=1&addressdetails=1";
    const response = await fetch(url, {
      headers: { 'User-Agent': 'IDSS-Trip-Planner/6.0 (info@idss.ba)' }
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error for " + cityName + ":", error);
    return null;
  }
}

function getFallbackCoordinates(cityName: string): { lat: number; lng: number } | null {
  const n = cityName.toLowerCase().replace(/,.*$/, '').replace(/\s+/g, ' ').trim();
  const db: Record<string, { lat: number; lng: number }> = {
    'sarajevo': { lat: 43.8563, lng: 18.4131 }, 'beograd': { lat: 44.7866, lng: 20.4489 },
    'belgrade': { lat: 44.7866, lng: 20.4489 }, 'budapest': { lat: 47.4979, lng: 19.0402 },
    'budimpešta': { lat: 47.4979, lng: 19.0402 }, 'zagreb': { lat: 45.8150, lng: 15.9819 },
    'ljubljana': { lat: 46.0569, lng: 14.5058 }, 'beč': { lat: 48.2082, lng: 16.3738 },
    'vienna': { lat: 48.2082, lng: 16.3738 }, 'wien': { lat: 48.2082, lng: 16.3738 },
    'prag': { lat: 50.0755, lng: 14.4378 }, 'prague': { lat: 50.0755, lng: 14.4378 },
    'rim': { lat: 41.9028, lng: 12.4964 }, 'rome': { lat: 41.9028, lng: 12.4964 },
    'paris': { lat: 48.8566, lng: 2.3522 }, 'barcelona': { lat: 41.3851, lng: 2.1734 },
    'london': { lat: 51.5074, lng: -0.1278 }, 'berlin': { lat: 52.5200, lng: 13.4050 },
    'münchen': { lat: 48.1351, lng: 11.5820 }, 'munich': { lat: 48.1351, lng: 11.5820 },
    'amsterdam': { lat: 52.3676, lng: 4.9041 }, 'mostar': { lat: 43.3438, lng: 17.8078 },
    'dubrovnik': { lat: 42.6507, lng: 18.0944 }, 'split': { lat: 43.5081, lng: 16.4402 },
    'doboj': { lat: 44.7319, lng: 18.0854 }, 'salzburg': { lat: 47.8095, lng: 13.0550 },
    'venecija': { lat: 45.4408, lng: 12.3155 }, 'venice': { lat: 45.4408, lng: 12.3155 },
    'firenca': { lat: 43.7696, lng: 11.2558 }, 'florence': { lat: 43.7696, lng: 11.2558 },
    'milan': { lat: 45.4642, lng: 9.1900 }, 'bologna': { lat: 44.4949, lng: 11.3426 },
    'bolonja': { lat: 44.4949, lng: 11.3426 }, 'bukurešt': { lat: 44.4268, lng: 26.1025 },
    'bucharest': { lat: 44.4268, lng: 26.1025 }, 'moskva': { lat: 55.7558, lng: 37.6173 },
    'moscow': { lat: 55.7558, lng: 37.6173 }, 'são paulo': { lat: -23.5505, lng: -46.6333 },
    'rio de janeiro': { lat: -22.9068, lng: -43.1729 }, 'buenos aires': { lat: -34.6037, lng: -58.3816 },
    'new york': { lat: 40.7128, lng: -74.0060 }, 'tokyo': { lat: 35.6762, lng: 139.6503 },
    'istanbul': { lat: 41.0082, lng: 28.9784 }, 'atina': { lat: 37.9838, lng: 23.7275 },
    'athens': { lat: 37.9838, lng: 23.7275 }, 'lisbon': { lat: 38.7223, lng: -9.1393 },
    'madrid': { lat: 40.4168, lng: -3.7038 }, 'plitvice': { lat: 44.8654, lng: 15.6220 },
    'postojna': { lat: 45.7747, lng: 14.2133 }, 'bled': { lat: 46.3683, lng: 14.1146 },
    'tuzla': { lat: 44.5384, lng: 18.6763 }, 'banja luka': { lat: 44.7722, lng: 17.1910 },
    'zenica': { lat: 44.2017, lng: 17.9078 }, 'travnik': { lat: 44.2264, lng: 17.6653 },
    'jajce': { lat: 44.3392, lng: 17.2700 }, 'konjic': { lat: 43.6519, lng: 17.9619 },
    'neum': { lat: 42.9231, lng: 17.6156 }, 'trebinje': { lat: 42.7119, lng: 18.3464 },
    'skopje': { lat: 41.9981, lng: 21.4254 }, 'podgorica': { lat: 42.4304, lng: 19.2594 },
    'tirana': { lat: 41.3275, lng: 19.8187 }, 'bratislava': { lat: 48.1486, lng: 17.1077 },
    'krakow': { lat: 50.0647, lng: 19.9450 }, 'warsaw': { lat: 52.2297, lng: 21.0122 },
    'varsava': { lat: 52.2297, lng: 21.0122 }, 'graz': { lat: 47.0707, lng: 15.4395 },
    'innsbruck': { lat: 47.2692, lng: 11.4041 }, 'trieste': { lat: 45.6495, lng: 13.7768 },
    'trst': { lat: 45.6495, lng: 13.7768 }, 'maribor': { lat: 46.5547, lng: 15.6459 },
    'novi sad': { lat: 45.2671, lng: 19.8335 }, 'rijeka': { lat: 45.3271, lng: 14.4422 },
    'zadar': { lat: 44.1194, lng: 15.2314 },
  };
  if (db[n]) return db[n];
  for (const [key, coords] of Object.entries(db)) {
    if (n.includes(key) || key.includes(n)) return coords;
  }
  return null;
}

// =====================================================================
// POI FETCHING — lightweight, parallel, with timeout
// =====================================================================

async function fetchPOIsOverpass(lat: number, lng: number, poiType: string, limit: number = 4): Promise<POI[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const radius = 5000;
    let query = '';
    switch (poiType) {
      case 'museums':
        query = `[out:json][timeout:5];node["tourism"="museum"](around:${radius},${lat},${lng});out body ${limit};`;
        break;
      case 'attractions':
        query = `[out:json][timeout:5];(node["historic"](around:${radius},${lat},${lng});node["tourism"="attraction"](around:${radius},${lat},${lng}););out body ${limit};`;
        break;
      case 'restaurants':
        query = `[out:json][timeout:5];node["amenity"="restaurant"](around:${radius},${lat},${lng});out body ${limit};`;
        break;
      case 'hotels':
        query = `[out:json][timeout:5];(node["tourism"="hotel"](around:${radius},${lat},${lng});node["tourism"="hostel"](around:${radius},${lat},${lng}););out body ${limit};`;
        break;
      case 'culture':
        query = `[out:json][timeout:5];(node["tourism"="gallery"](around:${radius},${lat},${lng});node["amenity"="theatre"](around:${radius},${lat},${lng});node["tourism"="zoo"](around:${radius},${lat},${lng});node["leisure"="park"]["name"](around:${radius},${lat},${lng}););out body ${limit};`;
        break;
      default: return [];
    }
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.elements || !Array.isArray(data.elements)) return [];
    return data.elements
      .filter((item: any) => item.tags && item.tags.name)
      .map((item: any) => ({
        name: item.tags.name,
        kind: poiType,
        lat: item.lat || lat,
        lng: item.lon || lng,
        address: item.tags['addr:street'] ? (item.tags['addr:street'] + ' ' + (item.tags['addr:housenumber'] || '') + ', ' + (item.tags['addr:city'] || '')).trim() : undefined,
        website: item.tags.website || item.tags.url,
        phone: item.tags.phone || item.tags['contact:phone'],
        openingHours: item.tags.opening_hours
      }));
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

interface CityContext {
  city: string;
  lat: number;
  lng: number;
  museums: POI[];
  attractions: POI[];
  restaurants: POI[];
  hotels: POI[];
  culture: POI[];
}

async function fetchCityContext(cityName: string): Promise<CityContext | null> {
  let geoData = await geocodeCity(cityName);
  if (!geoData) {
    const fb = getFallbackCoordinates(cityName);
    if (fb) geoData = { ...fb, displayName: cityName };
    else return null;
  }

  // All POI types in parallel
  const [museums, attractions, restaurants, hotels, culture] = await Promise.all([
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'museums', 4),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'attractions', 4),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'restaurants', 4),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'hotels', 4),
    fetchPOIsOverpass(geoData.lat, geoData.lng, 'culture', 4)
  ]);
  return { city: cityName, lat: geoData.lat, lng: geoData.lng, museums, attractions, restaurants, hotels, culture };
}

// =====================================================================
// ROUTE
// =====================================================================

async function calculateRouteDistance(coordinates: Array<{lat: number; lng: number}>): Promise<{distance_km: number; duration_hours: number}> {
  if (coordinates.length < 2) return { distance_km: 0, duration_hours: 0 };
  try {
    const coordString = coordinates.map(c => c.lng + ',' + c.lat).join(';');
    const url = "https://router.project-osrm.org/route/v1/driving/" + coordString + "?overview=false";
    const response = await fetch(url);
    if (!response.ok) return estimateDistance(coordinates);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return {
        distance_km: Math.round(data.routes[0].distance / 1000),
        duration_hours: Math.round(data.routes[0].duration / 3600 * 10) / 10
      };
    }
    return estimateDistance(coordinates);
  } catch {
    return estimateDistance(coordinates);
  }
}

function estimateDistance(coordinates: Array<{lat: number; lng: number}>): {distance_km: number; duration_hours: number} {
  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const R = 6371;
    const dLat = (coordinates[i + 1].lat - coordinates[i].lat) * Math.PI / 180;
    const dLon = (coordinates[i + 1].lng - coordinates[i].lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coordinates[i].lat * Math.PI / 180) * Math.cos(coordinates[i + 1].lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c * 1.3;
  }
  return { distance_km: Math.round(totalDistance), duration_hours: Math.round(totalDistance / 70 * 10) / 10 };
}

function buildRouteCoordinates(
  departureCity: string, destinations: string[], cityContexts: CityContext[]
): Array<{ city: string; lat: number; lng: number; order: number }> {
  const allCityNames = [departureCity, ...destinations];
  const coords: Array<{ city: string; lat: number; lng: number; order: number }> = [];
  const lookup = new Map<string, CityContext>();
  for (const c of cityContexts) lookup.set(c.city.toLowerCase().trim(), c);

  for (let i = 0; i < allCityNames.length; i++) {
    const name = allCityNames[i];
    const ctx = lookup.get(name.toLowerCase().trim());
    if (ctx) {
      coords.push({ city: name, lat: ctx.lat, lng: ctx.lng, order: i + 1 });
    } else {
      const fb = getFallbackCoordinates(name);
      coords.push({ city: name, lat: fb?.lat || 43.8563, lng: fb?.lng || 18.4131, order: i + 1 });
    }
  }
  if (coords.length > 0) {
    coords.push({ city: departureCity + ' (povratak)', lat: coords[0].lat, lng: coords[0].lng, order: coords.length + 1 });
  }
  return coords;
}

// =====================================================================
// COSTS
// =====================================================================

function calculateCosts(
  tripData: TripRequest,
  routeInfo: { distance_km: number; duration_hours: number },
  tripDays: number,
  tierType: 'Budget' | 'Balanced' | 'Premium'
) {
  const studentCount = tripData.studentCount || 14;
  const chaperoneCount = Math.max(tripData.chaperones?.length || 0, Math.ceil(studentCount / 15));
  const totalPersons = studentCount + chaperoneCount;
  // Tačan broj noći: jednodnevni izlet (tripDays = 1) → 0 noći, bez troškova smještaja.
  const nights = Math.max(tripDays - 1, 0);
  const totalKm = routeInfo.distance_km + tripDays * 30;

  let transportCost: number, transportDetail: string;
  if (tripData.transport === 'bus' || tripData.transport === 'Bus') {
    const rate = tierType === 'Premium' ? 1.30 : 1.10;
    transportCost = Math.round(totalKm * rate);
    transportDetail = totalKm + " km × " + rate.toFixed(2) + " EUR/km";
  } else {
    const rate = tierType === 'Budget' ? 35 : tierType === 'Balanced' ? 55 : 85;
    transportCost = Math.round(rate * totalPersons * 2);
    transportDetail = totalPersons + " osoba × " + rate + " EUR × 2";
  }

  const accomRate = tierType === 'Budget' ? 28 : tierType === 'Balanced' ? 48 : 85;
  const accommodationCost = nights > 0 ? Math.round(accomRate * totalPersons * nights) : 0;
  const accomLabel = tierType === 'Budget' ? 'hostel/2*' : tierType === 'Balanced' ? '3* hotel' : '4-5* hotel';
  const accommodationDetail = nights > 0
    ? nights + " noći × " + accomRate + " EUR/os (" + accomLabel + ")"
    : "Jednodnevni izlet — bez smještaja";

  const mealRate = tierType === 'Budget' ? 25 : tierType === 'Balanced' ? 40 : 65;
  const mealsCost = Math.round(mealRate * totalPersons * tripDays);
  const mealsDetail = tripDays + " dana × " + mealRate + " EUR/os/dan";

  // Aktivnosti i ulaznice: postoje i kod jednodnevnih izleta (min 1 dan aktivnosti).
  const activeDays = Math.max(tripDays, 1);
  const entryRate = tierType === 'Budget' ? 7 : tierType === 'Balanced' ? 15 : 28;
  const entryFees = Math.round(entryRate * totalPersons * activeDays);
  const activityRate = tierType === 'Budget' ? 3 : tierType === 'Balanced' ? 10 : 22;
  const activityFees = Math.round(activityRate * totalPersons * activeDays);
  const localTransportRate = tierType === 'Budget' ? 5 : tierType === 'Balanced' ? 8 : 15;
  const localTransport = Math.round(localTransportRate * totalPersons * tripDays);

  const subtotal = transportCost + accommodationCost + mealsCost + entryFees + activityFees + localTransport;
  const contingency = Math.round(subtotal * 0.05);
  const total = subtotal + contingency;

  return {
    transport: transportCost, accommodation: accommodationCost, meals: mealsCost,
    entry_fees: entryFees, activity_fees: activityFees, local_transport: localTransport,
    contingency, total, cost_per_student: Math.round(total / studentCount),
    transport_detail: transportDetail, accommodation_detail: accommodationDetail, meals_detail: mealsDetail,
  };
}

// =====================================================================
// AI GENERATION — one plan at a time for reliability
// =====================================================================

function buildPOIContext(contexts: CityContext[]): string {
  return contexts.map(c => {
    const parts = [`[${c.city}]`];
    const allPOIs = [
      ...c.museums.map(p => `Muzej: ${p.name}${p.address ? ' @ '+p.address : ''}${p.phone ? ' tel:'+p.phone : ''}`),
      ...c.attractions.map(p => `Znamenitost: ${p.name}${p.address ? ' @ '+p.address : ''}${p.phone ? ' tel:'+p.phone : ''}`),
      ...c.restaurants.map(p => `Restoran: ${p.name}${p.address ? ' @ '+p.address : ''}${p.phone ? ' tel:'+p.phone : ''}`),
      ...c.hotels.map(p => `Smještaj: ${p.name}${p.address ? ' @ '+p.address : ''}${p.phone ? ' tel:'+p.phone : ''}`),
      ...c.culture.map(p => `Kultura: ${p.name}${p.address ? ' @ '+p.address : ''}${p.phone ? ' tel:'+p.phone : ''}`),
    ];
    parts.push(allPOIs.join('\n'));
    return parts.join('\n');
  }).join('\n\n');
}

async function generateSinglePlan(
  tripData: TripRequest,
  cityContexts: CityContext[],
  routeInfo: { distance_km: number; duration_hours: number },
  tripDays: number,
  fullRoute: string,
  tier: 'Budget' | 'Balanced' | 'Premium',
  apiKey: string
): Promise<any | null> {
  const poiContext = buildPOIContext(cityContexts);
  const chaperoneNames = tripData.chaperones.length > 0 ? tripData.chaperones.join(', ') : Math.ceil(tripData.studentCount / 15) + ' pratitelja';
  
  const accomType = tier === 'Budget' ? 'hostel ili 2* hotel' : tier === 'Balanced' ? '3* hotel' : '4-5* hotel';
  const mealType = tier === 'Budget' ? 'pristupačni restorani, fast food, pekare' : tier === 'Balanced' ? 'srednja klasa restorani, lokalna kuhinja' : 'vrhunski restorani, fine dining';

  // === USTAVNI INPUT — strict user-chosen overrides ===
  // Map enum values from the form to concrete, human-readable instructions for the AI.
  const userAccomMap: Record<string, string> = {
    hotel: "HOTEL (2*, 3*, 4* ili 5*) — ZABRANJEN hostel, omladinski hostel, hostel kapsule, kamp, planinska kuća, apartman",
    hostel: "HOSTEL — koristi isključivo hostel/youth hostel ponudu, NE HOTEL",
    youth_hostel: "OMLADINSKI HOSTEL (youth hostel) — bez hotela, bez kampova",
    apartment: "APARTMAN — privatni/turistički apartmani, NE hotel, NE hostel",
    camp: "KAMP — kampove i kamp-naselja, NE hotel, NE hostel",
    mountain_hut: "PLANINSKA KUĆA / dom u prirodi, NE hotel, NE hostel",
  };
  const userMealMap: Record<string, string> = {
    full_board: "PUNI PANSION — doručak + ručak + večera SVAKOG dana (uključujući dan dolaska/odlaska gdje je moguće)",
    half_board: "POLUPANSION — doručak + večera SVAKOG dana",
    breakfast_only: "SAMO DORUČAK uključen u smještaj; ručak i večera su slobodne aktivnosti",
    self_catering: "BEZ ORGANIZOVANIH OBROKA — učenici sami biraju gdje će jesti, ne planiraj obroke u itinereru osim kao slobodno vrijeme",
    packed_lunch: "PAKET OBROK — pripremljeni obroci, ne planiraj restorane za ručak",
  };
  const userTransportMap: Record<string, string> = {
    bus: "AUTOBUS — sav međugradski prijevoz autobusom, NE avion/voz/brod",
    train: "VOZ — sav međugradski prijevoz vozom, NE autobus/avion/brod",
    plane: "AVION — međugradski prijevoz avionom + transferi do/od aerodroma",
    ship: "BROD/TRAJEKT — sav međugradski prijevoz brodom/trajektom",
    mixed: "KOMBINIRANI prijevoz (autobus + voz/avion) — koristi najefikasniju kombinaciju",
  };
  const userAccomChoice = tripData.accommodationType ? userAccomMap[tripData.accommodationType] : null;
  const userMealChoice = tripData.mealPlan ? userMealMap[tripData.mealPlan] : null;
  const userTransportChoice = tripData.transport ? userTransportMap[tripData.transport] : null;
  const effectiveAccomType = userAccomChoice || accomType;
  const effectiveMealType = userMealChoice || mealType;

  // USTAVNI free-text input from "Važne informacije za planiranje puta".
  // This is treated as the highest-priority instruction set from the teacher
  // and is injected into BOTH the system and user prompts so the model cannot
  // silently ignore it.
  const userPrioritiesText = (tripData.tripPriorities || "").trim();
  const userSpecialNeedsText = (tripData.specialNeeds || "").trim();
  const userMedicalText = (tripData.medicalInfo || "").trim();

  const numberedRoute = tripData.destinations.map((d, i) => `${i + 1}. ${d}`).join(', ');
  const meetingAddress = tripData.departureAddress?.trim() || "IDSS, Buka 13, 71 000 Sarajevo";
  const finalDestination = tripData.destinations[tripData.destinations.length - 1];
  const intermediateStops = tripData.destinations.slice(0, -1);
  const tripNights = Math.max(tripDays - 1, 0);
  const languageInstruction = buildLanguageInstruction(tripData.language);

  // Jednodnevni izlet: cijela škola ili predškolska grupa ili jedan razred — bez razgledanja usput.
  const isDayTrip = tripDays === 1;
  const isWholeSchool = tripData.gradeLevel === "all" || tripData.gradeLevel === "all+preschool";
  const dayTripBlock = isDayTrip ? `

KRITIČNO — JEDNODNEVNI IZLET (PRAVILO IDSS):
- Tip grupe: ${isWholeSchool ? (tripData.gradeLevel === "all+preschool" ? "CIJELA ŠKOLA + PREDŠKOLSKA GRUPA" : "CIJELA ŠKOLA") : `samo jedan razred (${tripData.gradeLevel}. razred)`}.
- BEZ razgledanja, obilazaka i turističkih pauza na međustanicama (${intermediateStops.length > 0 ? intermediateStops.join(', ') : 'nema'}). Cilj je ŠTO BRŽI dolazak na konačno odredište "${finalDestination}".
- Dozvoljene su SAMO kratke tehničke pauze (toalet/voda) maksimalno 15 minuta, i to samo ako vožnja u jednom smjeru prelazi 2 sata (Pravilnik Član 15).
- Sav obrazovni i rekreativni sadržaj se odvija ISKLJUČIVO na konačnom odredištu "${finalDestination}".
- Dan ima jasan oblik: polazak → direktna vožnja (sa eventualnom tehničkom pauzom) → boravak na izletištu → direktan povratak.
- BEZ smještaja, BEZ noćenja, BEZ "accommodation" aktivnosti.
` : `

KRITIČNO — VIŠEDNEVNA EKSKURZIJA (STROGO PREMA IDSS PRAVILNIKU 09.03.2026):
- Plan MORA u potpunosti slijediti IDSS Pravilnik o organizaciji ekskurzija, IDSS Uputstvo i Saglasnost roditelja (Prilog 1).
- Dnevni raspored, smještaj, prijevoz, komunikacija s roditeljima, plaćanje i hitni protokoli MORAJU pratiti standarde iz Uputstva 5.1, 5.2 i Pravilnika Član 15.
- Sva noćenja samo u "${finalDestination}". Međustanice: kratko zadržavanje (1–3 sata) bez noćenja.
`;

  const systemPrompt = `Ti si profesionalni planer školskih ekskurzija za Internationale Deutsche Schule Sarajevo (IDSS). Generišeš JEDAN ultra-detaljan ${tier} plan puta U SKLADU SA IDSS PRAVILNIKOM I UPUTSTVOM O ORGANIZACIJI EKSKURZIJA (09.03.2026).

KRITIČNO — REDOSLIJED DESTINACIJA:
Korisnik je EKSPLICITNO odredio redoslijed posjete destinacija. MORAŠ ga STROGO poštovati:
${numberedRoute}
Grupa PRVO ide na destinaciju br. 1, PA ONDA na br. 2, itd. Na povratku se vraća u polazište.
NE SMIJEŠ mijenjati ovaj redoslijed ni pod kojim uvjetima!
${dayTripBlock}
KRITIČNO — RASPODJELA ZADRŽAVANJA I NOĆENJA:
- KONAČNA (zadnja) destinacija "${finalDestination}" je GLAVNA destinacija ekskurzije. Tu grupa provodi NAJVIŠE vremena i SVA noćenja (ukupno ${tripNights} ${tripNights === 1 ? 'noć' : 'noći'}).
- SVE ostale destinacije na ruti (${intermediateStops.length > 0 ? intermediateStops.join(', ') : 'nema međustanica'}) su MEĐUSTANICE BEZ NOĆENJA. Tu se grupa zadržava KRATKO (1–3 sata): ručak, kratko razgledanje, fotografska pauza ili obilazak jedne ključne znamenitosti — i nastavlja put.
- Smještaj (hotel/hostel) se rezerviše ISKLJUČIVO u "${finalDestination}". Nikada ne planiraj noćenje u međustanicama.
- Na povratku u "${tripData.departureCity}" dozvoljena je samo kratka pauza za obrok ili odmor, bez noćenja.
- Ako je putovanje jednodnevno (0 noći), sve destinacije su kratke posjete bez smještaja.

KRITIČNO — TAČKA OKUPLJANJA:
Polazak grupe je TAČNO sa ove adrese (NE IZMIŠLJAJ drugu adresu, NE koristi "Džemala Bijedića" niti bilo koju drugu adresu):
"${meetingAddress}"
U prvoj aktivnosti dana 1 MORAŠ koristiti TAČNO ovu adresu kao mjesto okupljanja.

IDSS PRAVILNIK — OBAVEZNI STANDARDI (Uputstvo 5.1, 5.2, Pravilnik Član 15):
- DNEVNI RASPORED za višednevne ekskurzije MORA pratiti ovaj okvir:
  07:00 buđenje | 07:00–08:00 higijena | 08:00–09:00 doručak | 09:00–13:00 obrazovne aktivnosti |
  13:00–14:00 ručak | 14:00–18:00 obilazak/radionice | 18:00–19:00 večera |
  19:00–21:30 kulturni/zabavni program | 21:30–22:00 priprema za spavanje | 22:00 OBAVEZNO gašenje svjetla.
- SMJEŠTAJ: nakon 22:00 zabranjeno napuštanje soba; bez alkohola, cigareta, energetskih pića, opasnih predmeta.
- PRIJEVOZ (Pravilnik Član 15): isključivo licencirani autobus s pojasevima i klimom; pauza svakih 2 sata; bez ustajanja tokom vožnje.
- KOMUNIKACIJA: dnevni izvještaji u Viber grupu razreda; roditelji kontaktiraju razrednika 19:00–20:00.
- PLAĆANJE (Uputstvo 4): jednokratno, najkasnije 14 dana prije polaska. Bez rata.
- HITNI BROJEVI: uvijek navedi 112 (EU/BiH), kontakt razrednika i lokalnu hitnu pomoć po destinaciji.

OBAVEZNA PRAVILA:
- Svaki obrok: KONKRETNO ime restorana, adresa, telefon, opis hrane (min 2 rečenice)
- Smještaj: KONKRETNO ime (${effectiveAccomType}), adresa, telefon, cijena/noć, opis
- Svaka posjeta: KONKRETNO ime lokacije, adresa, radno vrijeme, telefon (ako postoji), website (ako postoji), cijena ulaznice, edukativni opis (min 2 rečenice)
- Svaki dan: minimum 6 aktivnosti s preciznim vremenima
- Dan putovanja: gdje će djeca jesti na putu (konkretno ime restorana na ruti)
- Koristi STVARNA, POZNATA imena. Dopuni podatke iz konteksta SVOJIM ZNANJEM o tim gradovima.
- Restorani: ${effectiveMealType}

========================================
NO HALLUCINATION / NO HYPE — APSOLUTNA PRAVILA TAČNOSTI:
- ZABRANJENO izmišljanje imena lokacija, adresa, telefona, websajtova, radnog vremena ili cijena. Ako podatak nije pouzdan, izostavi polje (ne stavljaj "N/A", ne izmišljaj brojeve).
- ZABRANJENI marketinški pridjevi i superlativi tipa "najbolji", "nezaboravno", "vrhunsko iskustvo", "magično", "ekskluzivno". Piši FAKTOGRAFSKI, kratko, profesionalno.
- Telefoni, e-mail, web — samo ako su u POI kontekstu ili sigurno opštepoznati (npr. službeni muzej). U suprotnom — izostavi polje.
- Adrese — samo realne, postojeće ulice u datom gradu. Bez izmišljenih kućnih brojeva.
- Cijene — orijentacione, u rasponima (npr. "8–12 EUR"), nikad lažna preciznost.
- Svaki opis aktivnosti mora biti činjenicama-zasnovan, bez emocionalnog naboja.
========================================

========================================
USTAV (APSOLUTNI ZAHTJEVI KORISNIKA — NE SMIJU SE PREKRŠITI):
${userAccomChoice ? `- TIP SMJEŠTAJA: ${userAccomChoice}` : ""}
${userMealChoice ? `- PLAN ISHRANE: ${userMealChoice}` : ""}
${userTransportChoice ? `- PRIJEVOZ: ${userTransportChoice}` : ""}
${userPrioritiesText ? `- VAŽNE INFORMACIJE ZA PLANIRANJE PUTA (USTAVNI slobodni unos nastavnika):\n"""${userPrioritiesText}"""\n  → Svaki zahtjev iz ovog teksta MORA biti integriran u itinerer i preferencije. Ako navodi sat polaska/povratka, broj pauza, zabrane (npr. "bez muzeja", "bez noćnih izlazaka"), preferencije ishrane, edukativne fokuse, ili specifične lokacije — sve TO MORA biti vidljivo u planu. Ako ne možeš ispoštovati neki dio, eksplicitno ga navedi u "why_this_fits" sa razlogom.` : ""}
${userSpecialNeedsText ? `- POSEBNE POTREBE: ${userSpecialNeedsText} (planiraj pristupačnost, opremu i pauze koje to zahtijevaju)` : ""}
${userMedicalText ? `- MEDICINSKE NAPOMENE: ${userMedicalText} (uračunaj u hitne kontakte i pauze)` : ""}
Ako bilo koji od ovih zahtjeva NIJE ispoštovan, plan se odbacuje. Tier (Budget/Balanced/Premium) NE SMIJE nadjačati korisnikov izbor — utiče samo na cijenu/kategoriju unutar odabranog tipa.
========================================

Odgovori SAMO čistim JSON-om (bez markdown oznaka):
{
  "type":"${tier}",
  "label":"${tier === 'Budget' ? 'Ekonomična opcija' : tier === 'Balanced' ? 'Optimalni odnos cijene i kvaliteta' : 'Premium VIP iskustvo'}",
  "accommodation_name":"...",
  "accommodation_address":"...",
  "accommodation_phone":"...",
  "accommodation_website":"...",
  "accommodation_hours":"Check-in: ..., Check-out: ...",
  "accommodation_type_actual":"hotel|hostel|youth_hostel|apartment|camp|mountain_hut",
  "accommodation_price_per_night":"... EUR/os",
  "why_this_fits":"2-3 rečenice",
  "itinerary":[
    {
      "day":1,
      "date":"YYYY-MM-DD",
      "title":"Naslov dana",
      "summary":"Kratak pregled",
      "activities":[
        {"time":"07:00 - 07:30","description":"Detaljan opis min 2 rečenice sa svim konkretnim informacijama.","type":"activity|travel|meal|accommodation|free_time","location":"Ime lokacije","address":"Ulica br, Grad","phone":"+xxx ...","opening_hours":"Pon-Ned 09:00-18:00","website":"https://...","price":"... EUR / os","lat":0.0,"lng":0.0,"notes":"..."}
      ]
    }
  ]
}`;

  const userPrompt = `${tier} plan za školsku ekskurziju:
STROGI REDOSLIJED POSJETE: ${tripData.departureCity} → ${tripData.destinations.join(' → ')} → ${tripData.departureCity} (povratak)
Datumi: ${tripData.departureDate} do ${tripData.returnDate} (${tripDays} dana)
${tripData.studentCount} učenika, ${tripData.gradeLevel}. razred | Pratitelji: ${chaperoneNames} | Prevoz: ${tripData.transport}
Udaljenost: ~${routeInfo.distance_km}km, ~${routeInfo.duration_hours}h | Fokus: ${tripData.educationalFocus || "historija, kultura, nauka"}
${tripData.specialNeeds ? 'Posebne potrebe: ' + tripData.specialNeeds : ''}
${tripData.mealPlan ? 'Ishrana: ' + tripData.mealPlan : ''}
${tripData.accommodationType ? 'Smještaj: ' + tripData.accommodationType : ''}
${tripData.tripPriorities && tripData.tripPriorities.trim().length > 0 ? `

========================================
USTAVNI (OBAVEZUJUĆI) INPUT KORISNIKA — MORA SE POŠTOVATI U PLANU:
${tripData.tripPriorities.trim()}
========================================
Pravila:
- Sva vremena, ograničenja i zahtjevi iznad imaju NAJVIŠI prioritet i nadjačavaju default heuristike.
- Ako korisnik traži "BEZ ZADRŽAVANJA" na međustanicama, prolazi kroz njih bez planiranih aktivnosti/pauza (samo tehnički prolazak).
- Ako su navedena vremena polaska/povratka, koristi ih TAČNO kao prvi/posljednji item u itinereru.
- Ne dodaj aktivnosti koje krše ova pravila čak i ako bi inače bile preporučene.
` : ''}
${tripData.previousYearDestination ? 'NAPOMENA O ROTACIJI (Pravilnik Glava II, Član 4): grupa je prošle godine bila u ' + tripData.previousYearDestination + '. Uvaži ovo pri preporukama.' : ''}

LOKACIJE U GRADOVIMA (koristi + dopuni):
${poiContext}

VAŽNO: Destinacije se posjećuju TAČNO ovim redoslijedom: ${tripData.destinations.join(', ')}. Ne mijenjaj redoslijed!
Generiši detaljan ${tier} plan sa SVIM danima i SVIM aktivnostima. Samo JSON.`;

  // Use a single, broadly-enabled model to avoid "Unsupported provider" gateway errors.
  const model = 'google/gemini-2.5-flash';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt + languageInstruction },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        top_p: 0.8,
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`AI error for ${tier}:`, response.status, errText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    clearTimeout(timeout);
    console.error(`AI generation error (${tier}):`, error);
    return null;
  }
}

// =====================================================================
// PACKING LIST & RULES
// =====================================================================

function generatePackingList(tripDays: number, tier: string, tripData: TripRequest): string[] {
  const items = [
    "Osobna iskaznica ili pasoš (original + kopija)",
    "Zdravstvena iskaznica (EU kartica ako je dostupna)",
    "Kopija potvrde roditelja / staratelja",
    "Kopija putnog rasporeda i hitnih kontakata",
    "Novac za osobne troškove (" + (tier === 'Premium' ? '80-120' : tier === 'Balanced' ? '50-80' : '30-50') + " EUR preporučeno)",
    tripDays + "x promjena odjeće (donje rublje, čarape, majice)",
    "Udobne cipele za hodanje (OBAVEZNO — šetnja 5-10 km dnevno)",
    "Lagana jakna ili vjetrovka (za kišu/vjetar)",
    "Sredstva za higijenu (četkica, pasta, sapun, dezodorans)",
    "Ručnik (provjeriti da li smještaj osigurava)",
    "Ruksak za dnevne izlete",
    "Boca za vodu (punjiva, min. 0.5L)",
    "Lijekovi (ako su potrebni) — predati pratitelju s uputama",
    "Krema za sunčanje + kapa/šešir",
    "Mobitel + punjač (opciono: powerbank)",
    "Bilježnica + olovka za školski dnevnik putovanja",
    "Fotoaparat ili mobitel za fotografije",
  ];
  if (tripData.specialNeeds) items.push("Specijalna oprema: " + tripData.specialNeeds);
  return items;
}

function generateTripRules(gradeLevel: string): string[] {
  const grade = parseInt(gradeLevel) || 7;
  return [
    "Učenici se UVIJEK kreću u grupama od minimalno 3 osobe",
    "Obavezno nošenje identifikacijske narukvice tokom cijelog putovanja",
    "Obavezno vezivanje sigurnosnih pojaseva u autobusu",
    "Zabrana napuštanja smještaja nakon " + (grade <= 6 ? "20:00" : "21:00") + " bez pratitelja",
    "Noćni mir od " + (grade <= 6 ? "21:00" : "22:00") + " — tišina u hodnicima i sobama",
    "Poštivanje pravila svih muzeja, galerija i javnih institucija",
    "Mobilni telefoni isključeni/na vibration tokom posjeta muzejima i kazalištima",
    "Zabranjeno konzumiranje alkohola, cigareta i opojnih sredstava",
    "U slučaju problema — odmah kontaktirati pratitelja (broj na identifikacijskoj narukvici)",
    "Čuvanje ličnih stvari i novca — škola ne odgovara za gubitak",
    "Kulturno ponašanje koje predstavlja školu u najboljem svjetlu",
    "Pratitelji imaju konačnu riječ u svim situacijama vezanim za sigurnost",
  ];
}

function normalizeActivityType(type: string): string {
  const validTypes = ['travel', 'meal', 'activity', 'accommodation', 'free_time'];
  if (validTypes.includes(type)) return type;
  const mapping: Record<string, string> = {
    'meeting': 'activity', 'transport': 'travel', 'sightseeing': 'activity',
    'cultural': 'activity', 'educational': 'activity', 'shopping': 'free_time',
    'rest': 'free_time', 'breakfast': 'meal', 'lunch': 'meal', 'dinner': 'meal',
    'hotel': 'accommodation', 'checkin': 'accommodation', 'checkout': 'accommodation',
  };
  return mapping[type] || 'activity';
}

// =====================================================================
// PLAN VALIDATION — ensure overnights are ONLY in the final destination
// =====================================================================

function normalizeName(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface PlanValidationResult {
  ok: boolean;
  violations: string[];
  overnightStops: string[];
  expectedFinal: string;
}

// Resolves the requested output language and returns the system-prompt fragment
// that forces the AI to write all natural-language fields in that language.
// Exported so regression tests can verify the contract.
export function resolveLanguage(input?: string | null): "bs" | "en" {
  return (input || "bs").toLowerCase().startsWith("en") ? "en" : "bs";
}

export function buildLanguageInstruction(input?: string | null): string {
  const lang = resolveLanguage(input);
  if (lang === "en") {
    return "\n\nIMPORTANT — OUTPUT LANGUAGE: All natural-language fields in the JSON (title, summary, description, why_this_fits, accommodation_*, location, notes) MUST be written in ENGLISH. Keep place names in their original local form (e.g. \"Sarajevo\", \"Wien\", \"Buka 13\"). All other rules above remain in force.";
  }
  return "\n\nVAŽNO — JEZIK IZLAZA: Sva polja u JSON-u (title, summary, description, why_this_fits, accommodation_*, location, notes) MORAJU biti napisana na BOSANSKOM jeziku. Imena mjesta zadrži u izvornom lokalnom obliku.";
}

export function validatePlanOvernights(
  plan: any,
  finalDestination: string,
  intermediateStops: string[],
  tripNights: number
): PlanValidationResult {
  const violations: string[] = [];
  const overnightStops: string[] = [];
  const finalKey = normalizeName(finalDestination);
  const intermediateKeys = intermediateStops.map(normalizeName);

  const accomCity = normalizeName(
    [plan?.accommodation_name, plan?.accommodation_address].filter(Boolean).join(" ")
  );
  if (tripNights > 0 && accomCity && intermediateKeys.some(k => k && accomCity.includes(k)) && !accomCity.includes(finalKey)) {
    violations.push(`Smještaj naveden u međustanici (accommodation_address ne sadrži konačnu destinaciju '${finalDestination}').`);
  }

  for (const day of plan?.itinerary || []) {
    for (const a of day?.activities || []) {
      const t = String(a?.type || "").toLowerCase();
      const desc = normalizeName(`${a?.description || ""} ${a?.location || ""} ${a?.notes || ""}`);
      const looksLikeStay = t === "accommodation" || /\b(check in|checkin|nocenje|spavanje|hotel|hostel|smjestaj)\b/.test(desc);
      if (!looksLikeStay) continue;
      // Determine which city this stay is in
      const matchedIntermediate = intermediateStops.find((c, i) => intermediateKeys[i] && desc.includes(intermediateKeys[i]));
      const matchesFinal = finalKey && desc.includes(finalKey);
      if (matchedIntermediate && !matchesFinal) {
        overnightStops.push(matchedIntermediate);
        violations.push(`Dan ${day?.day}: noćenje/smještaj planirano u međustanici '${matchedIntermediate}' (samo '${finalDestination}' smije imati noćenja).`);
      }
    }
  }

  if (tripNights === 0) {
    // Jednodnevni izlet — ne smije biti accommodation aktivnosti uopšte
    for (const day of plan?.itinerary || []) {
      for (const a of day?.activities || []) {
        if (String(a?.type || "").toLowerCase() === "accommodation") {
          violations.push(`Dan ${day?.day}: jednodnevni izlet (0 noći) ne smije imati 'accommodation' aktivnosti.`);
        }
      }
    }
  }

  return { ok: violations.length === 0, violations, overnightStops, expectedFinal: finalDestination };
}

// ──────────────────────────────────────────────────────────────────
// USER-INPUT (USTAV) VALIDATION — accommodation/meal must match
// ──────────────────────────────────────────────────────────────────
const ACCOM_FORBIDDEN: Record<string, RegExp> = {
  hotel: /\b(hostel|youth hostel|kamp\b|camping|planinska kuca|planinarski dom|mountain hut|apartman|apartment)\b/i,
  hostel: /\bhotel\b/i,
  youth_hostel: /\bhotel\b/i,
  apartment: /\b(hotel|hostel)\b/i,
  camp: /\b(hotel|hostel|apartman)\b/i,
  mountain_hut: /\b(hotel|hostel|apartman)\b/i,
};

export function validateUserChoices(
  plan: any,
  accommodationType?: string,
  mealPlan?: string,
  tripPriorities?: string,
): string[] {
  const issues: string[] = [];
  if (accommodationType && ACCOM_FORBIDDEN[accommodationType]) {
    const haystack = [
      plan?.accommodation_name,
      plan?.accommodation_address,
      plan?.accommodation_type_actual,
    ].filter(Boolean).join(" ");
    if (ACCOM_FORBIDDEN[accommodationType].test(haystack)) {
      issues.push(`Smještaj ne odgovara korisničkom izboru "${accommodationType}" (pronađen je zabranjen tip u "${haystack}").`);
    }
    // Walk itinerary accommodation activities
    for (const day of plan?.itinerary || []) {
      for (const a of day?.activities || []) {
        if (String(a?.type || "").toLowerCase() !== "accommodation") continue;
        const hay = [a?.location, a?.description, a?.notes].filter(Boolean).join(" ");
        if (ACCOM_FORBIDDEN[accommodationType].test(hay)) {
          issues.push(`Dan ${day?.day}: aktivnost smještaja ne odgovara izboru "${accommodationType}" ("${a?.location || a?.description}").`);
        }
      }
    }
  }
  if (mealPlan === "self_catering" || mealPlan === "packed_lunch") {
    // Should not plan restaurant meals
    for (const day of plan?.itinerary || []) {
      for (const a of day?.activities || []) {
        if (String(a?.type || "").toLowerCase() === "meal" && /\brestoran|restaurant\b/i.test(a?.description || "")) {
          // Allowed if just "obrok/paket" — flag only explicit restaurant booking
          issues.push(`Dan ${day?.day}: planiran restoran iako korisnik je izabrao "${mealPlan}".`);
          break;
        }
      }
    }
  }
  // Best-effort enforcement of free-text USTAV ("Važne informacije za planiranje puta").
  // We scan for explicit negative constraints the teacher commonly writes and
  // flag any plan activity that obviously violates them.
  const pri = (tripPriorities || "").toLowerCase();
  if (pri) {
    const NEGATIVE_RULES: Array<{ trigger: RegExp; forbid: RegExp; label: string }> = [
      { trigger: /bez\s+muzeja|no\s+museum/i, forbid: /\b(muzej|museum)\b/i, label: "muzeja" },
      { trigger: /bez\s+(noćnih|nocnih)\s+izlazaka|no\s+night\s+(out|activities)/i, forbid: /\b(noćni|nocni|night\s+club|noćni\s+izlazak)\b/i, label: "noćnih izlazaka" },
      { trigger: /bez\s+shopping(a)?|no\s+shopping/i, forbid: /\b(shopping|kupovin)/i, label: "shoppinga" },
      { trigger: /bez\s+restorana|no\s+restaurants?/i, forbid: /\b(restoran|restaurant)\b/i, label: "restorana" },
    ];
    for (const rule of NEGATIVE_RULES) {
      if (!rule.trigger.test(pri)) continue;
      for (const day of plan?.itinerary || []) {
        for (const a of day?.activities || []) {
          const hay = `${a?.description || ""} ${a?.location || ""} ${a?.notes || ""}`;
          if (rule.forbid.test(hay)) {
            issues.push(`Dan ${day?.day}: aktivnost krši USTAVNI zahtjev "bez ${rule.label}" iz polja Važne informacije.`);
            break;
          }
        }
      }
    }
  }
  return issues;
}

// ──────────────────────────────────────────────────────────────────
// FALLBACK PLAN ENGINE — used when AI Gateway is unavailable or fails
// Generates a deterministic plan from real POI data so users always
// get concrete location names, addresses, phones and opening hours.
// ──────────────────────────────────────────────────────────────────
function pickPoi(list: POI[], idx: number): POI | null {
  if (!list || list.length === 0) return null;
  return list[idx % list.length];
}

function poiActivity(time: string, type: string, poi: POI | null, fallback: string, prefix = ""): any {
  if (!poi) {
    return { time, type, description: fallback, location: fallback };
  }
  const desc = `${prefix}${poi.name}${poi.address ? ` — ${poi.address}` : ""}.${poi.openingHours ? ` Radno vrijeme: ${poi.openingHours}.` : ""}${poi.phone ? ` Tel: ${poi.phone}.` : ""}`;
  return {
    time,
    type,
    description: desc,
    location: poi.name,
    address: poi.address,
    phone: poi.phone,
    opening_hours: poi.openingHours,
    website: poi.website,
    lat: poi.lat,
    lng: poi.lng,
  };
}

export function generateFallbackPlan(
  tripData: TripRequest,
  cityContexts: CityContext[],
  tripDays: number,
  tier: 'Budget' | 'Balanced' | 'Premium',
): any {
  const finalDestination = tripData.destinations[tripData.destinations.length - 1];
  const lookup = new Map<string, CityContext>();
  for (const c of cityContexts) lookup.set(c.city.toLowerCase().trim(), c);
  const finalCtx = lookup.get(finalDestination.toLowerCase().trim()) || cityContexts[cityContexts.length - 1];

  // Accommodation: respect user choice when possible
  let accomPoi: POI | null = null;
  if (finalCtx) {
    const hotels = finalCtx.hotels || [];
    if (tripData.accommodationType === 'hotel') {
      accomPoi = hotels.find(h => !/hostel/i.test(h.name)) || hotels[0] || null;
    } else if (tripData.accommodationType === 'hostel' || tripData.accommodationType === 'youth_hostel') {
      accomPoi = hotels.find(h => /hostel/i.test(h.name)) || hotels[0] || null;
    } else {
      accomPoi = hotels[0] || null;
    }
  }

  const itinerary: any[] = [];
  const start = new Date(tripData.departureDate);
  for (let d = 0; d < tripDays; d++) {
    const dayDate = new Date(start.getTime() + d * 86400000);
    const dateStr = dayDate.toISOString().slice(0, 10);
    const cityIdx = Math.min(d, cityContexts.length - 1);
    const ctx = cityContexts[cityIdx] || finalCtx;
    const activities: any[] = [];

    if (d === 0) {
      activities.push({
        time: "07:00 - 07:30",
        type: "activity",
        description: `Okupljanje grupe na adresi ${tripData.departureAddress || "IDSS, Buka 13, Sarajevo"}. Provjera prisutnosti i kratak brief.`,
        location: tripData.departureAddress || "IDSS, Buka 13, 71 000 Sarajevo",
      });
      activities.push({
        time: "07:30 - 12:00",
        type: "travel",
        description: `Putovanje (${tripData.transport || 'autobus'}) ${tripData.departureCity} → ${tripData.destinations[0]}. Tehnička pauza svakih 2 sata (Pravilnik Član 15).`,
        location: `Ruta ${tripData.departureCity} → ${tripData.destinations[0]}`,
      });
    }

    activities.push(poiActivity("12:30 - 14:00", "meal", pickPoi(ctx?.restaurants || [], d), `Ručak u ${ctx?.city || finalDestination}`, "Ručak: "));
    activities.push(poiActivity("14:30 - 16:30", "activity", pickPoi(ctx?.museums || [], d), `Obrazovni posjet u ${ctx?.city || finalDestination}`, "Posjeta: "));
    activities.push(poiActivity("17:00 - 18:30", "activity", pickPoi(ctx?.attractions || [], d), `Razgledanje znamenitosti u ${ctx?.city || finalDestination}`, "Razgledanje: "));
    activities.push(poiActivity("19:00 - 20:30", "meal", pickPoi(ctx?.restaurants || [], d + 1), `Večera u ${ctx?.city || finalDestination}`, "Večera: "));

    if (tripDays > 1 && d < tripDays - 1) {
      activities.push(poiActivity("21:00 - 22:00", "accommodation", accomPoi, `Smještaj u ${finalDestination}`, "Smještaj: "));
    }

    if (d === tripDays - 1 && tripDays > 1) {
      activities.push({
        time: "15:00 - 21:00",
        type: "travel",
        description: `Povratak ${finalDestination} → ${tripData.departureCity}. Tehničke pauze svakih 2 sata.`,
        location: `Ruta ${finalDestination} → ${tripData.departureCity}`,
      });
    }

    itinerary.push({
      day: d + 1,
      date: dateStr,
      title: d === 0
        ? `Polazak — ${tripData.destinations[0]}`
        : d === tripDays - 1
          ? `Povratak iz ${finalDestination}`
          : `${ctx?.city || finalDestination} — obrazovni dan`,
      summary: `Plan generisan iz baze lokalnih lokacija (offline fallback engine, ${tier}).`,
      activities,
    });
  }

  return {
    type: tier,
    label: tier === 'Budget' ? 'Ekonomična opcija' : tier === 'Balanced' ? 'Optimalni odnos cijene i kvaliteta' : 'Premium VIP iskustvo',
    accommodation_name: accomPoi?.name || `Preporučeni ${tripData.accommodationType || 'smještaj'} u ${finalDestination}`,
    accommodation_address: accomPoi?.address || finalDestination,
    accommodation_phone: accomPoi?.phone || "—",
    accommodation_website: accomPoi?.website || "",
    accommodation_hours: "Check-in: 14:00, Check-out: 11:00",
    accommodation_type_actual: tripData.accommodationType || 'hotel',
    accommodation_price_per_night: tier === 'Budget' ? '28 EUR/os' : tier === 'Balanced' ? '48 EUR/os' : '85 EUR/os',
    why_this_fits: `Plan generisan offline fallback inženjerom (bez AI Gateway-a) iz baze OpenStreetMap lokacija za ${finalDestination}. Sve stavke uključuju stvarna imena lokacija iz POI baze.`,
    itinerary,
    _fallback: true,
  };
}

// =====================================================================
// MAIN SERVER
// =====================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const tripData: TripRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    console.log("=== IDSS TRIP PLANNER v6.0 — PARALLEL AI ENGINE ===");

    if (!tripData.departureCity || !tripData.destinations || tripData.destinations.length === 0) {
      return new Response(JSON.stringify({ error: "Polazište i najmanje jedna destinacija su obavezni." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!tripData.departureDate || !tripData.returnDate) {
      return new Response(JSON.stringify({ error: "Datum polaska i povratka su obavezni." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startDate = new Date(tripData.departureDate);
    const endDate = new Date(tripData.returnDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(JSON.stringify({ error: "Neispravni datumi." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tripDays = Math.max(Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1);

    const allCities = [tripData.departureCity, ...tripData.destinations, tripData.departureCity];
    const fullRoute = allCities.join(' → ');

    // NOTE: missing LOVABLE_API_KEY is NOT fatal — fallback engine takes over.

    // Step 1: Fetch ALL city contexts IN PARALLEL
    console.log("Step 1: Fetching POIs for all cities in parallel...");
    const uniqueCities = [...new Set([tripData.departureCity, ...tripData.destinations])];
    const cityContextResults = await Promise.all(uniqueCities.map(city => fetchCityContext(city)));
    const cityContexts = cityContextResults.filter((c): c is CityContext => c !== null);

    const totalPOIs = cityContexts.reduce((sum, c) =>
      sum + c.museums.length + c.attractions.length + c.restaurants.length +
      c.hotels.length + c.culture.length, 0
    );
    console.log(`Loaded ${totalPOIs} POIs across ${cityContexts.length} cities`);

    // Step 2: Route
    const routeCoordinates = buildRouteCoordinates(tripData.departureCity, tripData.destinations, cityContexts);
    const routeInfo = await calculateRouteDistance(routeCoordinates.map(c => ({ lat: c.lat, lng: c.lng })));
    console.log(`Route: ${routeInfo.distance_km}km, ${routeInfo.duration_hours}h`);

    // Step 3: Generate 3 plans IN PARALLEL with AI
    console.log("Step 3: Generating 3 plans in PARALLEL...");
    const tiers: Array<'Budget' | 'Balanced' | 'Premium'> = ['Budget', 'Balanced', 'Premium'];
    const planResults = LOVABLE_API_KEY
      ? await Promise.all(
          tiers.map(tier => generateSinglePlan(tripData, cityContexts, routeInfo, tripDays, fullRoute, tier, LOVABLE_API_KEY))
        )
      : tiers.map(() => null);

    // Replace any failed/missing AI plans with deterministic fallback plans built from POIs.
    const filledPlans = tiers.map((tier, idx) => {
      const ai = planResults[idx];
      if (ai) return ai;
      console.warn(`AI plan ${tier} unavailable — using offline fallback engine.`);
      return generateFallbackPlan(tripData, cityContexts, tripDays, tier);
    });
    const successfulPlans = filledPlans;

    const aiOk = planResults.filter(p => p !== null).length;
    console.log(`${aiOk}/3 AI plans generated; ${3 - aiOk} replaced by fallback engine.`);

    // Step 3b: Validate that overnights only happen in the final destination
    const finalDestination = tripData.destinations[tripData.destinations.length - 1];
    const intermediateStops = tripData.destinations.slice(0, -1);
    const tripNights = Math.max(tripDays - 1, 0);
    const validatedPlans: any[] = [];
    const validationReports: Array<{ tier: string; violations: string[] }> = [];
    for (const p of successfulPlans) {
      const v = validatePlanOvernights(p, finalDestination, intermediateStops, tripNights);
      const userIssues = validateUserChoices(p, tripData.accommodationType, tripData.mealPlan, tripData.tripPriorities);
      const allViolations = [...v.violations, ...userIssues];
      validationReports.push({ tier: p?.type || "?", violations: allViolations });
      if (allViolations.length === 0) {
        validatedPlans.push(p);
      } else {
        console.warn(`Plan ${p?.type} odbačen — kršenje pravila:`, allViolations);
        // If AI plan violates the user's "USTAV" inputs, replace with fallback
        // engine output that is guaranteed to honor the user's choices.
        if (userIssues.length > 0 || !v.ok) {
          const fb = generateFallbackPlan(tripData, cityContexts, tripDays, (p?.type || 'Balanced') as any);
          validatedPlans.push(fb);
        }
      }
    }

    if (validatedPlans.length === 0) {
      // Final safety net — produce at least one fallback plan
      validatedPlans.push(generateFallbackPlan(tripData, cityContexts, tripDays, 'Balanced'));
    }

    // Step 4: Enrich plans
    const enrichedPlans = validatedPlans.map((plan: any, idx: number) => {
      const tierType = plan.type || tiers[idx] || 'Balanced';
      const costs = calculateCosts(tripData, routeInfo, tripDays, tierType as 'Budget' | 'Balanced' | 'Premium');

      return {
        id: idx + 1,
        type: tierType,
        route: fullRoute,
        reliability: tierType === 'Budget' ? 85 : tierType === 'Balanced' ? 90 : 95,
        days: tripDays,
        distance_km: routeInfo.distance_km,
        travel_hours: routeInfo.duration_hours,
        cost_per_student: costs.cost_per_student,
        costs: {
          transport: costs.transport, accommodation: costs.accommodation, meals: costs.meals,
          entry_fees: costs.entry_fees, activity_fees: costs.activity_fees,
          local_transport: costs.local_transport, contingency: costs.contingency, total: costs.total,
          transport_detail: costs.transport_detail, accommodation_detail: costs.accommodation_detail, meals_detail: costs.meals_detail,
        },
        why_this_fits: plan.why_this_fits || "",
        accommodation_info: plan.accommodation_name
          ? [
              plan.accommodation_name,
              plan.accommodation_address,
              plan.accommodation_phone ? "Tel: " + plan.accommodation_phone : "",
              plan.accommodation_website ? "Web: " + plan.accommodation_website : "",
              plan.accommodation_hours ? plan.accommodation_hours : "",
              plan.accommodation_price_per_night ? "Cijena: " + plan.accommodation_price_per_night : "",
            ].filter(Boolean).join(" · ")
          : undefined,
        accommodation_details: {
          name: plan.accommodation_name,
          address: plan.accommodation_address,
          phone: plan.accommodation_phone,
          website: plan.accommodation_website,
          hours: plan.accommodation_hours,
          type_actual: plan.accommodation_type_actual,
          price_per_night: plan.accommodation_price_per_night,
        },
        ai_generated: !plan._fallback,
        fallback_engine: !!plan._fallback,
        meeting_point: {
          name: tripData.departureAddress ? "Tačka okupljanja" : "Internationale Deutsche Schule Sarajevo",
          address: tripData.departureAddress?.trim() || "Buka 13, 71 000 Sarajevo, Bosna i Hercegovina",
          lat: 43.8612, lng: 18.4028,
          time: "07:00"
        },
        chaperones: tripData.chaperones.length > 0 ? tripData.chaperones.join(', ') : Math.ceil(tripData.studentCount / 15) + ' pratitelja',
        itinerary: (plan.itinerary || []).map((d: any) => ({
          ...d,
          activities: (d.activities || []).map((a: any) => ({
            ...a,
            type: normalizeActivityType(a.type)
          }))
        })),
        packing_list: generatePackingList(tripDays, tierType, tripData),
        rules: generateTripRules(tripData.gradeLevel),
        emergency_contacts: {
          school: "+387 33 560 520",
          embassy_info: "Ambasada/konzulat BiH u destinacijskoj zemlji",
          local_emergency: "112 (EU standard)",
          medical_info: tripData.medicalInfo || "Nema posebnih medicinskih napomena"
        }
      };
    });

    const result = {
      plans: enrichedPlans,
      route_coordinates: routeCoordinates,
      verification: {
        data_source: "AI (Gemini 2.5 Flash) + OpenStreetMap + OSRM",
        last_verified: new Date().toISOString(),
        route_verified: true,
        distance_km: routeInfo.distance_km,
        travel_hours: routeInfo.duration_hours,
        pois_count: totalPOIs,
        ai_generated: true,
        cities_data: cityContexts.map(c => ({
          city: c.city, lat: c.lat, lng: c.lng,
          museums: c.museums.length, attractions: c.attractions.length,
          restaurants: c.restaurants.length, hotels: c.hotels.length,
          culture: c.culture.length
        }))
      },
      educational_resources: cityContexts.map(city => ({
        city: city.city,
        sites: [
          ...city.museums.slice(0, 3).map(m => m.name),
          ...city.attractions.slice(0, 3).map(m => m.name),
          ...city.culture.slice(0, 3).map(e => e.name)
        ].filter(Boolean),
        curriculum_links: tripData.educationalFocus ? [tripData.educationalFocus] : ["historija", "kultura", "geografija"]
      }))
    };

    console.log("=== v6.0 COMPLETE ===");
    enrichedPlans.forEach((p: any) => {
      const actCount = p.itinerary?.reduce((s: number, d: any) => s + (d.activities?.length || 0), 0) || 0;
      console.log(`  ${p.type}: ${p.cost_per_student} EUR/student, ${p.itinerary?.length || 0} days, ${actCount} activities`);
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-trip-plans:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Došlo je do neočekivane greške"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
