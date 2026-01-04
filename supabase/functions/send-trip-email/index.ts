import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  tripId: string;
  recipientEmail: string;
  recipientName: string;
  recipientType: 'parent' | 'teacher' | 'administration';
  template: 'trip_summary' | 'detailed_itinerary' | 'map_overview';
  senderName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'RESEND_API_KEY not configured. Please add your Resend API key in settings.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { tripId, recipientEmail, recipientName, recipientType, template, senderName } = await req.json() as EmailRequest;

    if (!tripId || !recipientEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Trip ID and recipient email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get trip data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      console.error('Trip not found:', tripError);
      return new Response(
        JSON.stringify({ success: false, error: 'Trip not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get school info
    const { data: schoolInfo } = await supabase
      .from('school_info')
      .select('*')
      .limit(1)
      .single();

    const school = schoolInfo || {
      school_name: 'IDSS Field Trip Planner',
      email: 'info@idss.edu.ba',
      phone: '+387 33 665 900',
    };

    // Generate email content based on template
    const emailContent = generateEmailContent(trip, template, recipientName, recipientType, school, senderName);

    console.log('Sending email to:', recipientEmail);

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${school.school_name} <onboarding@resend.dev>`,
        to: [recipientEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend error:', result);
      return new Response(
        JSON.stringify({ success: false, error: result.message || 'Failed to send email' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateEmailContent(
  trip: any, 
  template: string, 
  recipientName: string, 
  recipientType: string,
  school: any,
  senderName?: string
) {
  const tripName = trip.name || `${trip.departure_city} → ${trip.destinations?.join(' → ')}`;
  const shareUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/trip/${trip.share_id}`;
  const plansData = trip.plans_data;
  const selectedPlan = plansData?.plans?.[trip.selected_plan_id - 1] || plansData?.plans?.[0];

  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #e07020 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
      .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
      .button { display: inline-block; background: #e07020; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
      .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
      .day-card { background: #f9fafb; border-radius: 8px; padding: 15px; margin: 10px 0; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    </style>
  `;

  let subject = '';
  let html = '';

  switch (template) {
    case 'trip_summary':
      subject = `Field Trip Invitation: ${tripName}`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎒 Field Trip Invitation</h1>
              <p>${tripName}</p>
            </div>
            <div class="content">
              <p>Dear ${recipientName},</p>
              <p>${getRecipientGreeting(recipientType, senderName)}</p>
              
              <div class="info-box">
                <h3>📋 Trip Overview</h3>
                <table>
                  <tr><td><strong>Trip Name:</strong></td><td>${tripName}</td></tr>
                  <tr><td><strong>Departure:</strong></td><td>${trip.departure_city}</td></tr>
                  <tr><td><strong>Destinations:</strong></td><td>${trip.destinations?.join(', ')}</td></tr>
                  <tr><td><strong>Date:</strong></td><td>${trip.departure_date || 'TBD'} ${trip.return_date ? `to ${trip.return_date}` : ''}</td></tr>
                  <tr><td><strong>Students:</strong></td><td>${trip.student_count} students</td></tr>
                  <tr><td><strong>Grade Level:</strong></td><td>${trip.grade_level || 'N/A'}</td></tr>
                  <tr><td><strong>Transportation:</strong></td><td>${trip.transport || 'Bus'}</td></tr>
                </table>
              </div>

              ${selectedPlan ? `
              <h3>💰 Selected Plan: ${selectedPlan.name || 'Standard'}</h3>
              <p><strong>Total Cost:</strong> ${selectedPlan.total_cost || 'See full itinerary'}</p>
              <p><strong>Duration:</strong> ${selectedPlan.days?.length || 0} days</p>
              ` : ''}

              <p style="text-align: center; margin: 30px 0;">
                <a href="${shareUrl}" class="button">View Full Itinerary →</a>
              </p>

              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>Best regards,<br>${senderName || 'The Trip Organizing Team'}</p>
            </div>
            <div class="footer">
              <p>${school.school_name}</p>
              <p>${school.phone} | ${school.email}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;

    case 'detailed_itinerary':
      subject = `Detailed Itinerary: ${tripName}`;
      const days = selectedPlan?.days || [];
      html = `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Detailed Itinerary</h1>
              <p>${tripName}</p>
            </div>
            <div class="content">
              <p>Dear ${recipientName},</p>
              <p>Please find below the detailed day-by-day itinerary for the upcoming field trip.</p>

              ${days.map((day: any, index: number) => `
                <div class="day-card">
                  <h3>Day ${index + 1}: ${day.title || day.date || ''}</h3>
                  ${day.activities?.map((activity: any) => `
                    <p><strong>${activity.time || ''}</strong> - ${activity.activity || activity.description || activity}</p>
                  `).join('') || '<p>Activities to be announced</p>'}
                  ${day.meals ? `<p>🍽️ <strong>Meals:</strong> ${Array.isArray(day.meals) ? day.meals.join(', ') : day.meals}</p>` : ''}
                  ${day.accommodation ? `<p>🏨 <strong>Accommodation:</strong> ${day.accommodation}</p>` : ''}
                </div>
              `).join('')}

              <div class="info-box">
                <h3>📝 Important Notes</h3>
                <ul>
                  <li>Please ensure your child has all necessary documents</li>
                  <li>Pack appropriate clothing and personal items</li>
                  <li>Bring any required medications</li>
                  ${trip.special_needs ? `<li><strong>Special requirements:</strong> ${trip.special_needs}</li>` : ''}
                </ul>
              </div>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${shareUrl}" class="button">View Interactive Itinerary →</a>
              </p>

              <p>Best regards,<br>${senderName || 'The Trip Organizing Team'}</p>
            </div>
            <div class="footer">
              <p>${school.school_name}</p>
              <p>${school.phone} | ${school.email}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;

    case 'map_overview':
      subject = `Route & Map Overview: ${tripName}`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🗺️ Route Overview</h1>
              <p>${tripName}</p>
            </div>
            <div class="content">
              <p>Dear ${recipientName},</p>
              <p>Here's an overview of our travel route for the upcoming field trip.</p>

              <div class="info-box">
                <h3>📍 Travel Route</h3>
                <p><strong>Starting Point:</strong> ${trip.departure_city}</p>
                <p><strong>Destinations:</strong></p>
                <ol>
                  ${trip.destinations?.map((dest: string, i: number) => `<li>${dest}</li>`).join('') || '<li>To be determined</li>'}
                </ol>
                <p><strong>Transportation:</strong> ${trip.transport || 'Bus'}</p>
              </div>

              <p>To view the interactive map with the complete route visualization, please click the button below:</p>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${shareUrl}" class="button">View Interactive Map →</a>
              </p>

              <p>The interactive map includes:</p>
              <ul>
                <li>Complete route visualization</li>
                <li>All stop locations marked</li>
                <li>Distance and travel time estimates</li>
                <li>Points of interest along the way</li>
              </ul>

              <p>Best regards,<br>${senderName || 'The Trip Organizing Team'}</p>
            </div>
            <div class="footer">
              <p>${school.school_name}</p>
              <p>${school.phone} | ${school.email}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;

    default:
      subject = `Field Trip Information: ${tripName}`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎒 Field Trip Information</h1>
            </div>
            <div class="content">
              <p>Dear ${recipientName},</p>
              <p>Please find information about the upcoming field trip: <strong>${tripName}</strong></p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${shareUrl}" class="button">View Trip Details →</a>
              </p>
              <p>Best regards,<br>${senderName || 'The Trip Organizing Team'}</p>
            </div>
            <div class="footer">
              <p>${school.school_name}</p>
            </div>
          </div>
        </body>
        </html>
      `;
  }

  return { subject, html };
}

function getRecipientGreeting(recipientType: string, senderName?: string): string {
  switch (recipientType) {
    case 'parent':
      return `We are excited to inform you about an upcoming field trip for your child. ${senderName ? `${senderName} has organized` : 'We have organized'} an educational experience that we believe will be both fun and enriching.`;
    case 'teacher':
      return `${senderName ? `${senderName} would like to share` : 'We would like to share'} the details of an upcoming field trip with you. Your input and participation would be greatly appreciated.`;
    case 'administration':
      return `Please find below the details of a planned field trip for your review and approval.`;
    default:
      return `We are pleased to share information about an upcoming field trip.`;
  }
}
