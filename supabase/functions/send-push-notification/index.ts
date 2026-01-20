import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// VAPID keys for Web Push notifications
const VAPID_PUBLIC_KEY = 'BJ_5QpxrzlQPFZg4VIv_1GS6pgyyutoQnshEUCafrbFfisG96Mbfm1daJmt9Q6havpa4zIwrAEf06MCp-jvHuwo';
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

interface PushNotificationRequest {
  userId?: string;
  tripId?: string;
  type: 'permission_update' | 'trip_update' | 'reminder';
  title: string;
  body: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, tripId, type, title, body }: PushNotificationRequest = await req.json();

    if (!title || !body || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, body, type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get subscriptions for the user(s)
    let query = supabase.from("push_subscriptions").select("*");
    
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions found", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      data: {
        type,
        tripId,
        url: tripId ? `/trip/${tripId}` : "/my-trips",
      },
    });

    let successCount = 0;
    let failCount = 0;
    const usersNotified = new Set<string>();

    for (const subscription of subscriptions) {
      try {
        // Use web-push compatible approach
        // For production, use a proper web-push library
        // This is a simplified version for demonstration
        
        console.log(`Sending notification to user ${subscription.user_id}`);
        
        // In production, you would use web-push library here
        // For now, we'll just log and track the notification
        
        // Save notification to database
        await supabase.from("notifications").insert({
          user_id: subscription.user_id,
          trip_id: tripId || null,
          type,
          title,
          body,
          read: false,
        });

        usersNotified.add(subscription.user_id);
        successCount++;
      } catch (error) {
        console.error(`Failed to send to subscription ${subscription.id}:`, error);
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Notifications processed",
        sent: successCount,
        failed: failCount,
        usersNotified: usersNotified.size,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
