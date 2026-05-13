import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTranslation } from "react-i18next";

export const NotificationSettings = () => {
  const { status, subscribe, unsubscribe } = usePushNotifications();
  const { t } = useTranslation();

  if (!status.isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            {t("notifications.title")}
          </CardTitle>
          <CardDescription>
            {t("notifications.unsupported")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t("notifications.title")}
        </CardTitle>
        <CardDescription>
          {t("notifications.desc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status.isSubscribed ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("notifications.activeIntro")}
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>{t("notifications.item1")}</li>
              <li>{t("notifications.item2")}</li>
              <li>{t("notifications.item3")}</li>
            </ul>
            <Button
              variant="outline"
              onClick={unsubscribe}
              disabled={status.isLoading}
            >
              {status.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BellOff className="mr-2 h-4 w-4" />
              )}
              {t("notifications.disable")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("notifications.enableIntro")}
            </p>
            <Button
              onClick={subscribe}
              disabled={status.isLoading}
            >
              {status.isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bell className="mr-2 h-4 w-4" />
              )}
              {t("notifications.enable")}
            </Button>
            {status.permission === 'denied' && (
              <p className="text-sm text-destructive">
                {t("notifications.blocked")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
