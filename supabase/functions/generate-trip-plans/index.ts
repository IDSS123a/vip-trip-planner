import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TripRequest {
  departureCity: string;
  destinations: string[];
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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const tripData: TripRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating trip plans for:", tripData);

    const systemPrompt = `Ti si stručni planer školskih ekskurzija sa detaljnim znanjem o destinacijama u Europi, posebno na Balkanu i centralnoj Europi. Tvoj zadatak je generirati 3 različite opcije plana putovanja: Budget (ekonomična), Balanced (uravnotežena) i Premium (luksuzna).

Za svaku opciju moraš uključiti:
1. Reliability Score (60-95%) - procjena pouzdanosti plana
2. Ukupnu udaljenost u km i vrijeme putovanja
3. Trošak po učeniku u EUR
4. Detaljnu raščlambu troškova:
   - Transport (bus/voz)
   - Smještaj (po noći po osobi)
   - Ishrana (dnevno)
   - Ulaznice
   - Aktivnosti
   - Lokalni transport
   - Rezerva (5%)
5. Detaljan dnevni itinerar sa:
   - Preciznim vremenima (npr. 08:00 AM - 09:30 AM)
   - Konkretnim lokacijama i imenima restorana/hotela
   - Edukativnim opisom svake aktivnosti
   - Napomenama o alergijama i posebnim potrebama

VRLO VAŽNO:
- Koristi stvarne nazive hotela, hostela, restorana koji postoje
- Vremena vožnje moraju biti realistična (prosječno 80 km/h za bus)
- Cijene moraju biti realistične za 2026. godinu
- Uključi pauze za odmor na dugim putovanjima
- Za svakog učenika sa alergijama, navedi kako će se to riješiti na svakom obroku

Odgovori ISKLJUČIVO u JSON formatu bez dodatnog teksta.`;

    const userPrompt = `Generiraj 3 plana putovanja sa sljedećim podacima:

Polazište: ${tripData.departureCity}
Destinacije (ruta): ${tripData.destinations.join(' → ')}
Tip ekskurzije: ${tripData.tripType}
Razred: ${tripData.gradeLevel}
Broj učenika: ${tripData.studentCount}
Pratitelji: ${tripData.chaperones.join(', ')}
Prevoz: ${tripData.transport}
Datum polaska: ${tripData.departureDate}
Datum povratka: ${tripData.returnDate}
${tripData.budget ? `Budžet: ${tripData.budget} EUR` : ''}
Obrazovni fokus: ${tripData.educationalFocus}
Posebne napomene (alergije, potrebe): ${tripData.specialNeeds}

Generiraj JSON odgovor u formatu:
{
  "plans": [
    {
      "id": 1,
      "type": "Budget",
      "route": "string - opis rute",
      "reliability": number (60-95),
      "days": number,
      "distance_km": number,
      "travel_hours": number,
      "cost_per_student": number,
      "costs": {
        "transport": number,
        "accommodation": number,
        "meals": number,
        "entry_fees": number,
        "activity_fees": number,
        "local_transport": number,
        "contingency": number,
        "total": number
      },
      "why_this_fits": "string - zašto ova opcija odgovara",
      "accommodation_info": "string - tip smještaja",
      "itinerary": [
        {
          "day": number,
          "title": "string",
          "activities": [
            {
              "time": "string - npr. 08:00 AM - 09:30 AM",
              "description": "string - detaljan opis aktivnosti",
              "type": "travel|meal|activity|accommodation|free_time",
              "location": "string - naziv lokacije",
              "notes": "string - napomene o alergijama itd"
            }
          ]
        }
      ]
    }
  ],
  "route_coordinates": [
    {
      "city": "string",
      "lat": number,
      "lng": number,
      "order": number
    }
  ],
  "educational_resources": [
    {
      "city": "string",
      "sites": ["string - nazivi POI"]
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response received, parsing JSON...");

    // Parse the JSON from the response
    let plans;
    try {
      // Remove markdown code blocks if present
      const jsonString = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      plans = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    console.log("Successfully generated", plans.plans?.length || 0, "trip plans");

    return new Response(JSON.stringify(plans), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-trip-plans:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
