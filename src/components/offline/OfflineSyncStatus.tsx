import { Cloud, CloudOff, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export const OfflineSyncStatus = () => {
  const { syncStatus, syncPendingChanges } = useOfflineSync();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {!syncStatus.isOnline ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="flex items-center gap-1 text-destructive border-destructive">
                <CloudOff className="h-3 w-3" />
                Offline
                {syncStatus.pendingCount > 0 && (
                  <span className="ml-1">({syncStatus.pendingCount})</span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Niste povezani. Promjene se spremaju lokalno.</p>
              {syncStatus.pendingCount > 0 && (
                <p className="text-muted-foreground">
                  {syncStatus.pendingCount} promjena čeka sinkronizaciju.
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ) : syncStatus.isSyncing ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Sinkronizacija...
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sinkronizacija offline promjena u tijeku...</p>
            </TooltipContent>
          </Tooltip>
        ) : syncStatus.pendingCount > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={syncPendingChanges}
                className="flex items-center gap-1 h-6 px-2"
              >
                <Cloud className="h-3 w-3" />
                <span className="text-xs">{syncStatus.pendingCount} za sinkronizaciju</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Kliknite za ručnu sinkronizaciju</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-primary" />
                Online
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Povezani i sinkronizirani</p>
              {syncStatus.lastSyncTime && (
                <p className="text-muted-foreground text-xs">
                  Zadnja sinkronizacija: {syncStatus.lastSyncTime.toLocaleTimeString()}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
