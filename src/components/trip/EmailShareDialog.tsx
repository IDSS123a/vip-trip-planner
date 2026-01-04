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
          title: "Email Sent!",
          description: `Trip information has been sent to ${data.recipientEmail}`,
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
        title: "Failed to Send",
        description: error instanceof Error ? error.message : "Could not send the email. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const templateOptions = [
    { value: "trip_summary", label: "Trip Summary", icon: FileText, description: "Overview with key details" },
    { value: "detailed_itinerary", label: "Detailed Itinerary", icon: FileText, description: "Day-by-day schedule" },
    { value: "map_overview", label: "Route & Map", icon: Map, description: "Travel route visualization" },
  ];

  const recipientOptions = [
    { value: "parent", label: "Parent/Guardian", icon: Users },
    { value: "teacher", label: "Teacher/Staff", icon: Users },
    { value: "administration", label: "Administration", icon: Users },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={disabled}>
          <Mail className="h-4 w-4" />
          Send Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Share via Email
          </DialogTitle>
          <DialogDescription>
            Send trip details for "{tripName}" via formatted email.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSendEmail)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Smith" disabled={isSending} />
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
                  <FormLabel>Recipient Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="parent@example.com"
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
                  <FormLabel>Recipient Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient type" />
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
                  <FormLabel>Email Template</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select email template" />
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
                  <FormLabel>Your Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Teacher Name"
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSending} className="gap-2">
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Email
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
