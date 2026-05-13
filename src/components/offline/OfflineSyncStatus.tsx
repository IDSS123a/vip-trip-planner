import { Cloud, CloudOff, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useTranslation } from "react-i18next";

export const OfflineSyncStatus = () => {
  const { syncStatus, syncPendingChanges } = useOfflineSync();
  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {!syncStatus.isOnline ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="flex items-center gap-1 text-destructive border-destructive">
                <CloudOff className="h-3 w-3" />
                {t("offlineSync.offline")}
                {syncStatus.pendingCount > 0 && (
                  <span className="ml-1">({syncStatus.pendingCount})</span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("offlineSync.tooltipOffline")}</p>
              {syncStatus.pendingCount > 0 && (
                <p className="text-muted-foreground">
                  {syncStatus.pendingCount} {t("offlineSync.tooltipPending")}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ) : syncStatus.isSyncing ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                {t("offlineSync.syncing")}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("offlineSync.tooltipSyncing")}</p>
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
                <span className="text-xs">{syncStatus.pendingCount} {t("offlineSync.pendingSync")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("offlineSync.tooltipManual")}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-primary" />
                {t("offlineSync.online")}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("offlineSync.tooltipOnline")}</p>
              {syncStatus.lastSyncTime && (
                <p className="text-muted-foreground text-xs">
                  {t("offlineSync.lastSync")} {syncStatus.lastSyncTime.toLocaleTimeString()}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
