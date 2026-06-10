import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
        title: t("offlineSyncToast.connectedTitle"),
        description: t("offlineSyncToast.connectedDesc"),
      });
      syncPendingChanges();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      toast({
        variant: "destructive",
        title: t("offlineSyncToast.offlineTitle"),
        description: t("offlineSyncToast.offlineDesc"),
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

      // ──────────────────────────────────────────────────────────────
      // Conflict resolution: when the same trip was edited offline from
      // multiple clients/tabs, we receive multiple 'update' entries for
      // the same tripId. Strategy = LAST WRITE WINS (latest timestamp).
      // We merge older updates into the newest so the server sees one
      // coherent payload instead of stomping each prior edit individually.
      // ──────────────────────────────────────────────────────────────
      const merged: typeof queue = [];
      const updateByTrip = new Map<string, typeof queue[number]>();
      let conflictCount = 0;
      for (const item of queue) {
        if (item.action === "update" && item.tripId) {
          const existing = updateByTrip.get(item.tripId);
          if (existing) {
            conflictCount++;
            // Merge: later wins on conflicting keys, but earlier non-conflicting
            // fields are preserved.
            const winner = item.timestamp >= existing.timestamp ? item : existing;
            const loser = winner === item ? existing : item;
            const mergedData = { ...loser.data, ...winner.data };
            updateByTrip.set(item.tripId, { ...winner, data: mergedData });
            // Drop the loser from the persisted queue to avoid double-apply
            try { await removeFromSyncQueue(loser.id); } catch { /* noop */ }
          } else {
            updateByTrip.set(item.tripId, item);
          }
        } else {
          merged.push(item);
        }
      }
      for (const v of updateByTrip.values()) merged.push(v);
      merged.sort((a, b) => a.timestamp - b.timestamp);

      if (conflictCount > 0) {
        toast({
          title: t("offlineSyncToast.conflictResolvedTitle"),
          description: t("offlineSyncToast.conflictResolvedDesc", { count: conflictCount }),
        });
      }

      let successCount = 0;
      let failCount = 0;

      for (const item of merged) {
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
          title: t("offlineSyncToast.syncDoneTitle"),
          description: t("offlineSyncToast.syncDoneDesc", { count: successCount }),
        });
      }

      if (failCount > 0) {
        toast({
          variant: "destructive",
          title: t("offlineSyncToast.syncFailTitle"),
          description: t("offlineSyncToast.syncFailDesc", { count: failCount }),
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
