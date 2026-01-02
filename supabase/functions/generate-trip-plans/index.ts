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

    // Calculate trip duration
    const startDate = new Date(tripData.departureDate);
    const endDate = new Date(tripData.returnDate);
    const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const systemPrompt = `Ti si stručni planer školskih ekskurzija. Generiraj 3 plana (Budget, Balanced, Premium) u čistom JSON formatu.

KRITIČNO - PRAVILA ZA ODGOVOR:
1. Odgovori SAMO sa validnim JSON objektom - bez markdown, bez \`\`\`
2. Itinerar mora imati TAČNO ${tripDays} dana (od ${tripData.departureDate} do ${tripData.returnDate})
3. Svaki dan ima MAKSIMALNO 5 ključnih aktivnosti (kombinuj sitne aktivnosti)
4. Koristi kratke opise (max 100 karaktera po opisu)
5. Cijena u EUR, realistična za 2026.

JSON STRUKTURA:
{"plans":[{"id":1,"type":"Budget","route":"string","reliability":75,"days":${tripDays},"distance_km":1500,"travel_hours":20,"cost_per_student":400,"costs":{"transport":100,"accommodation":100,"meals":80,"entry_fees":50,"activity_fees":30,"local_transport":20,"contingency":20,"total":400},"why_this_fits":"kratak opis","accommodation_info":"tip smještaja","itinerary":[{"day":1,"title":"naslov dana","activities":[{"time":"08:00-12:00","description":"opis","type":"travel","location":"lokacija","notes":""}]}]}],"route_coordinates":[{"city":"Grad","lat":43.85,"lng":18.41,"order":1}]}`;

    const userPrompt = `Generiraj 3 plana za:
Polazište: ${tripData.departureCity}
Destinacije: ${tripData.destinations.join(' → ')}
Razred: ${tripData.gradeLevel}, Učenika: ${tripData.studentCount}
Pratitelji: ${tripData.chaperones.length > 0 ? tripData.chaperones.join(', ') : 'TBD'}
Prevoz: ${tripData.transport}
Datum: ${tripData.departureDate} - ${tripData.returnDate} (${tripDays} dana)
${tripData.educationalFocus ? `Fokus: ${tripData.educationalFocus}` : ''}
${tripData.specialNeeds ? `Napomene: ${tripData.specialNeeds}` : ''}

Odgovori SAMO JSON, bez teksta prije ili poslije.`;

    console.log("Calling AI Gateway with gemini-2.5-pro for better output handling...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 16000,
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
      console.error("No content in AI response:", JSON.stringify(data));
      throw new Error("No content in AI response");
    }

    console.log("AI response received, length:", content.length, "chars");

    // Parse the JSON from the response - handle various formats
    let plans;
    try {
      // First, try to extract JSON from markdown code blocks
      let jsonString = content;
      
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim();
        console.log("Extracted JSON from markdown block");
      } else {
        // Just clean up the content
        jsonString = content.trim();
      }
      
      // Try to find JSON object if there's extra text
      const jsonStart = jsonString.indexOf('{');
      const jsonEnd = jsonString.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log("Parsing JSON string of length:", jsonString.length);
      plans = JSON.parse(jsonString);
      
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content (first 2000 chars):", content.substring(0, 2000));
      console.error("Raw content (last 500 chars):", content.substring(content.length - 500));
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate the response structure
    if (!plans.plans || !Array.isArray(plans.plans) || plans.plans.length === 0) {
      console.error("Invalid plans structure:", JSON.stringify(plans).substring(0, 500));
      throw new Error("Invalid response structure - no plans array");
    }

    console.log("Successfully generated", plans.plans.length, "trip plans");

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
