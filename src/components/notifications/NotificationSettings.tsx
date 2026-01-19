import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export const NotificationSettings = () => {
  const { status, subscribe, unsubscribe } = usePushNotifications();

  if (!status.isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Obavijesti
          </CardTitle>
          <CardDescription>
            Vaš preglednik ne podržava push obavijesti.
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
          Push Obavijesti
        </CardTitle>
        <CardDescription>
          Primajte obavijesti o promjenama statusa dozvola i ažuriranjima putovanja.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status.isSubscribed ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ✓ Obavijesti su aktivne. Primit ćete obavijesti o:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Promjenama statusa dozvola roditelja</li>
              <li>Ažuriranjima planova putovanja</li>
              <li>Podsjetnicima za nadolazeća putovanja</li>
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
              Isključi obavijesti
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Omogućite obavijesti kako biste bili obaviješteni o važnim ažuriranjima.
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
              Omogući obavijesti
            </Button>
            {status.permission === 'denied' && (
              <p className="text-sm text-destructive">
                Obavijesti su blokirane u pregledniku. Omogućite ih u postavkama.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
