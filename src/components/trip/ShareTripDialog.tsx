import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Share2, Copy, Mail, Check, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ShareTripDialogProps {
  shareId: string | null;
  tripName: string;
  isPublic: boolean;
  onMakePublic: () => Promise<void>;
  disabled?: boolean;
}

const ShareTripDialog = ({ 
  shareId, 
  tripName, 
  isPublic, 
  onMakePublic,
  disabled 
}: ShareTripDialogProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const shareUrl = shareId ? `${window.location.origin}/trip/${shareId}` : "";

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: t("share.copied"),
        description: t("share.copiedDesc"),
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("share.copyError"),
      });
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Plan putovanja: ${tripName}`);
    const body = encodeURIComponent(
      `Pozdrav!\n\nDijelim s vama plan putovanja "${tripName}".\n\nPogledajte detalje na: ${shareUrl}\n\nSrdačan pozdrav`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleMakePublic = async () => {
    setIsUpdating(true);
    await onMakePublic();
    setIsUpdating(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={disabled}>
          <Share2 className="h-4 w-4" />
          {t("share.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            {t("share.dialogTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!shareId ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                {t("share.needSave")}
              </p>
            </div>
          ) : (
            <>
              {/* Public toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("share.publicToggle")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("share.publicHint")}
                  </p>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={handleMakePublic}
                  disabled={isUpdating || isPublic}
                />
              </div>

              {/* Share link */}
              {isPublic && (
                <div className="space-y-3">
                  <Label>{t("share.linkLabel")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Share buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={handleCopyLink}
                    >
                      <Link2 className="h-4 w-4" />
                      {t("share.copyLink")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={handleEmailShare}
                    >
                      <Mail className="h-4 w-4" />
                      {t("share.emailBtn")}
                    </Button>
                  </div>
                </div>
              )}

              {!isPublic && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("share.enableHint")}
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTripDialog;
