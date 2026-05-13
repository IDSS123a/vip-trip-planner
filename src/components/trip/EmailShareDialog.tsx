import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Loader2, Users, FileText, Map } from "lucide-react";
import { useTranslation } from "react-i18next";

const emailSchema = z.object({
  recipientEmail: z.string().email("Please enter a valid email address"),
  recipientName: z.string().min(1, "Please enter the recipient's name").max(100),
  recipientType: z.enum(["parent", "teacher", "administration"]),
  template: z.enum(["trip_summary", "detailed_itinerary", "map_overview"]),
  senderName: z.string().optional(),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailShareDialogProps {
  tripId: string;
  tripName: string;
  disabled?: boolean;
}

const EmailShareDialog = ({ tripId, tripName, disabled }: EmailShareDialogProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      recipientEmail: "",
      recipientName: "",
      recipientType: "parent",
      template: "trip_summary",
      senderName: "",
    },
  });

  const handleSendEmail = async (data: EmailFormData) => {
    setIsSending(true);
    try {
      const { data: response, error } = await supabase.functions.invoke("send-trip-email", {
        body: {
          tripId,
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
          recipientType: data.recipientType,
          template: data.template,
          senderName: data.senderName || undefined,
        },
      });

      if (error) throw error;

      if (response?.success) {
        toast({
          title: t("email.sentTitle"),
          description: `${t("email.sentDesc")} ${data.recipientEmail}`,
        });
        form.reset();
        setIsOpen(false);
      } else {
        throw new Error(response?.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        variant: "destructive",
        title: t("email.failedTitle"),
        description: error instanceof Error ? error.message : t("email.failedDesc"),
      });
    } finally {
      setIsSending(false);
    }
  };

  const templateOptions = [
    { value: "trip_summary", label: t("email.tplSummary"), icon: FileText, description: t("email.tplSummaryDesc") },
    { value: "detailed_itinerary", label: t("email.tplItinerary"), icon: FileText, description: t("email.tplItineraryDesc") },
    { value: "map_overview", label: t("email.tplMap"), icon: Map, description: t("email.tplMapDesc") },
  ];

  const recipientOptions = [
    { value: "parent", label: t("email.parent"), icon: Users },
    { value: "teacher", label: t("email.teacher"), icon: Users },
    { value: "administration", label: t("email.administration"), icon: Users },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={disabled}>
          <Mail className="h-4 w-4" />
          {t("email.sendBtn")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {t("email.dialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("email.dialogDesc", { name: tripName })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSendEmail)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email.recipientName")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("email.recipientNamePh")} disabled={isSending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email.recipientEmail")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder={t("email.recipientEmailPh")}
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email.recipientType")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("email.recipientTypePh")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recipientOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email.template")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("email.templatePh")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              {option.label}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="senderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email.senderName")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("email.senderNamePh")}
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSending}
              >
                {t("email.cancel")}
              </Button>
              <Button type="submit" disabled={isSending} className="gap-2">
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("email.sending")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t("email.sendBtn")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EmailShareDialog;
