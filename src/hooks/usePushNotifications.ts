import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// VAPID public key for Web Push notifications
const VAPID_PUBLIC_KEY = 'BJ_5QpxrzlQPFZg4VIv_1GS6pgyyutoQnshEUCafrbFfisG96Mbfm1daJmt9Q6havpa4zIwrAEf06MCp-jvHuwo';

interface PushNotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const [status, setStatus] = useState<PushNotificationStatus>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: true,
  });
  const { toast } = useToast();

  // Check if push is supported and current status
  useEffect(() => {
    const checkPushSupport = async () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      
      if (!isSupported) {
        setStatus({
          isSupported: false,
          permission: 'default',
          isSubscribed: false,
          isLoading: false,
        });
        return;
      }

      const permission = Notification.permission;
      
      // Check if already subscribed
      let isSubscribed = false;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await (registration as any).pushManager.getSubscription();
        isSubscribed = !!subscription;
      } catch (error) {
        console.error("Failed to check subscription:", error);
      }

      setStatus({
        isSupported: true,
        permission,
        isSubscribed,
        isLoading: false,
      });
    };

    checkPushSupport();
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!status.isSupported) {
      toast({
        variant: "destructive",
        title: "Obavijesti nisu podržane",
        description: "Vaš preglednik ne podržava push obavijesti.",
      });
      return false;
    }

    setStatus(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setStatus(prev => ({ ...prev, permission, isLoading: false }));
        toast({
          variant: "destructive",
          title: "Dozvola odbijena",
          description: "Morate dozvoliti obavijesti u postavkama preglednika.",
        });
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // Extract keys
      const subscriptionJson = subscription.toJSON();
      const p256dh = subscriptionJson.keys?.p256dh || '';
      const auth = subscriptionJson.keys?.auth || '';

      // Get current user
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (!userId) {
        toast({
          variant: "destructive",
          title: "Morate biti prijavljeni",
          description: "Prijavite se kako biste primali obavijesti.",
        });
        setStatus(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Save subscription to database
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) throw error;

      setStatus({
        isSupported: true,
        permission: 'granted',
        isSubscribed: true,
        isLoading: false,
      });

      toast({
        title: "Obavijesti aktivirane!",
        description: "Primit ćete obavijesti o statusu dozvola i ažuriranjima putovanja.",
      });

      return true;
    } catch (error) {
      console.error("Failed to subscribe:", error);
      setStatus(prev => ({ ...prev, isLoading: false }));
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće aktivirati obavijesti. Pokušajte ponovo.",
      });
      return false;
    }
  }, [status.isSupported, toast]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setStatus(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();

      if (subscription) {
        // Remove from database
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        if (userId) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", userId)
            .eq("endpoint", subscription.endpoint);
        }

        // Unsubscribe from push
        await subscription.unsubscribe();
      }

      setStatus(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      toast({
        title: "Obavijesti deaktivirane",
        description: "Više nećete primati push obavijesti.",
      });

      return true;
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      setStatus(prev => ({ ...prev, isLoading: false }));
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće deaktivirati obavijesti.",
      });
      return false;
    }
  }, [toast]);

  return {
    status,
    subscribe,
    unsubscribe,
  };
};
