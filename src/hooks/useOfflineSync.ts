import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  initOfflineDB,
  getSyncQueue,
  removeFromSyncQueue,
  updateSyncQueueItem,
  addToSyncQueue,
  cacheTrip,
} from "@/lib/offlineStorage";

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
}

export const useOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
  });
  const { toast } = useToast();
  const syncInProgress = useRef(false);

  // Initialize IndexedDB
  useEffect(() => {
    initOfflineDB().catch(console.error);
    updatePendingCount();
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      toast({
        title: "Povezano!",
        description: "Sinkronizacija offline promjena u tijeku...",
      });
      syncPendingChanges();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      toast({
        variant: "destructive",
        title: "Offline način",
        description: "Promjene će biti spremljene lokalno i sinkronizirane kad se vratite online.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  const updatePendingCount = useCallback(async () => {
    try {
      const queue = await getSyncQueue();
      setSyncStatus(prev => ({ ...prev, pendingCount: queue.length }));
    } catch (error) {
      console.error("Failed to get sync queue:", error);
    }
  }, []);

  const syncPendingChanges = useCallback(async () => {
    if (syncInProgress.current || !navigator.onLine) return;

    syncInProgress.current = true;
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      const queue = await getSyncQueue();
      
      if (queue.length === 0) {
        setSyncStatus(prev => ({ 
          ...prev, 
          isSyncing: false, 
          lastSyncTime: new Date() 
        }));
        syncInProgress.current = false;
        return;
      }

      // Sort by timestamp to process in order
      queue.sort((a, b) => a.timestamp - b.timestamp);

      let successCount = 0;
      let failCount = 0;

      for (const item of queue) {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id || null;

          if (item.action === 'save') {
            const { data, error } = await supabase
              .from("trips")
              .insert({
                user_id: userId,
                ...item.data,
              })
              .select()
              .single();

            if (error) throw error;

            // Cache the synced trip
            if (data) {
              await cacheTrip(data.id, data);
            }
          } else if (item.action === 'update' && item.tripId) {
            const { error } = await supabase
              .from("trips")
              .update(item.data)
              .eq("id", item.tripId);

            if (error) throw error;
          }

          await removeFromSyncQueue(item.id);
          successCount++;
        } catch (error) {
          console.error("Failed to sync item:", item.id, error);
          
          // Increment retry count
          if (item.retries < 3) {
            await updateSyncQueueItem(item.id, { retries: item.retries + 1 });
          } else {
            // Remove after 3 failed attempts
            await removeFromSyncQueue(item.id);
            failCount++;
          }
        }
      }

      await updatePendingCount();

      if (successCount > 0) {
        toast({
          title: "Sinkronizacija završena!",
          description: `${successCount} promjena uspješno sinkronizirano.`,
        });
      }

      if (failCount > 0) {
        toast({
          variant: "destructive",
          title: "Neke promjene nisu sinkronizirane",
          description: `${failCount} promjena nije moglo biti sinkronizirano nakon više pokušaja.`,
        });
      }

      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSyncTime: new Date() 
      }));
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    } finally {
      syncInProgress.current = false;
    }
  }, [toast, updatePendingCount]);

  // Auto-sync on mount if online
  useEffect(() => {
    if (navigator.onLine) {
      syncPendingChanges();
    }
  }, [syncPendingChanges]);

  const queueTripSave = useCallback(async (tripData: any): Promise<string> => {
    const queueId = await addToSyncQueue({
      action: 'save',
      data: tripData,
    });
    await updatePendingCount();
    return queueId;
  }, [updatePendingCount]);

  const queueTripUpdate = useCallback(async (tripId: string, updates: any): Promise<string> => {
    const queueId = await addToSyncQueue({
      action: 'update',
      tripId,
      data: updates,
    });
    await updatePendingCount();
    return queueId;
  }, [updatePendingCount]);

  return {
    syncStatus,
    syncPendingChanges,
    queueTripSave,
    queueTripUpdate,
    updatePendingCount,
  };
};
