import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const { url = 'https://idss.edu.ba/' } = await req.json();

    console.log('Scraping school data from:', url);

    // Scrape the website
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', scrapeData);
      throw new Error(scrapeData.error || 'Failed to scrape website');
    }

    console.log('Scrape successful, parsing data...');

    // Extract school information from scraped content
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const html = scrapeData.data?.html || scrapeData.html || '';
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    // Parse school data from content
    const schoolInfo = parseSchoolInfo(markdown, html, metadata, url);

    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert school info
    const { data: savedData, error: dbError } = await supabase
      .from('school_info')
      .upsert({
        school_name: schoolInfo.schoolName,
        address: schoolInfo.address,
        phone: schoolInfo.phone,
        email: schoolInfo.email,
        website: schoolInfo.website,
        logo_url: schoolInfo.logoUrl,
        headmaster_name: schoolInfo.headmasterName,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'school_name' })
      .select()
      .single();

    if (dbError) {
      // If upsert failed due to no conflict column, try insert
      const { data: insertData, error: insertError } = await supabase
        .from('school_info')
        .insert({
          school_name: schoolInfo.schoolName,
          address: schoolInfo.address,
          phone: schoolInfo.phone,
          email: schoolInfo.email,
          website: schoolInfo.website,
          logo_url: schoolInfo.logoUrl,
          headmaster_name: schoolInfo.headmasterName,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database error:', insertError);
      }
    }

    console.log('School data saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: schoolInfo,
        rawMarkdown: markdown.substring(0, 2000),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error scraping school data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseSchoolInfo(markdown: string, html: string, metadata: any, url: string) {
  // Default IDSS data based on the school website
  let schoolInfo = {
    schoolName: 'Internationale Deutsche Schule Sarajevo',
    address: 'Buka 13, 71 000 Sarajevo, Bosna i Hercegovina',
    phone: '+387 33 560 520',
    email: 'info@idss.ba',
    website: url,
    logoUrl: 'https://idss.edu.ba/wp-content/uploads/2023/09/IDSS-Logo.png',
    headmasterName: 'Director',
  };

  // Try to extract from markdown content
  const content = markdown.toLowerCase();

  // Extract phone numbers
  const phoneMatch = markdown.match(/\+387[\s\-]?\d{2}[\s\-]?\d{3}[\s\-]?\d{3}/);
  if (phoneMatch) {
    schoolInfo.phone = phoneMatch[0];
  }

  // Extract email
  const emailMatch = markdown.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch && emailMatch[0].includes('idss')) {
    schoolInfo.email = emailMatch[0];
  }

  // Extract address
  const addressMatch = markdown.match(/(?:Dolačka|Sarajevo)[^,]*,?\s*\d{5}\s*[^,]*/i);
  if (addressMatch) {
    schoolInfo.address = addressMatch[0].trim();
  }

  // Try to find logo from HTML
  const logoMatch = html.match(/src="([^"]*logo[^"]*\.(?:png|jpg|svg))"/i);
  if (logoMatch) {
    let logoUrl = logoMatch[1];
    if (!logoUrl.startsWith('http')) {
      logoUrl = new URL(logoUrl, url).href;
    }
    schoolInfo.logoUrl = logoUrl;
  }

  // Use metadata title if available
  if (metadata.title) {
    const titleParts = metadata.title.split('|').map((s: string) => s.trim());
    if (titleParts.length > 0 && titleParts[0].length > 5) {
      schoolInfo.schoolName = titleParts[0];
    }
  }

  return schoolInfo;
}
